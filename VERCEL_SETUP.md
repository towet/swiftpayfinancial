# SwiftPay - Vercel Deployment Quick Setup

## 🚀 Ready to Deploy? Follow These Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: Add SwiftPay fintech platform with M-Pesa integration"
git push origin main
```

### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Click **"Import Git Repository"**
4. Paste: `https://github.com/towet/swiftpay.git`
5. Click **"Import"**

### Step 3: Configure Vercel Project

**Build Settings:**
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Step 4: Add Environment Variables to Vercel

Click **"Environment Variables"** and add these variables:

#### Frontend Variables
```
VITE_API_URL = https://your-backend-url.com
```

#### Backend Variables (if deploying backend to Vercel)
```
PORT = 5000
NODE_ENV = production
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key-here
JWT_SECRET = your-super-secret-jwt-key-min-32-chars
MPESA_CONSUMER_KEY = your-mpesa-consumer-key
MPESA_CONSUMER_SECRET = your-mpesa-consumer-secret
MPESA_BUSINESS_SHORT_CODE = your-business-short-code
MPESA_PASSKEY = your-mpesa-passkey
MPESA_ENVIRONMENT = sandbox
MPESA_ACCESS_TOKEN_URL = https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
MPESA_STK_PUSH_URL = https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
MPESA_BALANCE_URL = https://sandbox.safaricom.co.ke/mpesa/accountbalance/v1/query
MPESA_TRANSACTION_STATUS_URL = https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query
CALLBACK_URL = https://your-backend-url.com
FRONTEND_URL = https://your-vercel-url.com
```

### Step 5: Deploy

Click **"Deploy"** and wait for deployment to complete.

## 📋 Environment Variables Checklist

### Required for Frontend
- [ ] `VITE_API_URL` - Your backend URL

### Required for Backend
- [ ] `PORT` - 5000
- [ ] `NODE_ENV` - production
- [ ] `SUPABASE_URL` - From Supabase dashboard
- [ ] `SUPABASE_ANON_KEY` - From Supabase dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Supabase dashboard
- [ ] `JWT_SECRET` - Min 32 characters (generate: `openssl rand -base64 32`)
- [ ] `MPESA_CONSUMER_KEY` - From M-Pesa developer portal
- [ ] `MPESA_CONSUMER_SECRET` - From M-Pesa developer portal
- [ ] `MPESA_BUSINESS_SHORT_CODE` - Your till number
- [ ] `MPESA_PASSKEY` - From M-Pesa dashboard
- [ ] `MPESA_ENVIRONMENT` - sandbox or production
- [ ] `MPESA_ACCESS_TOKEN_URL` - Provided in .env.example
- [ ] `MPESA_STK_PUSH_URL` - Provided in .env.example
- [ ] `MPESA_BALANCE_URL` - Provided in .env.example
- [ ] `MPESA_TRANSACTION_STATUS_URL` - Provided in .env.example
- [ ] `CALLBACK_URL` - Your backend URL
- [ ] `FRONTEND_URL` - Your Vercel URL

## 🔗 Where to Get Credentials

### Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create project or use existing
3. Go to Settings → API
4. Copy: Project URL, Anon Key, Service Role Key

### M-Pesa
1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create app
3. Copy: Consumer Key, Consumer Secret
4. Get: Business Short Code, Passkey

### JWT Secret
Generate with:
```bash
openssl rand -base64 32
```

## 🚀 After Deployment

### Update M-Pesa Callback URL
1. Go to M-Pesa developer portal
2. Update callback URL to: `https://your-backend-url.com/api/mpesa/callback`

### Test Your Deployment
1. Visit your Vercel URL
2. Try signing up
3. Create a till
4. Generate an API key
5. Test webhook

## 🐛 Troubleshooting

### Build Fails
- Check Node version: `node --version` (should be 18+)
- Check npm version: `npm --version`
- Clear cache: `npm cache clean --force`

### API Connection Issues
- Verify `VITE_API_URL` is correct
- Check backend is running
- Verify CORS headers in backend

### M-Pesa Not Working
- Verify all M-Pesa credentials
- Check callback URL is accessible
- Test with M-Pesa sandbox

## 📞 Support

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

---

**Your SwiftPay platform is ready to deploy!** 🎉
