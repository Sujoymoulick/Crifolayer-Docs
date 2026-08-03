# Webhooks Integration Guide

Webhooks send real-time event updates from Crifolayer directly to your application backend as JSON payloads. This enables asynchronous updates without polling the API.

---

## 🛡️ Signature Verification

Each webhook payload is signed with your specific webhook secret. To verify that requests originate from Crifolayer and have not been altered, verify this signature in your server controller:

```javascript
// Webhook Signature Verification Example (Node.js/Express)
const crypto = require('crypto');
const express = require('express');
const app = express();

app.post('/webhooks/trustlayer', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-trustlayer-signature'];
  const secret = process.env.TRUSTLAYER_WEBHOOK_SECRET;
  
  const computed = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (signature !== computed) {
    return res.status(401).send('Signature verification failed.');
  }

  // Process verified webhook payload
  const { event, data } = JSON.parse(req.body);
  console.log(`Received event: ${event}`, data);
  res.sendStatus(200);
});
```

---

## 🔔 Supported Webhook Events

The following event types are triggered during user lifecycle and reputation transitions:

| Event Name | Description | Payload Data Fields |
| :--- | :--- | :--- |
| `trust.score.updated` | Triggered when a user's trust score increases, decreases, or resets. | `userId`, `oldScore`, `newScore`, `category`, `updatedAt` |
| `fraud.detected` | Fired when the graph database identifies collusion, circular flows, or sybil signs. | `userId`, `riskLevel`, `fraudFlags`, `detectedAt` |
| `identity.verified` | Fired when document validation has successfully processed through OCR. | `userId`, `transactionId`, `documentType`, `verifiedAt` |
| `passport.updated` | Triggered when fields on a decrypted profile passport change. | `userId`, `updatedFields`, `updatedAt` |
