# GDPR Privacy & Compliance Engineering

Crifolayer is built from the ground up with data privacy principles. The platform complies with GDPR and CCPA regulations, offering users complete control over their personal data sharing preferences.

---

## 1. Salting & Ledger Hashing for Account Purges

To satisfy GDPR "Right to Erasure" requirements while protecting the platform from sybil attacks or rating manipulation, users can irreversibly delete their personal profile data.

Before their profile is removed from the production database, their device fingerprint, user ID, and email address are combined and hashed with a secret system salt:

$$\text{ledger\_hash} = \text{SHA256}(\text{fingerprint} \mathbin{\Vert} \text{userId} \mathbin{\Vert} \text{userEmail} \mathbin{\Vert} \text{SYSTEM\_SALT})$$

This immutable ledger hash is stored in the `fraud_prevention_ledger` alongside their historical trust score and flags. If a user deletes their account to bypass a low reputation score, their device fingerprint will match this ledger if they attempt to sign up again.

### Purge Controller Snippet (Node.js)

```javascript
const crypto = require('crypto');

// Account Purge Controller Snippet
const salt = process.env.SYSTEM_SALT || 'crifolayer-global-compliance-salt-2026';
const immutableLedgerHash = crypto
  .createHash('sha256')
  .update(`${fingerprint}:${userId}:${userEmail}:${salt}`)
  .digest('hex');

// Insert hash in ledger
await supabase.from('fraud_prevention_ledger').insert([{
  fingerprint_hash: immutableLedgerHash,
  former_trust_score: trustScore,
  former_fraud_flags: trustScore < 300 ? ['score-gaming-risk'] : []
}]);

// Cascade Delete user profile
await supabase.from('profiles').delete().eq('id', userId);
```

---

## 2. GDPR-Compliant IP Anonymization

To prevent storing PII in consent and action logs, user IP addresses are masked before they are recorded:

```javascript
function maskIpAddress(ip) {
  if (!ip) return '0.0.0.0';
  if (ip === '::1' || ip === '127.0.0.1') return '127.0.0.0';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0'; // Mask final octet for IPv4
      return parts.join('.');
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length > 2) {
      return parts.slice(0, 3).join(':') + '::0'; // Mask subnet for IPv6
    }
  }
  return ip;
}
```
