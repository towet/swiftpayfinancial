# Railway Deployment Guide for SwiftPay Backend

## Quick Start (5 minutes)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Start Project"
3. Sign up with GitHub (recommended)

### Step 2: Deploy Backend
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select `towet/swiftpayfinancial` repository
5. Railway will auto-detect `server.js` and deploy it

### Step 3: Add Environment Variables
Once deployment starts, go to **Variables** tab and add:

```bash
PORT=5000
NODE_ENV=production
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
JWT_SECRET=your-jwt-secret-key
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_BUSINESS_SHORT_CODE=your-business-short-code
MPESA_PASSKEY=your-mpesa-passkey
CALLBACK_URL=https://your-railway-url.railway.app/api/mpesa/callback
```

### Step 4: Get Your Railway URL
1. Go to **Settings** tab
2. Look for "Domains"
3. Copy your Railway URL (e.g., `https://swiftpay-backend-production.railway.app`)

### Step 5: Update Vercel
1. Go to [vercel.com](https://vercel.com) → swiftpayfinancial project
2. **Settings** → **Environment Variables**
3. Update `VITE_API_URL` to: `https://your-railway-url.railway.app/api`
4. **Redeploy**

## Troubleshooting

**Backend not deploying?**
- Check Railway build logs for errors
- Ensure `package.json` has all dependencies
- Verify `server.js` exists at root level

**Still getting 405 errors?**
- Clear browser cache
- Verify `VITE_API_URL` is correct in Vercel
- Check that Railway backend is running (green status)

**M-Pesa callbacks not working?**
- Update `CALLBACK_URL` in Railway variables to your Railway URL
- Ensure webhook endpoint is accessible

## Production Checklist

- [ ] Railway backend deployed and running
- [ ] All environment variables added to Railway
- [ ] `VITE_API_URL` updated in Vercel
- [ ] Vercel redeployed
- [ ] Login works on frontend
- [ ] M-Pesa payments can be initiated
- [ ] Webhooks are being received

