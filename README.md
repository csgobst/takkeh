# Takkeh Backend

Backend Node.js/Express API.

## Structure
```
takkeh-backend/
├─ server.js              # App entry point
├─ .env                   # Environment variables (not committed)
├─ config/                # Config & setup
├─ controllers/           # Request handlers
├─ routes/                # Express route definitions
├─ services/              # Business logic layer
├─ models/                # Mongoose models & queries
├─ middleware/            # Auth / validation / error handlers
├─ utils/                 # Helpers & utilities
├─ tests/                 # Automated tests
└─ README.md
```

## Environment Variables
Create a `.env` file:
```
PORT=3000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
REFRESH_TOKEN_DAYS=30
```
Security Note: The sample `.env` values (Mongo URI, JWT secret) are for local/dev illustration only. NEVER commit real secrets. Rotate any leaked credentials immediately and use a secret manager (Vault, AWS Secrets Manager, etc.) in production.

## Scripts
- `npm run dev` - start with nodemon
- `npm start` - production start

## Getting Started
1. Install dependencies: `npm install`
2. Run in dev mode: `npm run dev`
3. Visit: http://localhost:3000/health

## Health Check
`GET /health` returns service status.

## Auth & OTP Flows

User categories & separate collections: `customer`, `vendor`, `driver`.

All endpoints are namespaced by user category:
```
/auth/customer/*
/auth/vendor/*
/auth/driver/*
```

### Password Requirement
Signup now requires a password (stored as bcrypt hash). Password is required for login.

### OTP Visibility
OTP codes are NOT returned in responses (server side only). Future implementation will send via email/SMS provider.

Internally each OTP record now stores:
- userType
- userId
- channel (email|phone)
- email (for email channel) or phone (for phone channel)
This allows direct verification using only the email or phone without needing the userId.

### JWT & Progressive Verification
Login is allowed even if the account is not yet fully verified. The issued access token embeds current verification & approval flags so middleware can decide what to allow.

Access token payload fields:
```
uid            Mongo ObjectId of the user
userType       customer | vendor | driver
emailVerified  boolean
phoneVerified  boolean
fullyVerified  emailVerified && phoneVerified
limited        true if (vendor|driver) AND not confirmedAccount yet
iat / exp      Standard JWT issued-at & expiry claims
```

Example protected route that requires full verification:
```
GET /secure/verified-ping
Authorization: Bearer <accessToken>
```
If not fully verified: `403 { message: "Account not fully verified. Please verify email and phone." }`

Use the embedded flags client-side to drive UX (e.g., prompt to verify email/phone, show pending approval banner for vendors/drivers).

### Endpoints (Customer example; replace `customer` with `vendor` or `driver`)

1. Signup
```
POST /auth/customer/signup
{ "name": "John Doe", "email": "john@example.com", "phone": "1234567890", "password": "StrongP@ssw0rd" }
```
Response:
```
{ "user": { ... }, "message": "OTP sent to email (j***@example.com) and phone (12****90). It will expire in 5 minutes." }
```

2. Verify Email
```
POST /auth/customer/verify/email
{ "email": "john@example.com", "code": "123456" }
```

3. Verify Phone
```
POST /auth/customer/verify/phone
{ "phone": "1234567890", "code": "654321" }
```

4. Resend Email OTP
```
POST /auth/customer/resend/email
{ "email": "john@example.com" }
```

5. Resend Phone OTP
```
POST /auth/customer/resend/phone
{ "phone": "1234567890" }
```

6. Login (email or phone + password)
```
POST /auth/customer/login
{ "email": "john@example.com", "password": "StrongP@ssw0rd" }
```
Returns access & refresh tokens. Access TTL: 15 minutes.
Response also includes:
```
fullyVerified: boolean
limited: boolean   # true when vendor/driver not yet approved
message: contextual status string
```

7. Refresh Token
```
POST /auth/customer/refresh
{ "userId": "<id>", "refreshToken": "<token>" }
```

8. Logout
```
POST /auth/customer/logout
{ "userId": "<id>", "refreshToken": "<token>" }
```

### OTP Rules
- Expires in 5 minutes.
- 15 maximum verification attempts per issued OTP.
- 10 maximum resends within active window.
- After expiry or limits: must request a new OTP (resend endpoints).

### Vendor / Driver Confirmation
Field: `confirmedAccount` (false until a Super Admin sets true). Unconfirmed vendor/driver can still login but response includes `limited: true`.

Future admin endpoint (not yet implemented) will toggle `confirmedAccount` and new logins / refresh calls will then produce tokens with `limited: false`.

### Security Notes
- OTP plain storage now for dev only; hash in production.
- JWT secret must remain private.
- Refresh tokens pruned on each update; implement rotation & revoke lists later.

### Future Enhancements
- Hash & salt OTP codes.
- Rate limiting per IP + per user.
- Add email/SMS gateway integration.
- Add admin approval endpoints.
- Password reset & account lockout on brute force.
 - Role-based authorization middleware for differentiated resource access.

## License
MIT
