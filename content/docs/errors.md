# Error Handling & Response Schemas

Crifolayer returns standard, structured JSON errors for all API requests. When a request fails, the gateway responds with an appropriate HTTP status code and a descriptive error body.

---

## 🛑 Error Response Schema

All failed requests share this standard format, making error parsing predictable in client applications:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Retry after 60 seconds.",
    "retry_after": 60
  }
}
```

---

## 📋 Error Code Directory

The following machine-readable error codes are returned by the gateway:

| Machine Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `UNAUTHORIZED` | `401` | Missing, expired, or invalid API key or bearer signature headers. |
| `FORBIDDEN` | `403` | Lacking scope permissions, or the user has revoked access consent. |
| `NOT_FOUND` | `404` | The requested user, developer application, passport, or webhook does not exist. |
| `CONFLICT` | `409` | State conflict, such as linking an integration that is already bound to another profile. |
| `VALIDATION_FAILED` | `422` | The request body validation failed (e.g. missing required params or malformed UUIDs). |
| `RATE_LIMIT_EXCEEDED`| `429` | API request count limit reached. See `retry_after` parameter for cooldown duration. |
| `SERVER_ERROR` | `500` | Internals or third-party providers timed out. Retry with exponential backoff. |
