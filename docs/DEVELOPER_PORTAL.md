# SwiftPay Developer Portal

Welcome to the SwiftPay M-Pesa Integration Developer Portal. This portal provides all resources needed to integrate reliable M-Pesa payment verification into your projects.

## 🚀 Quick Start

### For Your Own Projects

**Option 1: Direct Integration (Recommended)**

Use the M-Pesa verification utility directly in your project:

```javascript
import { verifyMpesaPayment } from './lib/mpesa-verification.js';

// Credentials are loaded from .env file (NEVER hardcode them!)
const result = await verifyMpesaPayment(checkoutId, {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
  passkey: process.env.MPESA_PASSKEY
});

if (result.success) {
  console.log('Payment confirmed!');
}
```

**⚠️ IMPORTANT:** Never expose credentials in code or documentation. Always use environment variables.

**Setup Time:** 5 minutes
**Documentation:** See [M-Pesa Verification Guide](#documentation)

---

### For Client Projects (Using Your Proxy)

**Option 2: Proxy Endpoint (Secure - NO CREDENTIALS NEEDED)**

Other developers use your proxy endpoint WITHOUT needing your M-Pesa credentials:

```javascript
// ✅ Client projects ONLY need:
// 1. Proxy endpoint URL (you provide)
// 2. API key (you provide)
// 3. CheckoutID from their SwiftPay payment

const response = await fetch('https://your-server.com/api/mpesa-verification-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    checkoutId: 'ws_CO_14122025231025749795704273',
    apiKey: 'api-key-you-gave-them'
  })
});

const data = await response.json();
if (data.payment.status === 'success') {
  console.log('Payment confirmed!');
}
```

**⚠️ KEY POINT:** Clients NEVER see your M-Pesa credentials. Your server handles all credential management securely.

**What You Provide to Clients:**
- ✅ Proxy endpoint URL
- ✅ API key
- ✅ Documentation (MPESA_PROXY_CLIENT_GUIDE.md)

**What You Keep Secret:**
- ❌ MPESA_CONSUMER_KEY
- ❌ MPESA_CONSUMER_SECRET
- ❌ MPESA_BUSINESS_SHORT_CODE
- ❌ MPESA_PASSKEY

**Setup Time:** 3 minutes (for clients)
**Documentation:** See [Proxy Client Guide](#documentation)

---

## 📚 Documentation

### Core Resources

| Document | Purpose | Audience | Time |
|----------|---------|----------|------|
| [M-Pesa Verification Guide](./MPESA_VERIFICATION_GUIDE.md) | Complete API reference & examples | Developers | 30 min |
| [M-Pesa Quick Reference](./MPESA_QUICK_REFERENCE.md) | Fast lookup guide | Developers | 5 min |
| [Proxy Client Guide](./MPESA_PROXY_CLIENT_GUIDE.md) | How to use proxy endpoint | Client Projects | 15 min |
| [Proxy Setup Guide](./MPESA_PROXY_SETUP.md) | How to deploy proxy | DevOps/Backend | 20 min |

### Start Here

**New to M-Pesa integration?**
1. Read [M-Pesa Quick Reference](./MPESA_QUICK_REFERENCE.md) (5 min)
2. Choose your integration option above
3. Follow the relevant guide

**Already familiar with M-Pesa?**
- Jump to [M-Pesa Verification Guide](./MPESA_VERIFICATION_GUIDE.md)
- Use [Quick Reference](./MPESA_QUICK_REFERENCE.md) for API lookup

---

## 🔧 Integration Options

### Option 1: Direct Integration

**Best for:** Your own projects where you manage M-Pesa credentials

**Pros:**
- ✅ Full control
- ✅ No external dependencies
- ✅ Direct Safaricom API access
- ✅ Lowest latency

**Cons:**
- ⚠️ Must manage credentials
- ⚠️ Credentials in your .env

**Setup:**
```bash
# 1. Copy utility
cp lib/mpesa-verification.js your-project/lib/

# 2. Add credentials to .env
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_BUSINESS_SHORT_CODE=...
MPESA_PASSKEY=...

# 3. Import and use
import { verifyMpesaPayment } from './lib/mpesa-verification.js';
```

**Time to Production:** 10 minutes

---

### Option 2: Proxy Endpoint

**Best for:** Client projects or when you want to centralize M-Pesa management

**Pros:**
- ✅ Credentials never exposed
- ✅ Centralized management
- ✅ Easy for multiple projects
- ✅ Can monitor all payments
- ✅ Can implement rate limiting

**Cons:**
- ⚠️ Depends on proxy server
- ⚠️ Slightly higher latency
- ⚠️ Need to deploy proxy

**Setup:**
```bash
# 1. Deploy proxy endpoint on your server
# 2. Get API key from provider
# 3. Call proxy from client project

const response = await fetch('https://your-server.com/api/mpesa-verification-proxy', {
  method: 'POST',
  body: JSON.stringify({ checkoutId, apiKey })
});
```

**Time to Production:** 5 minutes (after proxy is deployed)

---

## 📋 API Reference

### Direct Integration Functions

#### `verifyMpesaPayment(checkoutId, credentials)`

One-line payment verification.

```javascript
const result = await verifyMpesaPayment('ws_CO_...', {
  consumerKey: 'key',
  consumerSecret: 'secret',
  businessShortCode: '3581047',
  passkey: 'passkey'
});

// Returns:
{
  success: true,
  status: 'success|processing|failed|error',
  resultCode: '0',
  resultDesc: 'The service request is processed successfully.',
  mpesaReceiptNumber: 'MPF123456789',
  rawResponse: { ... }
}
```

**See:** [Full API Reference](./MPESA_VERIFICATION_GUIDE.md#api-reference)

---

### Proxy Endpoint

#### `POST /api/mpesa-verification-proxy`

Verify payment via proxy endpoint.

**Request:**
```json
{
  "checkoutId": "ws_CO_14122025231025749795704273",
  "apiKey": "your-api-key"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "status": "success|processing|failed",
    "resultCode": "0",
    "resultDesc": "...",
    "receipt": "MPF123456789",
    "checkoutId": "ws_CO_..."
  }
}
```

**See:** [Proxy Client Guide](./MPESA_PROXY_CLIENT_GUIDE.md#api-reference)

---

## 🔑 Status Codes

| Status | Code | Meaning | Action |
|--------|------|---------|--------|
| Success | `0` | Payment confirmed | Update DB, show success |
| Processing | `4999` | Still processing | Retry in 5 seconds |
| Failed | Other | Payment failed | Show error message |
| Error | N/A | Verification error | Retry or contact support |

---

## 💡 Implementation Examples

### React Component

```javascript
import { useState, useEffect } from 'react';

export function PaymentStatus({ checkoutId }) {
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('/api/check-status', {
        method: 'POST',
        body: JSON.stringify({ checkoutId })
      });
      const data = await response.json();
      setStatus(data.payment.status);

      if (data.payment.status !== 'processing') {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checkoutId]);

  return <div>Status: {status}</div>;
}
```

**See:** [Full Examples](./MPESA_VERIFICATION_GUIDE.md#implementation-examples)

---

### Express.js Backend

```javascript
import { verifyMpesaPayment } from './lib/mpesa-verification.js';

app.post('/api/check-status', async (req, res) => {
  const { checkoutId } = req.body;
  
  const result = await verifyMpesaPayment(checkoutId, {
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
    passkey: process.env.MPESA_PASSKEY
  });

  res.json({ success: true, payment: { status: result.status } });
});
```

**See:** [Full Examples](./MPESA_VERIFICATION_GUIDE.md#implementation-examples)

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Authentication failed" | Invalid credentials | Check .env file |
| "Invalid timestamp" | Wrong format | Use `generateMpesaTimestamp()` |
| "Payment still pending" | Processing delay | Wait 5-10 seconds, retry |
| "Timeout" | Network issue | Implement retry logic |
| "Invalid API key" | Wrong proxy key | Verify API key with provider |

**See:** [Full Troubleshooting](./MPESA_VERIFICATION_GUIDE.md#troubleshooting)

---

## 🔐 Security Best Practices

### 1. Protect Credentials

```bash
# ✅ Use environment variables
MPESA_CONSUMER_KEY=secret_key

# ❌ Never hardcode
const key = 'secret_key';
```

### 2. Use HTTPS Only

```javascript
// ✅ Always use HTTPS
https://your-server.com/api/mpesa-verification-proxy

// ❌ Never use HTTP
http://your-server.com/api/mpesa-verification-proxy
```

### 3. Validate Input

```javascript
// ✅ Validate CheckoutID format
if (!checkoutId || checkoutId.length < 10) {
  return res.status(400).json({ error: 'Invalid checkoutId' });
}
```

### 4. Implement Rate Limiting

```javascript
// ✅ Limit requests per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.post('/api/check-status', limiter, handler);
```

**See:** [Security Best Practices](./MPESA_VERIFICATION_GUIDE.md#best-practices)

---

## 📞 Support & Resources

### Documentation Files

- **[MPESA_VERIFICATION_GUIDE.md](./MPESA_VERIFICATION_GUIDE.md)** - Complete reference
- **[MPESA_QUICK_REFERENCE.md](./MPESA_QUICK_REFERENCE.md)** - Quick lookup
- **[MPESA_PROXY_CLIENT_GUIDE.md](./MPESA_PROXY_CLIENT_GUIDE.md)** - Proxy usage
- **[MPESA_PROXY_SETUP.md](./MPESA_PROXY_SETUP.md)** - Proxy deployment

### Code Files

- **[lib/mpesa-verification.js](../lib/mpesa-verification.js)** - Utility module
- **[api/mpesa-verification-proxy.js](../api/mpesa-verification-proxy.js)** - Proxy endpoint

### Getting Help

1. Check [Quick Reference](./MPESA_QUICK_REFERENCE.md)
2. Search [Full Guide](./MPESA_VERIFICATION_GUIDE.md)
3. Review [Troubleshooting](./MPESA_VERIFICATION_GUIDE.md#troubleshooting)
4. Contact your integration provider

---

## 🚀 Getting Started Checklist

### For Direct Integration

- [ ] Read [Quick Reference](./MPESA_QUICK_REFERENCE.md)
- [ ] Copy `lib/mpesa-verification.js` to your project
- [ ] Add M-Pesa credentials to `.env`
- [ ] Import `verifyMpesaPayment` in your code
- [ ] Test with a real payment
- [ ] Deploy to production

### For Proxy Integration

- [ ] Read [Proxy Client Guide](./MPESA_PROXY_CLIENT_GUIDE.md)
- [ ] Get proxy endpoint URL from provider
- [ ] Get API key from provider
- [ ] Call proxy endpoint from your code
- [ ] Test with a real payment
- [ ] Deploy to production

---

**Last Updated:** December 15, 2025
**Maintained By:** SwiftPay Integration Team
