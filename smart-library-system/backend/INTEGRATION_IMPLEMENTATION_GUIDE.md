# Backend Integration Implementation Guide

This document provides a comprehensive guide to the backend integration system, detailing all components, architecture, and usage patterns.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Integration Services](#integration-services)
5. [API Endpoints](#api-endpoints)
6. [Error Handling](#error-handling)
7. [Middleware](#middleware)
8. [Utilities](#utilities)
9. [Configuration](#configuration)
10. [Usage Examples](#usage-examples)
11. [Testing](#testing)

## Overview

The backend integration system provides a modular, scalable architecture for integrating external services including:
- **Payment Gateways**: bKash, Nagad
- **Communication**: Email (SMTP), SMS (Twilio)
- **Storage**: Cloudflare R2
- **AI Services**: OpenRouter

Key Features:
- ✅ Centralized configuration management
- ✅ Service initialization and lifecycle management
- ✅ Standardized error handling
- ✅ Input validation and sanitization
- ✅ Rate limiting and abuse protection
- ✅ Comprehensive logging
- ✅ Retry mechanisms with exponential backoff

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Express Application                     │
├─────────────────────────────────────────────────────┤
│  Routes (integrationsRoutes.js)                     │
│  ├─ Configuration Endpoints                         │
│  ├─ Payment Endpoints                               │
│  ├─ Email Endpoints                                 │
│  ├─ SMS Endpoints                                   │
│  ├─ Storage Endpoints                               │
│  └─ AI Endpoints                                    │
├─────────────────────────────────────────────────────┤
│  Middleware Stack                                   │
│  ├─ authRateLimit                                   │
│  ├─ apiRateLimit                                    │
│  ├─ paymentRateLimit                                │
│  ├─ requestLogger                                   │
│  ├─ requestTimer                                    │
│  └─ correlationId                                   │
├─────────────────────────────────────────────────────┤
│  Controller (integrationsController.js)             │
│  ├─ Configuration Management                        │
│  ├─ Payment Processing                              │
│  ├─ Email Sending                                   │
│  ├─ SMS Sending                                     │
│  ├─ Storage Operations                              │
│  └─ AI Integration                                  │
├─────────────────────────────────────────────────────┤
│  Services (integrationConfig.js)                    │
│  ├─ Service Registration                            │
│  ├─ Service Lifecycle Management                    │
│  ├─ Service Connection Testing                      │
│  └─ Configuration Validation                        │
├─────────────────────────────────────────────────────┤
│  External Services                                  │
│  ├─ bKashService                                    │
│  ├─ NagadService                                    │
│  ├─ EmailService (SMTP)                             │
│  ├─ SMSService (Twilio)                             │
│  ├─ StorageService (Cloudflare R2)                  │
│  └─ AIService (OpenRouter)                          │
└─────────────────────────────────────────────────────┘
```

## Components

### 1. Integration Routes (`integrationsRoutes.js`)
Defines all API endpoints with proper authentication and rate limiting.

**Structure**:
- Configuration routes (GET, POST)
- Payment routes (POST)
- Email routes (POST)
- SMS routes (POST)
- Storage routes (POST)
- AI routes (POST)

### 2. Integration Controller (`integrationsController.js`)
Handles request processing and service orchestration.

**Components**:
- Configuration Management
- Payment Integration
- Email Integration
- SMS Integration
- Storage Integration
- AI Integration

### 3. Integration Config Service (`integrationConfig.js`)
Manages service instances and lifecycle.

**Responsibilities**:
- Service registration and initialization
- Configuration validation
- Environment variable loading
- Service connection testing
- Error handling

### 4. Error Boundaries (`errorBoundaries.js`)
Custom error classes and global error handler.

**Error Classes**:
- `AppError` - Base error class
- `ValidationError` - Input validation errors
- `AuthenticationError` - Auth failures
- `AuthorizationError` - Permission denied
- `NotFoundError` - Resource not found
- `ConflictError` - Data conflicts
- `RateLimitError` - Rate limit exceeded
- `IntegrationError` - External service errors
- `DatabaseError` - Database operation errors
- `PaymentError` - Payment failures
- `FileOperationError` - File operation failures

### 5. Validators (`validators.js`)
Input validation and data sanitization.

**Functions**:
- `validateEmail()` - Email format validation
- `validatePhoneNumber()` - Phone number validation
- `validateURL()` - URL validation
- `validateAmount()` - Payment amount validation
- `validateISBN()` - ISBN validation
- `sanitizeText()` - XSS protection
- `validateSchema()` - Object validation against schema
- `validateAndSanitize()` - Combined validation and sanitization

**Predefined Schemas**:
- `paymentSchema` - Payment data validation
- `userSchema` - User data validation
- `bookSchema` - Book data validation

### 6. Helpers (`helpers.js`)
Utility functions for common operations.

**Categories**:
- UUID and random generation
- Password hashing/comparison
- Currency and date formatting
- Array operations (chunk, flatten, deduplicate, sort, group)
- Object operations (merge, clone, pick, omit)
- String operations (truncate, capitalize, slug)
- Function utilities (debounce, throttle)

### 7. Rate Limiting Middleware (`rateLimiting.js`)
Protection against abuse with configurable limits.

**Rate Limiters**:
- `authRateLimit` - 5 requests per 15 minutes
- `apiRateLimit` - 30 requests per 1 minute
- `paymentRateLimit` - 20 requests per 1 hour
- `uploadRateLimit` - 10 uploads per 1 hour
- `searchRateLimit` - 20 requests per 1 minute

### 8. Logging Middleware (`logging.js`)
Comprehensive request and response logging.

**Features**:
- Request logging with headers and body
- Response logging with status code
- Timing analysis for slow requests
- Error logging
- Structured logging utilities
- API call logging
- Database query logging

## Integration Services

### Payment Gateway - bKash

```javascript
// Create payment
POST /api/integrations/payment/bkash/create
{
  "amount": 100,
  "orderId": "ORD-001",
  "description": "Fine Payment",
  "callbackUrl": "https://app.com/callback"
}

// Execute payment
POST /api/integrations/payment/bkash/execute
{
  "paymentId": "123456789"
}
```

### Payment Gateway - Nagad

```javascript
// Create payment
POST /api/integrations/payment/nagad/create
{
  "amount": 100,
  "orderId": "ORD-001",
  "description": "Book Purchase",
  "callbackUrl": "https://app.com/callback",
  "customerPhone": "01700000000"
}

// Complete payment
POST /api/integrations/payment/nagad/complete
{
  "sessionId": "SESSION-001"
}
```

### Email Service (SMTP)

```javascript
// Send email
POST /api/integrations/email/send
{
  "to": "user@example.com",
  "subject": "Password Reset",
  "html": "<p>Click to reset your password</p>"
}

// Verify configuration
POST /api/integrations/email/verify
// Returns: { success: true, message: "Email service is operational" }
```

### SMS Service (Twilio)

```javascript
// Send SMS
POST /api/integrations/sms/send
{
  "to": "+8801700000000",
  "message": "Your OTP is: 123456"
}

// Verify configuration
POST /api/integrations/sms/verify
// Returns: { success: true, message: "SMS service is operational" }
```

### Storage Service (Cloudflare R2)

```javascript
// Upload file
POST /api/integrations/storage/upload
{
  "filePath": "/path/to/file.pdf",
  "fileKey": "documents/file-renamed.pdf",
  "contentType": "application/pdf"
}

// Delete file
POST /api/integrations/storage/delete
{
  "fileKey": "documents/file-renamed.pdf"
}

// Get signed URL
POST /api/integrations/storage/signed-url
{
  "fileKey": "documents/file-renamed.pdf",
  "expiresIn": 3600 // seconds
}
```

### AI Service (OpenRouter)

```javascript
// Chat
POST /api/integrations/ai/chat
{
  "messages": [
    { "role": "user", "content": "Recommend a book" }
  ],
  "temperature": 0.7,
  "maxTokens": 1000
}

// Book recommendation
POST /api/integrations/ai/recommendation
{
  "bookTitle": "The Great Gatsby",
  "genre": "fiction",
  "userPreferences": "mystery, adventure"
}

// Verify configuration
POST /api/integrations/ai/verify
// Returns: { success: true, message: "AI service is operational" }
```

## API Endpoints

### Configuration Management

```javascript
// Get current configuration
GET /api/integrations/config
// Requires: admin role

// Update configuration
POST /api/integrations/config
{
  "config": {
    "bkashEnabled": true,
    "bkashMode": "sandbox",
    "nagadEnabled": true,
    "smtpEnabled": true,
    "twilioEnabled": true,
    "cloudflarR2Enabled": true,
    "openRouterEnabled": true
  }
}
// Requires: admin role

// Test all integrations
POST /api/integrations/test
// Requires: admin role
// Returns: test results for all services
```

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

## Error Handling

### Error Hierarchy

```
AppError (Base)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── RateLimitError (429)
├── IntegrationError (503)
├── DatabaseError (500)
├── PaymentError (402)
└── FileOperationError (500)
```

### Global Error Handler

```javascript
import { errorHandler } from './utils/errorBoundaries.js';

// Add as last middleware
app.use(errorHandler);
```

### Usage Example

```javascript
import { ValidationError } from './utils/errorBoundaries.js';

throw new ValidationError('Invalid email format', {
  field: 'email',
  value: 'invalid-email'
});
```

## Middleware

### Rate Limiting

```javascript
import { 
  authRateLimit, 
  paymentRateLimit 
} from './middleware/rateLimiting.js';

// Apply to routes
router.post('/auth/login', authRateLimit, loginHandler);
router.post('/payment/create', paymentRateLimit, createPaymentHandler);
```

### Request Logging

```javascript
import {
  requestLogger,
  requestTimer,
  correlationId
} from './middleware/logging.js';

// Add to Express app
app.use(correlationId);
app.use(requestLogger);
app.use(requestTimer);
```

### Custom Rate Limiter

```javascript
import { createRateLimiter } from './middleware/rateLimiting.js';

const customLimit = createRateLimiter('custom-endpoint', {
  windowMs: 60 * 1000,
  maxRequests: 50
});

router.post('/custom', customLimit, handler);
```

## Utilities

### Validators Usage

```javascript
import {
  validateEmail,
  validateSchema,
  paymentSchema
} from './utils/validators.js';

// Simple validation
if (!validateEmail(email)) {
  throw new ValidationError('Invalid email');
}

// Schema validation  
const validation = validateSchema(data, paymentSchema);
if (!validation.valid) {
  throw new ValidationError('Invalid payment data', validation.errors);
}
```

### Helpers Usage

```javascript
import {
  generateUUID,
  formatCurrency,
  generateOTP,
  debounce
} from './utils/helpers.js';

const userId = generateUUID();
const otp = generateOTP(6);
const price = formatCurrency(100); // 100.00 BDT
```

## Configuration

### Environment Variables

```bash
# Payment Gateway
BKASH_API_KEY=your_key
BKASH_API_SECRET=your_secret
BKASH_MODE=sandbox|production

NAGAD_API_KEY=your_key
NAGAD_API_SECRET=your_secret
NAGAD_MODE=sandbox|production

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password
SMTP_FROM=noreply@library.com

# SMS Service
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Storage
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret
CLOUDFLARE_BUCKET_NAME=your_bucket

# AI Service
OPENROUTER_API_KEY=your_api_key
OPENROUTER_MODEL=openai/gpt-3.5-turbo

# Logging
DEBUG=false|true
TRACE=false|true
LOG_REQUEST_BODY=false|true
LOG_RESPONSE_BODY=false|true
```

### Service Configuration File

```javascript
// config/integrations.json
{
  "bkash": {
    "enabled": true,
    "mode": "sandbox",
    "timeout": 30000,
    "retries": 3
  },
  "nagad": {
    "enabled": true,
    "mode": "sandbox",
    "timeout": 30000,
    "retries": 3
  },
  "email": {
    "enabled": true,
    "provider": "smtp",
    "timeout": 10000
  },
  "sms": {
    "enabled": true,
    "provider": "twilio",
    "timeout": 10000
  },
  "storage": {
    "enabled": true,
    "provider": "cloudflare_r2",
    "timeout": 30000
  },
  "ai": {
    "enabled": true,
    "provider": "openrouter",
    "timeout": 30000,
    "maxRetries": 3
  }
}
```

## Usage Examples

### Complete Payment Flow

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const TOKEN = 'your_jwt_token';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

// 1. Create payment
const createResponse = await axios.post(
  `${API_URL}/integrations/payment/bkash/create`,
  {
    amount: 500,
    orderId: 'ORDER-001',
    description: 'Book Fine Payment',
    callbackUrl: 'https://app.com/payment/callback'
  },
  { headers }
);

const { paymentId } = createResponse.data.data;

// 2. Execute payment
const executeResponse = await axios.post(
  `${API_URL}/integrations/payment/bkash/execute`,
  { paymentId },
  { headers }
);

console.log('Payment successful:', executeResponse.data.data);
```

### Send Email Example

```javascript
// Send notification email
const response = await axios.post(
  `${API_URL}/integrations/email/send`,
  {
    to: 'user@example.com',
    subject: 'Book Available',
    html: '<p>The book you requested is now available</p>'
  },
  { headers }
);
```

### Upload File Example

```javascript
// Upload document
const response = await axios.post(
  `${API_URL}/integrations/storage/upload`,
  {
    filePath: '/uploads/document.pdf',
    fileKey: 'documents/user-docs/document.pdf',
    contentType: 'application/pdf'
  },
  { headers }
);

// Get signed URL for download
const urlResponse = await axios.post(
  `${API_URL}/integrations/storage/signed-url`,
  {
    fileKey: 'documents/user-docs/document.pdf',
    expiresIn: 3600
  },
  { headers }
);

console.log('Download URL:', urlResponse.data.data.url);
```

### AI Recommendation Example

```javascript
// Get book recommendation
const response = await axios.post(
  `${API_URL}/integrations/ai/recommendation`,
  {
    bookTitle: 'The Last Guardian',
    genre: 'fantasy',
    userPreferences: 'adventure, mythology, magic'
  },
  { headers }
);

console.log('Recommendations:', response.data.data.recommendations);
```

## Testing

### Unit Testing Example

```javascript
import { validateEmail, generateOTP } from '../utils/validators.js';
import { describe, it, expect } from '@jest/globals';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
  });
});

describe('Helpers', () => {
  describe('generateOTP', () => {
    it('should generate 6-digit OTP', () => {
      const otp = generateOTP(6);
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });
  });
});
```

### Integration Testing Example

```javascript
import axios from 'axios';
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Integration API', () => {
  const API = 'http://localhost:3000/api/integrations';
  let authToken;

  beforeAll(async () => {
    // Get auth token
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });
    authToken = response.data.data.token;
  });

  describe('Configuration', () => {
    it('should get current configuration', async () => {
      const response = await axios.get(`${API}/config`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('bkashEnabled');
    });

    it('should test all integrations', async () => {
      const response = await axios.post(`${API}/test`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.tests)).toBe(true);
    });
  });

  describe('Payments', () => {
    it('should create bKash payment', async () => {
      const response = await axios.post(
        `${API}/payment/bkash/create`,
        {
          amount: 100,
          orderId: 'TEST-001',
          description: 'Test Payment',
          callbackUrl: 'http://localhost:3000/callback'
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
});
```

---

## Summary

The backend integration system provides:

1. **Modular Design** - Each service is independently managed
2. **Error Handling** - Comprehensive error classes with proper HTTP status codes
3. **Security** - Rate limiting, input validation, XSS protection
4. **Logging** - Request/response logging for debugging
5. **Scalability** - Easy to add new services
6. **Testing** - Comprehensive test coverage

For questions or contributions, refer to the main README.md file.
