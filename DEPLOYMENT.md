# SwiftPay Deployment Guide

## Prerequisites

- GitHub account with the repository pushed
- Vercel account (free tier available)
- Supabase project set up
- M-Pesa sandbox credentials

## Step 1: Prepare Environment Variables

Copy `.env.example` to `.env.local` and fill in your actual values:

```bash
cp .env.example .env.local
```

### Required Environment Variables

#### Frontend (Vite)
```
VITE_API_URL=https://your-backend-url.com
```

#### Backend (Node.js/Express)
```
PORT=5000
NODE_ENV=production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars

# M-Pesa
MPESA_CONSUMER_KEY=your-key
MPESA_CONSUMER_SECRET=your-secret
MPESA_BUSINESS_SHORT_CODE=your-short-code
MPESA_PASSKEY=your-passkey
MPESA_ENVIRONMENT=production

# Callback
CALLBACK_URL=https://your-backend-url.com
```

## Step 2: Deploy Frontend to Vercel

### Option A: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   - `VITE_API_URL`: Your backend URL
6. Click "Deploy"

### Option B: Using Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts to deploy.

## Step 3: Deploy Backend (Separate Service)

The backend can be deployed to:
- **Heroku** (free tier available)
- **Railway** (recommended)
- **Render**
- **AWS EC2**
- **DigitalOcean**

### Recommended: Railway

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Add environment variables from `.env`
5. Deploy

### Backend Deployment Checklist

- [ ] Node.js version 18+ installed
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] M-Pesa credentials configured
- [ ] CORS configured for frontend URL
- [ ] SSL/HTTPS enabled

## Step 4: Update Frontend API URL

After backend deployment, update `VITE_API_URL` in Vercel:

1. Go to Vercel Project Settings
2. Environment Variables
3. Update `VITE_API_URL` to your backend URL
4. Redeploy

## Step 5: Configure M-Pesa Callback

Update M-Pesa callback URL in your M-Pesa dashboard:

```
https://your-backend-url.com/api/mpesa/callback
```

## Step 6: Database Setup

### Supabase

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Create tables:
   - `users`
   - `tills`
   - `api_keys`
   - `transactions`
   - `webhooks`
   - `webhook_deliveries`

3. Get credentials:
   - Project URL
   - Anon Key
   - Service Role Key

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Backend deployed and running
- [ ] Database configured
- [ ] M-Pesa credentials updated to production
- [ ] CORS configured correctly
- [ ] SSL/HTTPS enabled on both frontend and backend
- [ ] Error logging configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] API rate limiting configured

## Monitoring & Logs

### Vercel
- Dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
- Real-time logs available in project settings

### Backend Logs
- Check your hosting provider's logs
- Configure centralized logging (Sentry, LogRocket, etc.)

## Troubleshooting

### CORS Errors
Update backend `server.js`:
```javascript
app.use(cors({
  origin: 'https://your-frontend-url.com',
  credentials: true
}));
```

### API Connection Issues
1. Verify `VITE_API_URL` is correct
2. Check backend is running
3. Verify CORS headers
4. Check network tab in browser DevTools

### M-Pesa Callback Not Working
1. Verify callback URL in M-Pesa dashboard
2. Check backend logs for errors
3. Ensure webhook endpoint is accessible
4. Test with M-Pesa sandbox

## Rollback

If deployment fails:

### Vercel
1. Go to Deployments tab
2. Click previous successful deployment
3. Click "Promote to Production"

### Backend
Redeploy previous version from Git history

## Support

For issues:
1. Check logs in Vercel dashboard
2. Check backend logs
3. Verify environment variables
4. Test API endpoints with Postman
5. Check M-Pesa sandbox status

## Security Notes

- Never commit `.env` files
- Use strong JWT_SECRET (min 32 characters)
- Enable HTTPS everywhere
- Keep dependencies updated
- Use environment-specific credentials
- Enable API rate limiting
- Monitor for suspicious activity
