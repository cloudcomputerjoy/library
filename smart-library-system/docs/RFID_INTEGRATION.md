# 🔐 RFID Card Reader Integration Guide

## 📋 Overview

RFID (Radio Frequency Identification) card reader system for live entry and exit tracking.

**Features:**
- Real-time QR/RFID scanning at gates
- Dual authentication (QR + RFID)
- Live occupancy tracking
- Anomaly detection
- Automatic log creation

---

## 🔌 Hardware Setup

### Recommended RFID Readers
1. **Zebra FX7500 Fixed Reader** (Enterprise)
2. **Impinj Speedway Revolution** (Mid-range)
3. **Arduino + RFID RC522** (Budget/DIY)

### Connection Methods
- **Network:** TCP/IP (Port 8080 - 8090)
- **Serial:** USB/RS-232
- **API:** REST API endpoint from reader software

---

## 🛠️ Backend RFID Service

### File: `src/services/rfidService.js`

```javascript
const axios = require('axios');
const supabase = require('../config/supabase');
require('dotenv').config();

class RFIDService {
  constructor() {
    this.readerURL = process.env.RFID_READER_API_URL;
    this.client = axios.create({
      baseURL: this.readerURL,
      timeout: 5000
    });
  }
  
  // Register RFID card to user
  async assignRFIDCard(userId, rfidCode) {
    try {
      // Check if RFID already assigned
      const { data: existing } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('rfid_code', rfidCode)
        .single();
      
      if (existing && existing.user_id && existing.user_id !== userId) {
        throw new Error('RFID card already assigned to another user');
      }
      
      // Update or create RFID card assignment
      const { data, error } = await supabase
        .from('rfid_cards')
        .upsert({
          rfid_code: rfidCode,
          user_id: userId,
          is_active: true,
          assigned_at: new Date().toISOString()
        }, { onConflict: 'rfid_code' })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update user's RFID card ID
      await supabase
        .from('users')
        .update({ rfid_card_id: rfidCode })
        .eq('id', userId);
      
      return {
        success: true,
        message: 'RFID card assigned successfully',
        rfid_card: data
      };
    } catch (err) {
      console.error('RFID Assignment Error:', err);
      throw err;
    }
  }
  
  // Handle RFID scan event
  async handleRFIDScan(rfidCode, readerLocation, scanType = 'entry') {
    try {
      // Get RFID card details
      const { data: rfidCard, error: cardError } = await supabase
        .from('rfid_cards')
        .select('*, users(*)')
        .eq('rfid_code', rfidCode)
        .eq('is_active', true)
        .single();
      
      if (cardError || !rfidCard) {
        throw new Error('RFID card not found or inactive');
      }
      
      const user = rfidCard.users;
      
      if (!user || user.is_suspended) {
        throw new Error('User not found or suspended');
      }
      
      // Check if user currently inside for exit validation
      if (scanType === 'exit') {
        const { data: recentEntry } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'inside')
          .order('entry_time', { ascending: false })
          .limit(1)
          .single();
        
        if (!recentEntry) {
          throw new Error('No matching entry record found for exit');
        }
      }
      
      // Record RFID scan
      const { data: scanLog, error: scanError } = await supabase
        .from('rfid_scan_logs')
        .insert([{
          rfid_card_id: rfidCard.id,
          user_id: user.id,
          reader_location: readerLocation,
          scan_type: scanType,
          is_valid: true
        }])
        .select()
        .single();
      
      if (scanError) throw scanError;
      
      // Create or update attendance log
      if (scanType === 'entry') {
        const { data: attendanceLog, error: attendanceError } = await supabase
          .from('attendance_logs')
          .insert([{
            user_id: user.id,
            entry_time: new Date().toISOString(),
            entry_method: 'rfid',
            rfid_card_id: rfidCode,
            location: readerLocation,
            status: 'inside'
          }])
          .select()
          .single();
        
        if (attendanceError) throw attendanceError;
        
        return {
          success: true,
          action: 'entry',
          user_name: `${user.first_name} ${user.last_name}`,
          entry_time: attendanceLog.entry_time,
          message: `✅ Entry recorded for ${user.first_name}`
        };
      } else {
        // Exit handling
        const { data: recentEntry } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'inside')
          .order('entry_time', { ascending: false })
          .limit(1)
          .single();
        
        const exitTime = new Date();
        const entryTime = new Date(recentEntry.entry_time);
        const durationMinutes = Math.floor((exitTime - entryTime) / 60000);
        
        const { error: exitError } = await supabase
          .from('attendance_logs')
          .update({
            exit_time: exitTime.toISOString(),
            exit_method: 'rfid',
            duration_minutes: durationMinutes,
            status: 'outside'
          })
          .eq('id', recentEntry.id);
        
        if (exitError) throw exitError;
        
        return {
          success: true,
          action: 'exit',
          user_name: `${user.first_name} ${user.last_name}`,
          exit_time: exitTime.toISOString(),
          duration: `${durationMinutes} minutes`,
          message: `👋 Exit recorded. Duration: ${durationMinutes} minutes`
        };
      }
    } catch (err) {
      console.error('RFID Scan Error:', err);
      
      // Log failed scan
      try {
        await supabase
          .from('rfid_scan_logs')
          .insert([{
            rfid_code: rfidCode,
            reader_location: readerLocation,
            scan_type: scanType,
            is_valid: false,
            error_code: err.message
          }]);
      } catch (logErr) {
        console.error('Failed scan log error:', logErr);
      }
      
      throw err;
    }
  }
  
  // Get all active RFID cards (Admin)
  async getAllRFIDCards(filters = {}) {
    try {
      let query = supabase
        .from('rfid_cards')
        .select('*, users(first_name, last_name, email)', { count: 'exact' });
      
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      
      const { data, count, error } = await query;
      
      if (error) throw error;
      
      return { data, total: count };
    } catch (err) {
      console.error('Get RFID Cards Error:', err);
      throw err;
    }
  }
  
  // Deactivate RFID card
  async deactivateRFIDCard(rfidCardId) {
    try {
      const { error } = await supabase
        .from('rfid_cards')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString()
        })
        .eq('id', rfidCardId);
      
      if (error) throw error;
      
      return { success: true, message: 'RFID card deactivated' };
    } catch (err) {
      console.error('Deactivate RFID Error:', err);
      throw err;
    }
  }
  
  // Get RFID scan logs
  async getRFIDLogs(filters = {}) {
    try {
      let query = supabase
        .from('rfid_scan_logs')
        .select('*, rfid_cards(rfid_code), users(first_name, last_name)', { count: 'exact' });
      
      if (filters.date_from) {
        query = query.gte('timestamp', filters.date_from);
      }
      
      if (filters.date_to) {
        query = query.lte('timestamp', filters.date_to);
      }
      
      if (filters.reader_location) {
        query = query.eq('reader_location', filters.reader_location);
      }
      
      if (filters.scan_type) {
        query = query.eq('scan_type', filters.scan_type);
      }
      
      query = query.order('timestamp', { ascending: false }).limit(500);
      
      const { data, count, error } = await query;
      
      if (error) throw error;
      
      return { data, total: count };
    } catch (err) {
      console.error('Get RFID Logs Error:', err);
      throw err;
    }
  }
  
  // Detect anomalies (Multiple scans in short time, etc.)
  async detectAnomalies() {
    try {
      const { data: suspiciousLogs } = await supabase
        .rpc('detect_rfid_anomalies', {
          time_window_minutes: 5
        });
      
      if (suspiciousLogs && suspiciousLogs.length > 0) {
        // Create admin alerts
        for (const log of suspiciousLogs) {
          await supabase
            .from('admin_alerts')
            .insert([{
              alert_type: 'suspicious_rfid_activity',
              severity: 'medium',
              title: `Suspicious RFID Activity`,
              description: `Multiple scans detected for user ${log.user_name} in short time`,
              related_user_id: log.user_id,
              related_entity_id: log.rfid_card_id
            }]);
        }
      }
      
      return suspiciousLogs;
    } catch (err) {
      console.error('Anomaly Detection Error:', err);
    }
  }
}

module.exports = new RFIDService();
```

### File: `src/routes/rfid.js`

```javascript
const express = require('express');
const router = express.Router();
const rfidController = require('../controllers/rfidController');
const { authenticate, authorize } = require('../middleware/auth');

// Assign RFID to user (Admin)
router.post('/assign', authenticate, authorize('admin'), rfidController.assignRFID);

// RFID card scan event
router.post('/scan', rfidController.handleScan);

// Get RFID logs (Admin)
router.get('/logs', authenticate, authorize('admin', 'librarian'), rfidController.getLogs);

// Get all RFID cards (Admin)
router.get('/cards', authenticate, authorize('admin'), rfidController.getAllCards);

// Deactivate RFID card (Admin)
router.patch('/:rfid_id/deactivate', authenticate, authorize('admin'), rfidController.deactivateCard);

module.exports = router;
```

### File: `src/controllers/rfidController.js`

```javascript
const rfidService = require('../services/rfidService');
const supabase = require('../config/supabase');

class RFIDController {
  async assignRFID(req, res, next) {
    try {
      const { user_id, rfid_code } = req.body;
      
      if (!user_id || !rfid_code) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
        });
      }
      
      const result = await rfidService.assignRFIDCard(user_id, rfid_code);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
  
  async handleScan(req, res, next) {
    try {
      const { rfid_code, reader_location, scan_type } = req.body;
      const io = req.app.get('io');
      
      if (!rfid_code || !reader_location) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
        });
      }
      
      const result = await rfidService.handleRFIDScan(rfid_code, reader_location, scan_type || 'entry');
      
      // Emit real-time event
      io.to('attendance').emit(`${result.action}_success`, {
        user_name: result.user_name,
        [`${result.action}_time`]: result[`${result.action}_time`],
        location: reader_location,
        message: result.message
      });
      
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: { code: 'RFID_SCAN_ERROR', message: err.message }
      });
    }
  }
  
  async getLogs(req, res, next) {
    try {
      const { date_from, date_to, reader_location, scan_type, limit = 100 } = req.query;
      
      const result = await rfidService.getRFIDLogs({
        date_from,
        date_to,
        reader_location,
        scan_type
      });
      
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
  
  async getAllCards(req, res, next) {
    try {
      const { is_active } = req.query;
      
      const result = await rfidService.getAllRFIDCards({
        is_active: is_active === 'true'
      });
      
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
  
  async deactivateCard(req, res, next) {
    try {
      const { rfid_id } = req.params;
      
      const result = await rfidService.deactivateRFIDCard(rfid_id);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RFIDController();
```

---

## 📲 Mobile RFID Integration

### File: `src/services/rfidService.js`

```javascript
import api from './api';
import { Alert } from 'react-native';

class RFIDService {
  async registerRFIDScan(rfidCode, readerLocation, scanType = 'entry') {
    try {
      const response = await api.post('/rfid/scan', {
        rfid_code: rfidCode,
        reader_location: readerLocation,
        scan_type: scanType
      });
      
      return response.data;
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error?.message || 'RFID scan failed');
      throw error;
    }
  }
  
  async getRFIDLogs(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/rfid/logs?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new RFIDService();
```

---

## 🔄 Hardware Reader Integration (Optional)

### Arduino-based RFID Reader

```cpp
// Arduino code for RC522 RFID Reader
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define SS_PIN 5
#define RST_PIN 27
#define READER_LOCATION "Main Gate"

MFRC522 rfid(SS_PIN, RST_PIN);
WiFiClient client;
HTTPClient http;

const char* ssid = "LibraryWiFi";
const char* password = "wifi_password";
const char* serverURL = "http://your-server:3000/api/v1/rfid/scan";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("RFID Reader initialized");
}

void loop() {
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String rfidCode = "";
    
    for (int i = 0; i < rfid.uid.size; i++) {
      rfidCode += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
      rfidCode += String(rfid.uid.uidByte[i], HEX);
    }
    
    rfidCode.toUpperCase();
    
    // Send to server
    if (WiFi.status() == WL_CONNECTED) {
      http.begin(client, serverURL);
      http.addHeader("Content-Type", "application/json");
      
      String jsonPayload = "{\"rfid_code\":\"" + rfidCode + "\",\"reader_location\":\"" + READER_LOCATION + "\",\"scan_type\":\"entry\"}";
      
      int httpResponseCode = http.POST(jsonPayload);
      
      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println("Server Response: " + response);
      } else {
        Serial.print("Error: ");
        Serial.println(httpResponseCode);
      }
      
      http.end();
    }
    
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    
    delay(2000); // Prevent duplicate reads
  }
}
```

---

## ✅ Testing RFID Without Hardware

```bash
# Using curl to simulate RFID scan
curl -X POST http://localhost:3000/api/v1/rfid/scan \
  -H "Content-Type: application/json" \
  -d '{
    "rfid_code": "12345678ABCDEF",
    "reader_location": "Main Gate",
    "scan_type": "entry"
  }'
```

---

## 📊 RFID Monitoring Dashboard

**Admin endpoints for real-time RFID monitoring:**
- Current readers online
- Active RFID cards count
- Live scan feed
- Anomaly alerts
- Reader signal strength
- Scan success rate

