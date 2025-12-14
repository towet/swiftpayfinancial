# SwiftPay - World-Class Fintech Platform 🚀

A complete, production-ready fintech platform for accepting M-Pesa payments, managing payment accounts, generating API keys, and sending real-time webhooks to your applications.

![SwiftPay](https://img.shields.io/badge/SwiftPay-Fintech-blue?style=flat-square)
![React](https://img.shields.io/badge/React-18+-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=flat-square&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Features

### 💳 Payment Processing
- **M-Pesa Integration** - STK Push payments with real-time callbacks
- **Multiple Tills** - Manage multiple payment accounts
- **Transaction Tracking** - Complete transaction history and status
- **Real-time Callbacks** - Instant payment confirmation

### 🔑 API & Integration
- **API Key Management** - Generate and revoke API keys for integrations
- **Webhook System** - Subscribe to 9+ events with automatic delivery
- **Developer Portal** - Complete API documentation with code examples
- **Integration Guide** - Step-by-step setup for Node.js, Python, PHP, JavaScript

### 📊 Dashboard
- **Live Statistics** - Real-time revenue, transactions, and success rates
- **Transaction History** - Searchable and filterable transactions
- **Analytics** - Revenue trends and transaction volume charts
- **Activity Timeline** - Real-time activity logs

### 🔐 Security
- JWT token-based authentication
- API key verification for third-party integrations
- User data isolation
- Password hashing with bcryptjs
- Protected routes and authorization checks
- HTTPS/SSL support

## 🛠️ Tech Stack

**Frontend**
- React 18+ with TypeScript
- Vite for blazing-fast development
- TailwindCSS for responsive design
- shadcn/ui for beautiful components
- Framer Motion for smooth animations
- Axios for API communication
- React Router for navigation

**Backend**
- Node.js + Express.js
- Supabase PostgreSQL database
- JWT for secure authentication
- M-Pesa payment gateway integration
- Axios for HTTP requests

**Infrastructure**
- Vercel for frontend deployment
- Railway/Heroku for backend
- Supabase for database hosting

## 📋 Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (free tier available)
- M-Pesa sandbox credentials

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/towet/swiftpay.git
cd swiftpay
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Frontend
VITE_API_URL=http://localhost:5000

# Backend
PORT=5000
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-secret-key-min-32-chars
MPESA_CONSUMER_KEY=your-key
MPESA_CONSUMER_SECRET=your-secret
MPESA_BUSINESS_SHORT_CODE=your-short-code
MPESA_PASSKEY=your-passkey
```

### 4. Start Development Server

**Terminal 1 - Frontend (Vite)**
```bash
npm run dev
```
Frontend: http://localhost:8080

**Terminal 2 - Backend (Node.js)**
```bash
node server.js
```
Backend: http://localhost:5000

## 📦 Project Structure

```
swiftpay/
├── src/
│   ├── pages/                    # Page components
│   │   ├── Dashboard.tsx         # Dashboard overview
│   │   ├── DashboardTransactions.tsx
│   │   ├── DashboardAnalytics.tsx
│   │   ├── DashboardAccounts.tsx
│   │   ├── DashboardApiKeys.tsx
│   │   ├── DashboardWebhooks.tsx
│   │   ├── DeveloperPortal.tsx
│   │   ├── DeveloperDocs.tsx
│   │   ├── DeveloperGuide.tsx
│   │   ├── Login.tsx
│   │   └── Signup.tsx
│   ├── components/
│   │   ├── dashboard/            # Dashboard components
│   │   ├── ui/                   # shadcn/ui components
│   │   └── auth/                 # Auth components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities and helpers
│   └── App.tsx                   # Main app component
├── server.js                     # Express backend
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # TailwindCSS config
├── tsconfig.json                # TypeScript config
├── .env.example                 # Environment variables template
├── vercel.json                  # Vercel deployment config
├── DEPLOYMENT.md                # Deployment guide
└── README.md                    # This file
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register        # User signup
POST   /api/auth/login           # User login
```

### Tills (Payment Accounts)
```
POST   /api/tills                # Create till
GET    /api/tills                # List user's tills
PUT    /api/tills/:id            # Update till
DELETE /api/tills/:id            # Delete till
```

### API Keys
```
POST   /api/keys                 # Generate API key
GET    /api/keys                 # List API keys
DELETE /api/keys/:id             # Delete API key
```

### Webhooks
```
POST   /api/webhooks             # Create webhook
GET    /api/webhooks             # List webhooks
PUT    /api/webhooks/:id         # Update webhook
DELETE /api/webhooks/:id         # Delete webhook
POST   /api/webhooks/:id/test    # Test webhook
GET    /api/webhooks/:id/deliveries  # Get delivery history
```

### Payments
```
POST   /api/mpesa/stk-push       # Initiate STK Push (JWT)
POST   /api/mpesa/stk-push-api   # Initiate STK Push (API Key)
POST   /api/mpesa/callback       # M-Pesa callback handler
GET    /api/mpesa/balance        # Check account balance
```

### Dashboard
```
GET    /api/dashboard/stats      # Dashboard statistics
GET    /api/transactions         # List transactions
```

## 🌐 Deployment

### Deploy Frontend to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and import your repository
4. Add environment variables:
   - `VITE_API_URL`: Your backend URL
5. Click "Deploy"

### Deploy Backend

Recommended platforms:
- **Railway** - Easy setup, free tier available
- **Heroku** - Popular choice for Node.js
- **Render** - Good free tier
- **AWS EC2** - For production scale

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📚 Documentation

- **API Documentation** - Available in-app at `/developers/docs`
- **Integration Guide** - Available at `/developers/guide`
- **Developer Portal** - Available at `/developers`
- **Deployment Guide** - See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🧪 Testing

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Backend server
node server.js
```

## 📊 Dashboard Features

| Feature | Description |
|---------|-------------|
| **Overview** | Real-time statistics and recent activity |
| **Transactions** | Complete transaction history with filtering and search |
| **API Keys** | Manage integration credentials |
| **Accounts** | Manage payment accounts (tills) |
| **Analytics** | Revenue trends and transaction volume |
| **Webhooks** | Configure and test webhooks |
| **Developer Docs** | API documentation and guides |

## 🔄 Webhook Events

Subscribe to these events:
- `payment.success` - Payment completed successfully
- `payment.failed` - Payment failed
- `payment.pending` - Payment pending
- `till.created` - Till created
- `till.updated` - Till updated
- `till.deleted` - Till deleted
- `api_key.created` - API key generated
- `api_key.deleted` - API key deleted
- `transaction.created` - Transaction recorded

## 🔐 Environment Variables

See `.env.example` for complete list. Key variables:

```env
# Frontend
VITE_API_URL=http://localhost:5000

# Backend
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# M-Pesa
MPESA_CONSUMER_KEY=your-key
MPESA_CONSUMER_SECRET=your-secret
MPESA_BUSINESS_SHORT_CODE=your-short-code
MPESA_PASSKEY=your-passkey
MPESA_ENVIRONMENT=sandbox
```

## 🚀 Performance

- **Frontend**: Optimized with Vite, lazy loading, code splitting
- **Backend**: Express.js with efficient database queries
- **Database**: Supabase with real-time subscriptions
- **Caching**: Strategic caching for API responses

## 🔒 Security Best Practices

- Never commit `.env` files to version control
- Use strong JWT_SECRET (minimum 32 characters)
- Enable HTTPS in production
- Keep dependencies updated: `npm audit fix`
- Use API rate limiting
- Validate all user inputs
- Enable CORS only for trusted domains

## 📈 Scalability

The platform is designed to scale:
- Stateless backend for horizontal scaling
- Database connection pooling
- Webhook delivery with retry logic
- Efficient transaction logging
- Real-time updates with Supabase

## 🐛 Troubleshooting

### CORS Errors
Update backend CORS configuration in `server.js`:
```javascript
app.use(cors({
  origin: 'https://your-frontend-url.com',
  credentials: true
}));
```

### API Connection Issues
1. Verify `VITE_API_URL` is correct
2. Check backend is running on port 5000
3. Verify CORS headers
4. Check browser DevTools Network tab

### M-Pesa Callback Not Working
1. Verify callback URL in M-Pesa dashboard
2. Check backend logs for errors
3. Ensure webhook endpoint is accessible
4. Test with M-Pesa sandbox

## 📞 Support

For issues:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
2. Review API documentation at `/developers/docs`
3. Check backend logs
4. Verify environment variables
5. Test API endpoints with Postman

## 📄 License

MIT License - feel free to use this project for commercial purposes.

## 🙏 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👨‍💻 Author

Built with ❤️ for the African fintech ecosystem.

---

**Ready to deploy?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions.
