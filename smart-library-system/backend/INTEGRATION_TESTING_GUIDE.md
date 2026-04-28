# Integration Testing Guide

This guide provides comprehensive testing strategies and examples for the backend integration system.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Setup](#setup)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [End-to-End Tests](#end-to-end-tests)
6. [Test Data](#test-data)
7. [Mocking Strategies](#mocking-strategies)
8. [CI/CD Integration](#cicd-integration)

## Testing Overview

### Test Pyramid

```
        E2E Tests
       (End-to-End)
         
    Integration Tests
  (Component Interactions)
    
      Unit Tests
    (Individual Units)
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage target
- **Integration Tests**: Key workflows
- **E2E Tests**: Critical user paths

## Setup

### Package Dependencies

```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "jest-mock-extended": "^3.0.0",
    "@testing-library/node": "^20.0.0",
    "dotenv": "^16.0.0"
  }
}
```

### Test Configuration

**jest.config.js**:
```javascript
export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testTimeout: 10000,
  verbose: true
};
```

### Test Setup File

**__tests__/setup.js**:
```javascript
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Define globals
global.testConfig = {
  apiUrl: 'http://localhost:3000/api',
  testUser: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  },
  testAdmin: {
    email: 'admin@example.com',
    password: 'AdminPassword123!'
  }
};
```

## Unit Tests

### Test Structure

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Specific functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = { /* test data */ };

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

### Validators Tests

**src/utils/__tests__/validators.test.js**:
```javascript
import {
  validateEmail,
  validatePhoneNumber,
  validateISBN,
  validateAmount,
  sanitizeText,
  validateSchema,
  paymentSchema
} from '../validators.js';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'john.doe@company.co.uk',
        'test+tag@gmail.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        'user@',
        '@example.com',
        'user space@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('should accept valid BD phone numbers', () => {
      const validNumbers = [
        '01700000000',
        '+8801700000000',
        '01711111111'
      ];

      validNumbers.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidNumbers = [
        '1234567890',
        '+1234567890',
        '017'
      ];

      invalidNumbers.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(false);
      });
    });
  });

  describe('validateAmount', () => {
    it('should accept valid amounts', () => {
      expect(validateAmount(100)).toBe(true);
      expect(validateAmount(0.01)).toBe(true);
      expect(validateAmount(999999)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount(-100)).toBe(false);
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount(1000001)).toBe(false);
    });

    it('should accept custom min and max', () => {
      expect(validateAmount(50, 10, 100)).toBe(true);
      expect(validateAmount(5, 10, 100)).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('should remove script tags', () => {
      const dirty = '<script>alert("xss")</script>Hello';
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('Hello');
    });

    it('should remove event handlers', () => {
      const dirty = '<img src=x onerror="alert(\'xss\')">';
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain('onerror');
    });

    it('should remove HTML tags', () => {
      const dirty = '<p>Hello <b>World</b></p>';
      const clean = sanitizeText(dirty);
      expect(clean).toContain('Hello');
      expect(clean).not.toContain('<b>');
    });
  });

  describe('validateSchema', () => {
    it('should validate against schema', () => {
      const validData = {
        amount: 100,
        orderId: 'ORD-001',
        phoneNumber: '01700000000'
      };

      const validation = validateSchema(validData, paymentSchema);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should collect validation errors', () => {
      const invalidData = {
        amount: -10,
        orderId: '',
        phoneNumber: 'invalid'
      };

      const validation = validateSchema(invalidData, paymentSchema);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});
```

### Helpers Tests

**src/utils/__tests__/helpers.test.js**:
```javascript
import {
  generateUUID,
  generateOTP,
  formatCurrency,
  formatDate,
  sortByKey,
  groupByKey,
  deepClone
} from '../helpers.js';

describe('Helpers', () => {
  describe('generateUUID', () => {
    it('should generate valid UUID v4', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(uuid)).toBe(true);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('generateOTP', () => {
    it('should generate OTP of specified length', () => {
      const otp = generateOTP(6);
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it('should generate numeric OTP', () => {
      const otp = generateOTP(4);
      expect(/^\d+$/.test(otp)).toBe(true);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const formatted = formatCurrency(1234.56, 'BDT');
      expect(formatted).toContain('1,234.56');
    });
  });

  describe('sortByKey', () => {
    it('should sort array ascending', () => {
      const data = [
        { name: 'Charlie', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 35 }
      ];

      const sorted = sortByKey(data, 'name', 'asc');
      expect(sorted[0].name).toBe('Alice');
      expect(sorted[1].name).toBe('Bob');
    });

    it('should sort array descending', () => {
      const data = [
        { age: 30 },
        { age: 25 },
        { age: 35 }
      ];

      const sorted = sortByKey(data, 'age', 'desc');
      expect(sorted[0].age).toBe(35);
    });
  });

  describe('groupByKey', () => {
    it('should group array items by key', () => {
      const data = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 }
      ];

      const grouped = groupByKey(data, 'category');
      expect(grouped.A).toHaveLength(2);
      expect(grouped.B).toHaveLength(1);
    });
  });

  describe('deepClone', () => {
    it('should deep clone objects', () => {
      const original = {
        name: 'Test',
        nested: { value: 123 }
      };

      const cloned = deepClone(original);
      cloned.nested.value = 456;

      expect(original.nested.value).toBe(123);
      expect(cloned.nested.value).toBe(456);
    });
  });
});
```

### Error Boundaries Tests

**src/utils/__tests__/errorBoundaries.test.js**:
```javascript
import {
  AppError,
  ValidationError,
  PaymentError,
  errorHandler
} from '../errorBoundaries.js';

describe('Error Boundaries', () => {
  describe('Error Classes', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
    });

    it('should create ValidationError', () => {
      const error = new ValidationError('Invalid input', {
        field: 'email',
        value: 'invalid'
      });

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toBeDefined();
    });

    it('should create PaymentError', () => {
      const error = new PaymentError(
        'Payment declined',
        'bkash',
        'TXN-123'
      );

      expect(error.statusCode).toBe(402);
      expect(error.service).toBe('bkash');
      expect(error.transactionId).toBe('TXN-123');
    });
  });

  describe('Error Handler', () => {
    it('should format error response', () => {
      const req = { path: '/test', method: 'POST', user: { id: '123' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      const error = new ValidationError('Invalid data');
      errorHandler(error, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

## Integration Tests

### Payment Integration Tests

**__tests__/integrations/payment.integration.test.js**:
```javascript
import axios from 'axios';
import { describe, it, expect, beforeAll } from '@jest/globals';

const API = 'http://localhost:3000/api';
let authToken;
let userId;

describe('Payment Integration', () => {
  beforeAll(async () => {
    // Get auth token
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = loginRes.data.data.token;
    userId = loginRes.data.data.userId;
  });

  const headers = () => ({
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  });

  describe('bKash Payment', () => {
    it('should create bKash payment', async () => {
      const response = await axios.post(
        `${API}/integrations/payment/bkash/create`,
        {
          amount: 100,
          orderId: 'TEST-BKASH-001',
          description: 'Test Book Purchase',
          callbackUrl: 'http://localhost:3000/callback'
        },
        { headers: headers() }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('paymentId');
    });

    it('should reject invalid amount', async () => {
      try {
        await axios.post(
          `${API}/integrations/payment/bkash/create`,
          {
            amount: -100,
            orderId: 'TEST-001',
            description: 'Invalid Amount'
          },
          { headers: headers() }
        );
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('Nagad Payment', () => {
    it('should create Nagad payment', async () => {
      const response = await axios.post(
        `${API}/integrations/payment/nagad/create`,
        {
          amount: 200,
          orderId: 'TEST-NAGAD-001',
          description: 'Test Fine Payment',
          callbackUrl: 'http://localhost:3000/callback',
          customerPhone: '01700000000'
        },
        { headers: headers() }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Transaction Recording', () => {
    it('should record successful transaction', async () => {
      // Create payment
      const createRes = await axios.post(
        `${API}/integrations/payment/bkash/create`,
        {
          amount: 150,
          orderId: 'TEST-TXN-001',
          description: 'Record Test'
        },
        { headers: headers() }
      );

      // Execute payment
      await axios.post(
        `${API}/integrations/payment/bkash/execute`,
        { paymentId: createRes.data.data.paymentId },
        { headers: headers() }
      );

      // Verify transaction recorded
      const txnRes = await axios.get(
        `${API}/transactions/${userId}`,
        { headers: headers() }
      );

      expect(txnRes.data.data.length).toBeGreaterThan(0);
    });
  });
});
```

### Email Integration Tests

**__tests__/integrations/email.integration.test.js**:
```javascript
import axios from 'axios';

const API = 'http://localhost:3000/api';

describe('Email Integration', () => {
  let authToken;

  beforeAll(async () => {
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = loginRes.data.data.token;
  });

  const headers = () => ({
    Authorization: `Bearer ${authToken}`
  });

  it('should send email', async () => {
    const response = await axios.post(
      `${API}/integrations/email/send`,
      {
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>This is a test email</p>'
      },
      { headers: headers() }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('messageId');
  });

  it('should validate email configuration', async () => {
    const response = await axios.post(
      `${API}/integrations/email/verify`,
      {},
      { headers: headers() }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it('should reject invalid email address', async () => {
    try {
      await axios.post(
        `${API}/integrations/email/send`,
        {
          to: 'invalid-email',
          subject: 'Test',
          html: '<p>Test</p>'
        },
        { headers: headers() }
      );
    } catch (error) {
      expect(error.response.status).toBe(400);
    }
  });
});
```

### Storage Integration Tests

**__tests__/integrations/storage.integration.test.js**:
```javascript
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API = 'http://localhost:3000/api';

describe('Storage Integration', () => {
  let authToken;

  beforeAll(async () => {
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = loginRes.data.data.token;
  });

  const headers = () => ({
    Authorization: `Bearer ${authToken}`
  });

  it('should upload file', async () => {
    // Create test file
    const testFile = path.join('/tmp/test.txt');
    fs.writeFileSync(testFile, 'Test content');

    const response = await axios.post(
      `${API}/integrations/storage/upload`,
      {
        filePath: testFile,
        fileKey: 'test-files/test.txt',
        contentType: 'text/plain'
      },
      { headers: headers() }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it('should get signed URL', async () => {
    const response = await axios.post(
      `${API}/integrations/storage/signed-url`,
      {
        fileKey: 'test-files/test.txt',
        expiresIn: 3600
      },
      { headers: headers() }
    );

    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('url');
  });

  it('should delete file', async () => {
    const response = await axios.post(
      `${API}/integrations/storage/delete`,
      { fileKey: 'test-files/test.txt' },
      { headers: headers() }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });
});
```

## End-to-End Tests

**__tests__/e2e/library-workflow.e2e.test.js**:
```javascript
import axios from 'axios';

const API = 'http://localhost:3000/api';

describe('E2E: Complete Library Workflow', () => {
  let authToken;
  let userId;
  let bookId;
  let checkoutId;

  it('should complete full checkout and payment workflow', async () => {
    // 1. User Login
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'user@example.com',
      password: 'password123'
    });
    authToken = loginRes.data.data.token;
    userId = loginRes.data.data.userId;

    const headers = { Authorization: `Bearer ${authToken}` };

    // 2. Search Books
    const booksRes = await axios.get(`${API}/books?search=harry`, {
      headers
    });
    expect(booksRes.data.success).toBe(true);
    bookId = booksRes.data.data[0].id;

    // 3. Checkout Book
    const checkoutRes = await axios.post(
      `${API}/checkouts`,
      { bookId, numberOfDays: 14 },
      { headers }
    );
    checkoutId = checkoutRes.data.data.id;
    expect(checkoutRes.data.success).toBe(true);

    // 4. Get Fine  
    const fineRes = await axios.get(
      `${API}/users/${userId}/fines`,
      { headers }
    );
    const fineAmount = fineRes.data.data.total;

    // 5. Process Payment
    const paymentRes = await axios.post(
      `${API}/integrations/payment/bkash/create`,
      {
        amount: fineAmount,
        orderId: `FINE-${checkoutId}`,
        description: 'Fine Payment'
      },
      { headers }
    );
    expect(paymentRes.data.success).toBe(true);

    // 6. Send Confirmation Email
    const emailRes = await axios.post(
      `${API}/integrations/email/send`,
      {
        to: 'user@example.com',
        subject: 'Payment Received',
        html: '<p>Your fine payment has been received</p>'
      },
      { headers }
    );
    expect(emailRes.data.success).toBe(true);
  });
});
```

## Test Data

### Test Fixtures

**__tests__/fixtures/paymentData.js**:
```javascript
export const validPayments = [
  {
    name: 'Small amount',
    data: {
      amount: 10,
      orderId: 'ORD-001',
      description: 'Small payment'
    }
  },
  {
    name: 'Large amount',
    data: {
      amount: 10000,
      orderId: 'ORD-002',
      description: 'Large payment'
    }
  }
];

export const invalidPayments = [
  {
    name: 'Negative amount',
    data: { amount: -100 },
    expectedError: 'VALIDATION_ERROR'
  },
  {
    name: 'Zero amount',
    data: { amount: 0 },
    expectedError: 'VALIDATION_ERROR'
  }
];

export const mockPaymentResponse = {
  success: true,
  data: {
    paymentId: 'PAY-123456',
    amount: 100,
    status: 'initiated',
    timestamp: new Date().toISOString()
  }
};
```

## Mocking Strategies

### Mock External Services

```javascript
import { jest } from '@jest/globals';

// Mock bKash service
jest.mock('../services/integrationConfig.js', () => ({
  BKashService: {
    createPayment: jest.fn().mockResolvedValue({
      paymentId: 'MOCK-PAY-001',
      status: 'initiated'
    }),
    executePayment: jest.fn().mockResolvedValue({
      transactionId: 'MOCK-TXN-001',
      status: 'completed'
    })
  }
}));

// Mock Email service
jest.mock('../services/emailService.js', () => ({
  sendEmail: jest.fn().mockResolvedValue({
    messageId: 'MOCK-MSG-001',
    status: 'sent'
  })
}));
```

## CI/CD Integration

### GitHub Actions Configuration

**.github/workflows/test.yml**:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=utils",
    "test:integration": "jest --testPathPattern=integrations",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

---

## Best Practices

1. **Write tests first (TDD)** - Define behavior before implementation
2. **Clear test names** - Describe what should happen
3. **DRY principle** - Use fixtures and helpers
4. **Isolated tests** - Each test should be independent
5. **Mock external services** - Test behavior, not integration
6. **Comprehensive error testing** - Test error paths
7. **Performance testing** - Monitor test execution time
8. **Documentation** - Document complex test setups

For more information, refer to Jest and Supertest documentation.
