# B2B Node.js SDK Reference

The Crifolayer B2B SDK provides a type-safe Node.js wrapper for interacting with the global API gateway, validating user passports, and pushing verification requests.

---

## 🛠️ Installation

Install the package directly inside your Node.js application:

```bash
npm install @crifolayer/sdk
```

---

## 🔑 Initialization

Initialize the client with your API key. Keys can be generated inside the Developer Portal.

```javascript
const CrifolayerSDK = require('@crifolayer/sdk');

const client = new CrifolayerSDK({
  apiKey: 'tl_sb_acmeapp_8d7f6e52c803ab971e44f32e987c...',
  baseUrl: 'https://api.crifolayer.com/api/v1',
  timeout: 10000, // 10s timeout limit
  maxRetries: 3   // Auto-retry on rate limits (429) or socket timeouts
});
```

---

## 📡 SDK Methods

### 1. Retrieve User Trust Score
Fetch a user's current trust score, category rating, and dynamic score breakdown:

```javascript
const response = await client.getTrustScore('usr_useruuid123');
console.log('Trust Score:', response.data.score);
```

### 2. Decrypt User Identity Passport
Decrypt and download verified profile fields, wallet addresses, and creation timestamps:

```javascript
const response = await client.getPassport('usr_useruuid123');
console.log('Legal Full Name:', response.data.identity.legal_name);
```

### 3. Programmatic Document Verification
Submit base64 document assets (such as passports or driver's licenses) directly into the OCR pipeline:

```javascript
const result = await client.verifyIdentity(
  'usr_useruuid123',
  'PASSPORT',
  'data:image/jpeg;base64,...'
);
console.log('Verification Status:', result.verificationResult.status);
```

### 4. Link Third-Party Integrations
Programmatically attach an integration provider key to recalculate a user's global social weight:

```javascript
const result = await client.linkAccount('usr_useruuid123', 'gitlab', {
  accessToken: 'glpat-xxx'
});
console.log('Link Result:', result.message);
```
