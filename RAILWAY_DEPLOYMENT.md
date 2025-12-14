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

```
PORT=5000
NODE_ENV=production
SUPABASE_URL=https://qsznxakytqietjuxhsdf.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzem54YWt5dHFpZXRqdXhoc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNTMzMjAsImV4cCI6MjA4MDkyOTMyMH0.I4F39VBSvoX8bnGDyneEigzzEhKlGX8ZAkhJrbFAXZE
JWT_SECRET=x/Pv9LunGXp5z5AF9wCOcbJoOVNPM3wyLPtyJkqw5MHuiXlgQZxUSx5RCnyXybaHlI2J4ChE0wnQ9E3EjNaI0g==
MPESA_CONSUMER_KEY=QNDgt0ltfcmiiDAEVWfwAwWq2uHq3XeXv7BEXKGJKS7X7wVg
MPESA_CONSUMER_SECRET=TD6vam4JJs7ghG5eGutL4zsNFFNLBF9yEBxUNZRopGPVNv77yqQvYo0OhsMy3eSq
MPESA_BUSINESS_SHORT_CODE=3581047
MPESA_PASSKEY=cb9041a559db0ad7cbd8debaa5574661c5bf4e1fb7c7e99a8116c83dcaa8474d
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

