# Render Deployment Guide for SwiftPay Backend

## Quick Start (3 minutes)

### Step 1: Go to Render
1. Visit [render.com](https://render.com)
2. Sign up with GitHub (recommended)

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Select `towet/swiftpayfinancial` repository
3. Click **"Connect"**

### Step 3: Configure Service
Fill in the following settings:

| Field | Value |
|-------|-------|
| **Name** | `swiftpay-backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Region** | Choose closest to you |

### Step 4: Add Environment Variables
Click **"Add Environment Variable"** and add these (copy from `.env` file):

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
JWT_SECRET=your-jwt-secret-key
PORT=5000
NODE_ENV=production
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_BUSINESS_SHORT_CODE=your-business-short-code
MPESA_PASSKEY=your-mpesa-passkey
CALLBACK_URL=https://your-render-url.onrender.com/api/mpesa/callback
```

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait ~2-3 minutes for build and deployment
3. You'll see a green status when ready

### Step 6: Get Your Backend URL
1. Go to your service dashboard
2. Look for **"Render URL"** at the top (e.g., `https://swiftpay-backend.onrender.com`)
3. Copy this URL

### Step 7: Update Vercel Frontend
1. Go to [vercel.com](https://vercel.com) → swiftpayfinancial project
2. **Settings** → **Environment Variables**
3. Update `VITE_API_URL` to: `https://swiftpay-backend.onrender.com/api`
4. Click **"Save"**
5. **Deployments** → Click latest deployment → **"Redeploy"**

### Step 8: Test Login
1. Go to https://swiftpayfinancial.vercel.app/login
2. Try logging in
3. Should work now! ✅

## Important Notes

- **Free tier**: Render spins down after 15 minutes of inactivity
- **First request after sleep**: Takes ~30 seconds to wake up
- **No credit card required**: Completely free forever
- **Auto-deploys**: Any push to GitHub automatically redeploys

## Troubleshooting

**Backend not starting?**
- Check Render logs for errors
- Verify all environment variables are set
- Ensure `server.js` exists at root level

**Still getting 405 errors?**
- Clear browser cache
- Verify `VITE_API_URL` in Vercel is correct
- Wait 1-2 minutes for Vercel redeploy to complete

**M-Pesa callbacks not working?**
- Update `CALLBACK_URL` to your Render URL once deployed
- Format: `https://swiftpay-backend.onrender.com/api/mpesa/callback`

## Production Checklist

- [ ] Render backend deployed successfully
- [ ] All environment variables added to Render
- [ ] `VITE_API_URL` updated in Vercel
- [ ] Vercel redeployed
- [ ] Login works on frontend
- [ ] Can initiate M-Pesa payments
- [ ] Webhooks are being received

