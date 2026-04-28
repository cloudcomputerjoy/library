# Student Sign-up Customization Guide

This document explains how to customize the student sign-up process, including phone number validation and allowed email domains.

## Features

### 1. Phone Number Validation (11 Digits)
- **Format**: 11-digit Bangladesh mobile number
- **Examples**: 01712345678, 01634567890
- **Validation**: Checks for exactly 11 digits
- **Requirement**: Phone number is now mandatory for students

### 2. Email Domain Restriction
- **Allowed Domains**: Only institutional email domains
- **Default Domains**:
  - `@aaub.edu.bd` (American University of Bangladesh)
  - `@aiub.edu.bd` (American International University-Bangladesh)
- **Customizable**: Via admin API or environment variables

---

## Configuration

### Option 1: Environment Variables (Easiest)

#### Backend (.env)
```
ALLOWED_INSTITUTION_DOMAINS=@aaub.edu.bd,@aiub.edu.bd,@du.edu.bd,@bracu.ac.bd
```

#### Mobile App (.env)
```
EXPO_PUBLIC_ALLOWED_DOMAINS=@aaub.edu.bd,@aiub.edu.bd,@du.edu.bd,@bracu.ac.bd
```

**Benefits**: 
- No restart needed for mobile
- Quick configuration
- Easy to test different domains

---

### Option 2: Admin API (Dynamic Management)

#### Get Current Domains
```bash
GET /api/admin/settings/institution-domains

Response:
{
  "success": true,
  "domains": ["@aaub.edu.bd", "@aiub.edu.bd"],
  "message": "Institution domains retrieved successfully"
}
```

#### Set Domains (Replace All)
```bash
POST /api/admin/settings/institution-domains

Request Body:
{
  "domains": ["@aaub.edu.bd", "@aiub.edu.bd", "@du.edu.bd"]
}

Response:
{
  "success": true,
  "domains": ["@aaub.edu.bd", "@aiub.edu.bd", "@du.edu.bd"],
  "message": "3 domain(s) configured successfully"
}
```

#### Update Domains (Add/Modify)
```bash
PUT /api/admin/settings/institution-domains

Request Body:
{
  "domains": ["@du.edu.bd", "@bracu.ac.bd"]
}

Response:
{
  "success": true,
  "domains": ["@du.edu.bd", "@bracu.ac.bd"],
  "message": "2 domain(s) added/updated successfully"
}
```

#### Delete a Domain
```bash
DELETE /api/admin/settings/institution-domains/@aaub.edu.bd

Response:
{
  "success": true,
  "message": "Domain @aaub.edu.bd deleted successfully"
}
```

---

## Sign-Up Flow

### User Steps
1. User navigates to Sign-Up screen
2. Enters institutional email (e.g., `student@aaub.edu.bd`)
3. Validation checks:
   - ✅ Valid email format
   - ✅ Domain is in allowed list
   - ❌ If domain not allowed, shows: "Email must be from: @aaub.edu.bd, @aiub.edu.bd"
4. Enters 11-digit phone number (e.g., `01712345678`)
5. Validation checks:
   - ✅ Exactly 11 digits
   - ✅ No special characters allowed
   - ❌ If invalid, shows: "Please enter a valid 11-digit phone number"
6. Sets password (min 8 characters)
7. Fills remaining fields
8. Accepts terms & conditions
9. Clicks "Sign Up"

### Backend Validation
The backend MUST also validate the email domain on sign-up:

```javascript
// In authentication/registration controller
const allowedDomains = process.env.ALLOWED_INSTITUTION_DOMAINS.split(',');
const userDomain = email.substring(email.indexOf('@'));

if (!allowedDomains.find(d => d.trim().toLowerCase() === userDomain.toLowerCase())) {
  return res.status(400).json({
    error: 'Email domain not allowed for registration'
  });
}
```

---

## Adding More Institutions

### Step 1: Get Admin Access
- Contact system administrator
- Request admin credentials

### Step 2: Update Configuration via API
```bash
curl -X POST https://your-api.com/api/admin/settings/institution-domains \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domains": [
      "@aaub.edu.bd",
      "@aiub.edu.bd",
      "@du.edu.bd",
      "@bracu.ac.bd",
      "@eub.edu.bd",
      "@northsouth.edu.bd"
    ]
  }'
```

### Step 3: Restart Services (if using environment variables)
- Update `.env` files
- Restart backend: `npm restart`
- Restart mobile: `npx expo start --clear`

---

## Validation Rules

### Email Validation
```
✅ Valid Examples:
- student@aaub.edu.bd
- ali.khan@aiub.edu.bd
- 20210101@du.edu.bd

❌ Invalid Examples:
- student@gmail.com (non-institutional)
- student@aaub.edu (missing .bd)
- @aaub.edu.bd (no username)
- student aaub.edu.bd (missing @)
```

### Phone Number Validation
```
✅ Valid Examples:
- 01712345678
- 01934567890
- 0171 234 5678 (spaces removed)
- +8801712345678 (converted)

❌ Invalid Examples:
- 0171234567 (10 digits - too short)
- 017123456789 (12 digits - too long)
- +1-201-555-0123 (US format)
- (017) 1234 5678 (with parentheses)
```

---

## Testing

### Test 1: Valid Sign-Up
```
Email: student@aaub.edu.bd
Phone: 01712345678
Password: SecurePass123
Expected: Success ✅
```

### Test 2: Invalid Domain
```
Email: student@gmail.com
Phone: 01712345678
Password: SecurePass123
Expected: "Email must be from: @aaub.edu.bd, @aiub.edu.bd" ❌
```

### Test 3: Invalid Phone (Too Short)
```
Email: student@aaub.edu.bd
Phone: 0171234567
Password: SecurePass123
Expected: "Please enter a valid 11-digit phone number" ❌
```

### Test 4: Invalid Phone (Too Long)
```
Email: student@aaub.edu.bd
Phone: 017123456789
Password: SecurePass123
Expected: "Please enter a valid 11-digit phone number" ❌
```

---

## Database Schema (Future Implementation)

For persistent domain management in database:

```sql
CREATE TABLE system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert allowed domains
INSERT INTO system_settings (key, value) 
VALUES ('allowed_institution_domains', 
  JSON_ARRAY('@aaub.edu.bd', '@aiub.edu.bd'));
```

---

## Security Considerations

1. **Backend Validation**: Always validate both email and phone on the server
2. **Domain Whitelist**: Use whitelist approach (only allowed domains), not blacklist
3. **Rate Limiting**: Implement rate limiting on sign-up API
4. **Email Verification**: Send verification email to confirm institutional email
5. **Phone Verification**: (Optional) SMS verification for phone numbers
6. **Admin Access**: Restrict domain management to authenticated admins only

---

## Future Enhancements

- [ ] Email verification via institutional email
- [ ] SMS verification for phone numbers
- [ ] Country-specific phone format validation
- [ ] Dynamic domain addition without restart
- [ ] Admin dashboard for domain management
- [ ] Bulk domain import/export
- [ ] Domain-specific sign-up rules
- [ ] Audit logs for domain changes

---

## Support

For issues or questions:
- Email: admin@smartlibrary.edu.bd
- Support Portal: https://support.smartlibrary.edu.bd
- Documentation: https://docs.smartlibrary.edu.bd

