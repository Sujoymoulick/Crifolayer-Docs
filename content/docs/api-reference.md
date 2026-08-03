# Global REST API Gateway Reference

The Crifolayer API provides programmatic access to trust ratings, user passports, verification pipelines, and integration bindings.

---

## 🔒 Gateway Authentication Headers

Requests to all protected endpoints must include these validation headers. Requests failing these checks are dropped before hitting routing layers:

- `X-API-Key`: Your developer application API Key.
- `X-TrustLayer-Signature`: Cryptographic HMAC signature (calculated as: `HMAC_SHA256(timestamp + "." + JSON.stringify(body), API_KEY)`).
- `X-TrustLayer-Timestamp`: UNIX timestamp (in seconds). The server enforces a **5-minute sliding window** to prevent replay attacks.

---

## 🛣️ REST Endpoint Specifications

### 1. Generate Bearer Token
Create a temporary Bearer access token valid for 60 minutes:

- **Method**: `POST`
- **Path**: `/api/v1/auth/token`
- **Request Body**:
  ```json
  {
    "apiKey": "tl_sb_acmeapp_8d7f6e52c803ab971e..."
  }
  ```
- **Response**:
  ```json
  {
    "token_type": "Bearer",
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "expires_in": 3600
  }
  ```

### 2. Retrieve Trust Score
Get a user's calculated trust score, category level, and full evaluation breakdown:

- **Method**: `GET`
- **Path**: `/api/v1/secure/trustscore`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameter**: `userId` (UUID, required)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "4a5779be-7615-424d-b645-5c770755fc36",
      "score": 720,
      "category": "VERIFIED_TRUSTED",
      "breakdown": {
        "identity": 250,
        "financial": 200,
        "developer": 180,
        "professional": 90
      },
      "fraudPenalties": null,
      "updatedAt": "2026-08-04T00:00:00Z"
    }
  }
  ```

### 3. Retrieve User Passport
Download decrypted identity passport fields for the user:

- **Method**: `GET`
- **Path**: `/api/v1/secure/passport`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameter**: `userId` (UUID, required)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "4a5779be-7615-424d-b645-5c770755fc36",
      "email": "user@example.com",
      "fullName": "Jane Doe",
      "walletAddress": "0x123f6e52c803ab971e...",
      "createdAt": "2026-05-18T00:35:49Z"
    }
  }
  ```

### 4. Post Verification Document
Submit verification document payloads to the OCR and validation processing queue:

- **Method**: `POST`
- **Path**: `/api/v1/secure/verify-id`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "userId": "4a5779be-7615-424d-b645-5c770755fc36",
    "documentType": "PASSPORT",
    "documentData": "data:image/jpeg;base64,..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "transactionId": "tx_9f3a2b1c",
    "userId": "4a5779be-7615-424d-b645-5c770755fc36",
    "verificationResult": {
      "status": "VERIFIED",
      "confidenceScore": 0.98,
      "extractedFields": {
        "fullName": "Jane Doe",
        "country": "US",
        "ageVerified": true
      },
      "checkedAt": "2026-08-04T00:00:00Z"
    }
  }
  ```
