import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { mpesaVerificationProxy } from './api/mpesa-verification-proxy.js';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_INSIGHTS_TTL_MS = Number(process.env.GEMINI_INSIGHTS_TTL_MS || 30 * 60 * 1000);
const GEMINI_RATE_LIMIT_WINDOW_MS = Number(process.env.GEMINI_RATE_LIMIT_WINDOW_MS || 60 * 1000);
const GEMINI_RATE_LIMIT_MAX = Number(process.env.GEMINI_RATE_LIMIT_MAX || 5);

const geminiInsightsCache = new Map();
const geminiInFlight = new Map();
const geminiRateLimit = new Map();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request timeout middleware
app.use((req, res, next) => {
  const path = String(req.path || '');
  const isMpesaFlow =
    path.startsWith('/api/mpesa') ||
    path.startsWith('/api/mpesa-verification-proxy') ||
    path.startsWith('/api/transactions/update-status');
  const timeoutMs = isMpesaFlow ? 120000 : 30000;

  res.setTimeout(timeoutMs, () => {
    if (res.headersSent) return;
    res.status(408).json({ status: 'error', message: 'Request timeout' });
  });
  next();
});

// Supabase Client
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co',
  SUPABASE_KEY || 'your-supabase-key'
);

// M-Pesa Credentials (from environment variables)
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_BUSINESS_SHORT_CODE = process.env.MPESA_BUSINESS_SHORT_CODE || '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const CALLBACK_URL = process.env.RENDER_EXTERNAL_URL || process.env.CALLBACK_URL || 'http://localhost:5000';

// M-Pesa API Endpoints (Production - same as working version)
const OAUTH_URL = 'https://api.safaricom.co.ke/oauth/v1/generate';
const STK_PUSH_URL = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
const ACCOUNT_BALANCE_URL = 'https://api.safaricom.co.ke/mpesa/accountbalance/v1/query';
const TRANSACTION_STATUS_URL = 'https://api.safaricom.co.ke/mpesa/transactionstatus/v1/query';
const B2C_URL = 'https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Role Constants
const ROLES = {
  USER: 'user',
  TILL_OWNER: 'till_owner',
  SUPPORT: 'support',
  SUPER_ADMIN: 'super_admin'
};

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || '';
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

let emailTransporter;

const getEmailTransporter = () => {
  if (emailTransporter) return emailTransporter;
  if (!SMTP_HOST || !SMTP_FROM) return null;

  emailTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    requireTLS: !SMTP_SECURE && SMTP_PORT === 587,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
  });

  return emailTransporter;
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const isValidEmail = (value) => {
  const s = normalizeEmail(value);
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
};

const parseSenderFrom = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return { email: '' };
  const m = raw.match(/^(.*)<\s*([^>]+)\s*>$/);
  if (m) {
    const name = String(m[1] || '').trim().replace(/^"|"$/g, '');
    const email = String(m[2] || '').trim();
    return { email, name: name || undefined };
  }
  return { email: raw };
};

const buildEmailHtml = ({ title, lead, contentHtml, footerHtml }) => {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;background:#0b1220;padding:24px">
      <div style="max-width:560px;margin:0 auto;background:#0f172a;border:1px solid rgba(148,163,184,0.2);border-radius:14px;overflow:hidden">
        <div style="padding:20px 22px;background:linear-gradient(135deg,#2563eb,#7c3aed)">
          <div style="font-size:18px;font-weight:700;color:#fff">${title}</div>
          <div style="color:rgba(255,255,255,0.9);margin-top:6px;font-size:13px">${lead || ''}</div>
        </div>
        <div style="padding:22px;color:#e5e7eb">
          ${contentHtml || ''}
          <div style="margin-top:18px;color:#94a3b8;font-size:12px">${footerHtml || ''}</div>
        </div>
      </div>
    </div>
  `;
};

const sendEmail = async ({ to, subject, html }) => {
  const recipient = normalizeEmail(to);
  if (!isValidEmail(recipient)) {
    throw new Error('Invalid email recipient');
  }

  if (BREVO_API_KEY && SMTP_FROM) {
    const sender = parseSenderFrom(SMTP_FROM);
    if (isValidEmail(sender.email)) {
      try {
        await axios.post(
          'https://api.brevo.com/v3/smtp/email',
          {
            sender,
            to: [{ email: recipient }],
            subject,
            htmlContent: html
          },
          {
            headers: {
              'api-key': BREVO_API_KEY,
              'Content-Type': 'application/json'
            },
            timeout: 20000
          }
        );
        return;
      } catch (apiErr) {
        console.warn('Brevo HTTP API failed, falling back to SMTP:', apiErr?.response?.data || apiErr?.message);
      }
    }
  }

  const transporter = getEmailTransporter();
  if (!transporter) {
    throw new Error('Email transporter not configured. Set SMTP_HOST + SMTP_FROM (and optionally SMTP_USER/SMTP_PASS).');
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to: recipient,
    subject,
    html
  });
};

const generateOtpCode = () => {
  const code = crypto.randomInt(0, 1000000);
  return String(code).padStart(6, '0');
};

const createLoginChallengeToken = ({ userId, email }) => {
  return jwt.sign(
    { type: 'login_challenge', userId, email },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
};

const verifyLoginChallengeToken = (token) => {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded || decoded.type !== 'login_challenge' || !decoded.userId || !decoded.email) {
    throw new Error('Invalid login challenge');
  }
  return decoded;
};

const issueAccessToken = ({ userId, email, rememberMe }) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: rememberMe ? '7d' : '2h' }
  );
};

const getUserNotificationSettings = async (userId) => {
  const { data, error } = await supabase
    .from('user_notification_settings')
    .select('enabled, emails')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { enabled: true, emails: [] };
  }

  return {
    enabled: data.enabled !== false,
    emails: Array.isArray(data.emails) ? data.emails : []
  };
};

const upsertUserNotificationSettings = async (userId, enabled, emails) => {
  const payload = {
    user_id: userId,
    enabled: enabled !== false,
    emails: Array.isArray(emails) ? emails : [],
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('user_notification_settings')
    .upsert([payload], { onConflict: 'user_id' })
    .select();

  if (error) throw error;
  return data?.[0] || payload;
};

const sendPaymentNotificationEmails = async ({ userId, event, transaction }) => {
  try {
    if (!userId) return;
    if (!event || event !== 'payment.success') return;

    const settings = await getUserNotificationSettings(userId);
    if (!settings.enabled) return;

    const emails = (settings.emails || [])
      .map(normalizeEmail)
      .filter((e) => isValidEmail(e));

    if (emails.length === 0) return;

    const subject = 'SwiftPay Payment SUCCESS';
    const amount = transaction?.amount != null ? String(transaction.amount) : '';
    const phone = transaction?.phone || transaction?.phone_number || '';
    const txnId = transaction?.transactionId || transaction?.id || '';
    const receipt = transaction?.mpesaReceiptNumber || transaction?.mpesa_receipt_number || '';
    const reference = transaction?.reference || '';
    const description = transaction?.description || '';
    const tillId = transaction?.till_id || transaction?.tillId || '';
    const mpesaRequestId = transaction?.mpesa_request_id || transaction?.mpesaRequestId || '';
    const checkoutRequestId = transaction?.checkout_request_id || transaction?.checkoutRequestId || '';
    const when = transaction?.timestamp || new Date().toISOString();

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px">SwiftPay Payment SUCCESS</h2>
        <p style="margin:0 0 16px;color:#4b5563">Notification for your SwiftPay account.</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:6px 10px;color:#6b7280">Transaction ID</td><td style="padding:6px 10px"><b>${txnId}</b></td></tr>
          <tr><td style="padding:6px 10px;color:#6b7280">Amount</td><td style="padding:6px 10px"><b>${amount}</b></td></tr>
          <tr><td style="padding:6px 10px;color:#6b7280">Phone</td><td style="padding:6px 10px"><b>${phone}</b></td></tr>
          ${reference ? `<tr><td style="padding:6px 10px;color:#6b7280">Reference</td><td style="padding:6px 10px"><b>${reference}</b></td></tr>` : ''}
          ${description ? `<tr><td style="padding:6px 10px;color:#6b7280">Description</td><td style="padding:6px 10px"><b>${description}</b></td></tr>` : ''}
          ${tillId ? `<tr><td style="padding:6px 10px;color:#6b7280">Till ID</td><td style="padding:6px 10px"><b>${tillId}</b></td></tr>` : ''}
          ${checkoutRequestId ? `<tr><td style="padding:6px 10px;color:#6b7280">Checkout Request ID</td><td style="padding:6px 10px"><b>${checkoutRequestId}</b></td></tr>` : ''}
          ${mpesaRequestId ? `<tr><td style="padding:6px 10px;color:#6b7280">M-Pesa Request ID</td><td style="padding:6px 10px"><b>${mpesaRequestId}</b></td></tr>` : ''}
          ${receipt ? `<tr><td style="padding:6px 10px;color:#6b7280">Receipt</td><td style="padding:6px 10px"><b>${receipt}</b></td></tr>` : ''}
          <tr><td style="padding:6px 10px;color:#6b7280">Time</td><td style="padding:6px 10px"><b>${when}</b></td></tr>
        </table>
      </div>
    `;

    // Try Brevo HTTP API first
    if (BREVO_API_KEY && SMTP_FROM) {
      try {
        const sender = parseSenderFrom(SMTP_FROM);
        if (!isValidEmail(sender.email)) {
          throw new Error('valid sender email required');
        }

        await Promise.all(
          emails.slice(0, 5).map((to) =>
            axios.post('https://api.brevo.com/v3/smtp/email', {
              sender,
              to: [{ email: to }],
              subject,
              htmlContent: html
            }, {
              headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json'
              },
              timeout: 15000
            })
          )
        );
        console.log(`Payment notification emails sent via Brevo HTTP API to ${emails.length} recipients`);
        return;
      } catch (apiErr) {
        console.warn('Brevo HTTP API failed, falling back to SMTP:', apiErr?.response?.data || apiErr?.message);
      }
    }

    // Fallback to SMTP
    const transporter = getEmailTransporter();
    if (!transporter) {
      console.warn('Email transporter not configured. Set SMTP_HOST + SMTP_FROM (and optionally SMTP_USER/SMTP_PASS).');
      return;
    }

    await Promise.all(
      emails.slice(0, 5).map((to) =>
        transporter.sendMail({
          from: SMTP_FROM,
          to,
          subject,
          html
        })
      )
    );
    console.log(`Payment notification emails sent via SMTP to ${emails.length} recipients`);
  } catch (err) {
    console.error('Failed to send payment notification emails:', err?.message || err);
  }
};

// Middleware: Verify JWT Token and load user with role
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;

    const { data: user } = await supabase
      .from('users')
      .select('id, email, role, full_name, company_name')
      .eq('id', decoded.userId)
      .single();

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    req.user = user;
    req.userRole = user.role;
    next();
  } catch (error) {
    res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
};

// Middleware: Verify API Key
const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers.authorization?.split(' ')[1];
  if (!apiKey) {
    return res.status(401).json({ status: 'error', message: 'No API key provided' });
  }

  // Allow test API keys for development (any key ending with -key)
  if (apiKey.endsWith('-key') || apiKey === 'test-api-key') {
    req.userId = 'test-user';
    req.tillId = process.env.SWIFTPAY_TILL_ID || 'dbdedaea-11d8-4bbe-b94f-84bbe4206d3c';
    req.userRole = ROLES.USER;
    console.log(`Test API key accepted: ${apiKey}`);
    return next();
  }

  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('user_id, till_id, is_active')
      .eq('api_key', apiKey)
      .single();

    if (error || !data) {
      return res.status(401).json({ status: 'error', message: 'Invalid API key' });
    }

    if (!data.is_active) {
      return res.status(401).json({ status: 'error', message: 'API key is inactive' });
    }

    req.userId = data.user_id;
    req.tillId = data.till_id;

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user_id)
      .single();

    req.userRole = user?.role || ROLES.USER;
    next();
  } catch (error) {
    console.error('API Key verification error:', error);
    res.status(401).json({ status: 'error', message: 'API key verification failed' });
  }
};

// Role-based authorization middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        userRole: req.userRole
      });
    }

    next();
  };
};

// Super Admin middleware (updated to use role constants)
const verifySuperAdmin = requireRole(ROLES.SUPER_ADMIN);

// Object-level authorization helpers
const authorizeTillAccess = async (userId, userRole, tillId) => {
  if (userRole === ROLES.SUPER_ADMIN) {
    return true;
  }

  const { data, error } = await supabase
    .from('tills')
    .select('id')
    .eq('id', tillId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
};

const authorizeTransactionAccess = async (userId, userRole, transactionId) => {
  if (userRole === ROLES.SUPER_ADMIN) {
    return true;
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('till_id')
    .eq('id', transactionId)
    .single();

  if (error || !data) {
    return false;
  }

  return authorizeTillAccess(userId, userRole, data.till_id);
};

const authorizeUserAccess = (currentUserId, currentUserRole, targetUserId) => {
  if (currentUserRole === ROLES.SUPER_ADMIN) {
    return true;
  }

  if (currentUserRole === ROLES.SUPPORT) {
    return true;
  }

  return currentUserId === targetUserId;
};

async function fetchTransactionsForUserAnalytics({ userId, requestedTillId }) {
  const { data: tills } = await supabase
    .from('tills')
    .select('id')
    .eq('user_id', userId);

  const pageSize = 1000;
  let page = 0;
  let hasMore = true;
  let allTransactions = [];

  if (tills && tills.length > 0) {
    const userTillIds = tills.map(t => t.id);
    const tillIds = requestedTillId ? [requestedTillId] : userTillIds;
    if (requestedTillId && !userTillIds.includes(requestedTillId)) {
      const err = new Error('Invalid tillId for this user');
      err.statusCode = 403;
      throw err;
    }

    while (hasMore) {
      const result = await supabase
        .from('transactions')
        .select('*')
        .in('till_id', tillIds)
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false });

      if (result.error) {
        const err = new Error(result.error.message);
        err.statusCode = 400;
        throw err;
      }

      if (result.data && result.data.length > 0) {
        allTransactions = allTransactions.concat(result.data);
        page++;
        hasMore = result.data.length === pageSize;
      } else {
        hasMore = false;
      }
    }
  } else {
    while (hasMore) {
      let query = supabase
        .from('transactions')
        .select('*');

      if (requestedTillId) {
        query = query.eq('till_id', requestedTillId);
      }

      const result = await query
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false });

      if (result.error) {
        const err = new Error(result.error.message);
        err.statusCode = 400;
        throw err;
      }

      if (result.data && result.data.length > 0) {
        allTransactions = allTransactions.concat(result.data);
        page++;
        hasMore = result.data.length === pageSize;
      } else {
        hasMore = false;
      }
    }
  }

  return allTransactions;
}

function checkGeminiRateLimit(userId) {
  const now = Date.now();
  const current = geminiRateLimit.get(userId) || [];
  const fresh = current.filter(ts => now - ts < GEMINI_RATE_LIMIT_WINDOW_MS);
  if (fresh.length >= GEMINI_RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterMs: GEMINI_RATE_LIMIT_WINDOW_MS - (now - fresh[0]) };
  }
  fresh.push(now);
  geminiRateLimit.set(userId, fresh);
  return { allowed: true, retryAfterMs: 0 };
}

function extractJsonFromModelText(text) {
  const raw = String(text || '').trim();
  const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) return fenced[1].trim();
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) return raw.slice(first, last + 1);
  return raw;
}

function buildRuleBasedInsightsFromCore(core) {
  const insights = [];
  const totalTx = core.totalTransactions || 0;
  const successRate = totalTx > 0 ? (core.successCount / totalTx) * 100 : 0;

  if (successRate < 70 && totalTx >= 20) {
    insights.push({
      type: 'anomaly',
      title: 'Low Success Rate',
      description: `Success rate is ${successRate.toFixed(1)}% for the selected period.`,
      severity: 'warning',
      action: 'Review M-Pesa gateway health, callback handling, and user input validation.'
    });
  }

  if (core.topFailedAmount && core.topFailedAmount.failedCount >= 5) {
    insights.push({
      type: 'anomaly',
      title: 'Amount With Frequent Failures',
      description: `KES ${Number(core.topFailedAmount.amount).toLocaleString()} has ${core.topFailedAmount.failedCount} failures in the selected period.`,
      severity: 'warning',
      action: 'Investigate user flows and STK push outcomes for this amount (timeouts, PIN entry drop-off, balance issues).'
    });
  }

  if (core.revenueChangePct !== null && core.revenueChangePct > 20) {
    insights.push({
      type: 'positive',
      title: 'Revenue Surge',
      description: `Revenue increased by ${core.revenueChangePct.toFixed(1)}% versus the previous comparable window.`,
      severity: 'success',
      action: 'Consider increasing float/limits and preparing support for peak volume.'
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Stable Operations',
      description: 'No major anomalies detected for the selected period.',
      severity: 'info',
      action: 'Use “Generate with Gemini” for deeper insights and next-best actions.'
    });
  }

  return {
    anomalyScore: insights.some(i => i.type === 'anomaly') ? 'high' : 'low',
    insights,
    provider: 'rule_based'
  };
}

async function generateGeminiInsights({ core, rangeKey, userId, requestedTillId }) {
  const prompt = `You are an expert fintech analytics assistant for a payment platform.\n\nTASK:\nGenerate high-signal, evidence-driven insights and next actions for a merchant. Prioritize issues that impact conversion, revenue, and reliability.\n\nOUTPUT FORMAT:\nReturn STRICT JSON only (no markdown, no extra text) with this schema:\n{\n  "anomalyScore": "low"|"high",\n  "insights": [\n    {\n      "type": "anomaly"|"positive"|"info",\n      "title": string,\n      "description": string,\n      "severity": "error"|"warning"|"success"|"info",\n      "action": string\n    }\n  ]\n}\n\nRULES:\n- Max 9 insights.\n- Every insight MUST cite at least one concrete number from the provided data.\n- Use KES currency formatting in descriptions.\n- Descriptions < 160 chars.\n- Actions must be operational and testable (what to check/change next).\n\nDATA (selected period):\n${JSON.stringify({ rangeKey, requestedTillId, core }, null, 2)}`;

  if (!GEMINI_API_KEY) {
    const err = new Error('Gemini is not configured: missing GEMINI_API_KEY');
    err.statusCode = 503;
    throw err;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;
  let response;
  try {
    response = await axios.post(
      `${url}?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800
        }
      },
      {
        timeout: 12000,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const msg = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Gemini request failed';
    const err = new Error(msg);
    err.statusCode = error?.response?.status || 502;
    throw err;
  }

  const text = response?.data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n') || '';
  const jsonText = extractJsonFromModelText(text);

  try {
    const parsed = JSON.parse(jsonText);
    if (parsed && Array.isArray(parsed.insights)) {
      return { ...parsed, provider: 'gemini', model: GEMINI_MODEL };
    }
  } catch (e) {
    const err = new Error('Gemini response was not valid JSON');
    err.statusCode = 502;
    throw err;
  }

  const err = new Error('Gemini response did not match expected schema');
  err.statusCode = 502;
  throw err;
}

// Get M-Pesa Access Token
async function getMpesaAccessToken() {
  try {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(OAUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      params: {
        grant_type: 'client_credentials'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa Token Error:', error.response?.data || error.message);
    throw new Error('Failed to get M-Pesa access token');
  }
}

// Get User Profile
app.get('/api/user', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, company_name, created_at')
      .eq('id', req.userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({
      status: 'success',
      user: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        companyName: data.company_name,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update User Profile
app.put('/api/user', verifyToken, async (req, res) => {
  try {
    const { fullName, companyName } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        company_name: companyName,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.userId)
      .select()
      .single();

    if (error || !data) {
      return res.status(400).json({ status: 'error', message: error?.message || 'Failed to update profile' });
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      user: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        companyName: data.company_name,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== SUPER ADMIN ROUTES ====================

// Get Platform Analytics
app.get('/api/super-admin/analytics', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    const isPaidStatus = (status) => {
      const s = String(status || '').toLowerCase();
      return s === 'success' || s === 'paid' || s === 'completed';
    };
    
    // Calculate date range
    const now = new Date();
    const days = range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get total tills
    const { count: totalTills } = await supabase
      .from('tills')
      .select('*', { count: 'exact', head: true });

    // Get active tills (with transactions in last 7 days)
    const { count: activeTills } = await supabase
      .from('tills')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get transactions in range
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, status, created_at, till_id')
      .gte('created_at', startDate.toISOString());

    const totalTransactions = transactions?.length || 0;
    const successfulTransactions = transactions?.filter(t => isPaidStatus(t.status))?.length || 0;
    const totalRevenue = transactions
      ?.filter(t => isPaidStatus(t.status))
      ?.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;

    // Get daily revenue for chart
    const dailyRevenue = {};
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyRevenue[dateStr] = 0;
    }

    transactions?.forEach(t => {
      if (isPaidStatus(t.status)) {
        const dateStr = t.created_at.split('T')[0];
        if (dailyRevenue.hasOwnProperty(dateStr)) {
          dailyRevenue[dateStr] += parseFloat(t.amount) || 0;
        }
      }
    });

    // Get top tills by revenue
    const { data: topTillsData } = await supabase
      .from('tills')
      .select('id, till_name, user_id, users:user_id (email, full_name, company_name)')
      .order('created_at', { ascending: false });

    const tillRevenue = {};
    transactions?.forEach(t => {
      if (isPaidStatus(t.status) && t.till_id) {
        tillRevenue[t.till_id] = (tillRevenue[t.till_id] || 0) + (parseFloat(t.amount) || 0);
      }
    });

    const topTills = topTillsData
      ?.map(till => ({
        ...till,
        revenue: tillRevenue[till.id] || 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) || [];

    res.json({
      status: 'success',
      analytics: {
        totalTills: totalTills || 0,
        activeTills: activeTills || 0,
        totalUsers: totalUsers || 0,
        totalTransactions,
        successfulTransactions,
        failedTransactions: totalTransactions - successfulTransactions,
        totalRevenue,
        successRate: totalTransactions > 0 ? ((successfulTransactions / totalTransactions) * 100).toFixed(1) : 0,
        dailyRevenue,
        topTills
      }
    });
  } catch (error) {
    console.error('Super admin analytics error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get All Tills
app.get('/api/super-admin/tills', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('tills')
      .select(`
        *,
        users:user_id (email, full_name, company_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`till_name.ilike.%${search}%,users.email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      tills: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get all tills error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get All Transactions
app.get('/api/super-admin/transactions', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, tillId, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('transactions')
      .select(`
        *,
        tills:till_id (till_name, user_id),
        users:tills.user_id (email, full_name, company_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tillId) {
      query = query.eq('till_id', tillId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      transactions: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get Recent Activity
app.get('/api/super-admin/activity', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const isPaidStatus = (status) => {
      const s = String(status || '').toLowerCase();
      return s === 'success' || s === 'paid' || s === 'completed';
    };

    // Get recent transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select(`
        *,
        tills:till_id (name, user_id),
        users:tills.user_id (email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Get recent tills created
    const { data: newTills } = await supabase
      .from('tills')
      .select(`
        *,
        users:user_id (email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Get recent users
    const { data: newUsers } = await supabase
      .from('users')
      .select('id, email, full_name, company_name, created_at')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Combine and sort activities
    const activities = [
      ...(transactions || []).map(t => ({
        type: 'transaction',
        id: t.id,
        message: `Transaction of KES ${t.amount} ${isPaidStatus(t.status) ? 'completed' : String(t.status || '').toLowerCase() === 'pending' ? 'pending' : 'failed'}`,
        user: t.users?.full_name || 'Unknown',
        till: t.tills?.name || 'Unknown',
        amount: t.amount,
        status: t.status,
        timestamp: t.created_at
      })),
      ...(newTills || []).map(t => ({
        type: 'till_created',
        id: t.id,
        message: `New till "${t.name || 'Unnamed'}" created`,
        user: t.users?.full_name || 'Unknown',
        till: t.name || 'Unnamed',
        timestamp: t.created_at
      })),
      ...(newUsers || []).map(u => ({
        type: 'user_joined',
        id: u.id,
        message: `New user "${u.full_name || 'Unknown'}" joined`,
        user: u.full_name,
        company: u.company_name,
        timestamp: u.created_at
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, parseInt(limit));

    res.json({
      status: 'success',
      activities
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Suspend Till
app.post('/api/super-admin/tills/:id/suspend', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data, error } = await supabase
      .from('tills')
      .update({ 
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      message: 'Till suspended successfully',
      till: data
    });
  } catch (error) {
    console.error('Suspend till error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Reactivate Till
app.post('/api/super-admin/tills/:id/reactivate', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tills')
      .update({ 
        status: 'active',
        suspended_at: null,
        suspension_reason: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      message: 'Till reactivated successfully',
      till: data
    });
  } catch (error) {
    console.error('Reactivate till error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Delete Till
app.delete('/api/super-admin/tills/:id', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tills')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      message: 'Till deleted successfully'
    });
  } catch (error) {
    console.error('Delete till error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get Till Detailed Analytics
app.get('/api/super-admin/tills/:id/analytics', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;

    // Helper function to check if status is paid/successful
    const isPaidStatus = (status) => {
      const s = String(status || '').toLowerCase();
      return s === 'success' || s === 'paid' || s === 'completed';
    };

    // Calculate date range using calendar-based logic (same as user dashboard)
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case '1d':
        // Today: midnight to midnight
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case '7d':
        // Week: Sunday to Sunday
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        break;
      case '30d':
        // Month: 1st to last day
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case '1y':
        // Year: Jan 1 to Dec 31
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Get till details
    const { data: till, error: tillError } = await supabase
      .from('tills')
      .select('*, users!inner(email, full_name, company_name)')
      .eq('id', id)
      .single();

    if (tillError || !till) {
      return res.status(404).json({ status: 'error', message: 'Till not found' });
    }

    // Get all transactions for this till
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('till_id', id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (txError) {
      return res.status(400).json({ status: 'error', message: txError.message });
    }

    // Calculate analytics
    const totalRevenue = transactions.reduce((sum, tx) => sum + (isPaidStatus(tx.status) ? (tx.amount || 0) : 0), 0);
    const successfulTransactions = transactions.filter(tx => isPaidStatus(tx.status));
    const failedTransactions = transactions.filter(tx => String(tx.status || '').toLowerCase() === 'failed');
    const pendingTransactions = transactions.filter(tx => String(tx.status || '').toLowerCase() === 'pending');
    const successRate = transactions.length > 0 ? (successfulTransactions.length / transactions.length) * 100 : 0;

    // Daily revenue
    const dailyRevenue = {};
    transactions.forEach(tx => {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      if (isPaidStatus(tx.status)) {
        dailyRevenue[date] = (dailyRevenue[date] || 0) + (tx.amount || 0);
      }
    });

    // Weekly revenue
    const weeklyRevenue = {};
    transactions.forEach(tx => {
      const date = new Date(tx.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      if (isPaidStatus(tx.status)) {
        weeklyRevenue[weekKey] = (weeklyRevenue[weekKey] || 0) + (tx.amount || 0);
      }
    });

    // Monthly revenue
    const monthlyRevenue = {};
    transactions.forEach(tx => {
      const date = new Date(tx.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (isPaidStatus(tx.status)) {
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (tx.amount || 0);
      }
    });

    // Payment patterns by hour
    const hourlyTransactions = Array(24).fill(0);
    const hourlyRevenue = Array(24).fill(0);
    transactions.forEach(tx => {
      const hour = new Date(tx.created_at).getHours();
      hourlyTransactions[hour]++;
      if (isPaidStatus(tx.status)) {
        hourlyRevenue[hour] += tx.amount || 0;
      }
    });

    // Peak hours
    const peakHours = hourlyRevenue
      .map((revenue, hour) => ({ hour, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Common transaction amounts
    const amountFrequency = {};
    transactions.forEach(tx => {
      const amount = tx.amount || 0;
      const roundedAmount = Math.round(amount);
      amountFrequency[roundedAmount] = (amountFrequency[roundedAmount] || 0) + 1;
    });
    const commonAmounts = Object.entries(amountFrequency)
      .map(([amount, count]) => ({ amount: parseFloat(amount), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Customer type breakdown (based on transaction patterns)
    const customerTypes = {
      new: transactions.filter(tx => {
        const txDate = new Date(tx.created_at);
        const firstTx = transactions.find(t => t.phone_number === tx.phone_number);
        return firstTx && new Date(firstTx.created_at).getTime() === txDate.getTime();
      }).length,
      returning: transactions.filter(tx => {
        const samePhoneTxs = transactions.filter(t => t.phone_number === tx.phone_number);
        return samePhoneTxs.length > 1;
      }).length / 2, // Divide by 2 to avoid double counting
      oneTime: transactions.length - transactions.filter(tx => {
        const samePhoneTxs = transactions.filter(t => t.phone_number === tx.phone_number);
        return samePhoneTxs.length > 1;
      }).length
    };

    // Average transaction value
    const avgTransactionValue = successfulTransactions.length > 0
      ? totalRevenue / successfulTransactions.length
      : 0;

    // Transaction volume trends
    const dailyVolume = {};
    transactions.forEach(tx => {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      dailyVolume[date] = (dailyVolume[date] || 0) + 1;
    });

    res.json({
      status: 'success',
      analytics: {
        till,
        summary: {
          totalRevenue,
          totalTransactions: transactions.length,
          successfulTransactions: successfulTransactions.length,
          failedTransactions: failedTransactions.length,
          successRate: successRate.toFixed(2),
          avgTransactionValue: avgTransactionValue.toFixed(2),
          period
        },
        dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue })),
        weeklyRevenue: Object.entries(weeklyRevenue).map(([week, revenue]) => ({ week, revenue })),
        monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
        hourlyRevenue: hourlyRevenue.map((revenue, hour) => ({ hour, revenue })),
        peakHours,
        commonAmounts,
        customerTypes,
        dailyVolume: Object.entries(dailyVolume).map(([date, volume]) => ({ date, volume })),
        transactions: transactions.slice(-100) // Last 100 transactions
      }
    });
  } catch (error) {
    console.error('Get till analytics error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== AUDIT LOGS ====================

// Log Audit Action
const logAuditAction = async (adminId, action, entityType, entityId, details, req) => {
  try {
    await supabase.from('audit_logs').insert({
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent')
    });
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
};

// Get Audit Logs
app.get('/api/super-admin/audit-logs', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entityType } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        admin:admin_id (full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) {
      query = query.eq('action', action);
    }

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      logs: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== ALERT RULES ====================

// Create Alert Rule
app.post('/api/super-admin/alert-rules', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { name, ruleType, conditions, threshold, comparisonOperator, notificationChannels } = req.body;

    const { data, error } = await supabase
      .from('alert_rules')
      .insert([{
        admin_id: req.userId,
        name,
        rule_type: ruleType,
        conditions,
        threshold,
        comparison_operator: comparisonOperator,
        notification_channels: notificationChannels || ['email']
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    await logAuditAction(req.userId, 'create_alert_rule', 'alert_rule', data.id, { name: data.name }, req);

    res.json({
      status: 'success',
      message: 'Alert rule created successfully',
      rule: data
    });
  } catch (error) {
    console.error('Create alert rule error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get Alert Rules
app.get('/api/super-admin/alert-rules', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alert_rules')
      .select(`
        *,
        admin:admin_id (full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      rules: data || []
    });
  } catch (error) {
    console.error('Get alert rules error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update Alert Rule
app.put('/api/super-admin/alert-rules/:id', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, enabled, notificationChannels } = req.body;

    const { data, error } = await supabase
      .from('alert_rules')
      .update({
        name,
        enabled,
        notification_channels: notificationChannels,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    await logAuditAction(req.userId, 'update_alert_rule', 'alert_rule', id, { name }, req);

    res.json({
      status: 'success',
      message: 'Alert rule updated successfully',
      rule: data
    });
  } catch (error) {
    console.error('Update alert rule error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Delete Alert Rule
app.delete('/api/super-admin/alert-rules/:id', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('alert_rules')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    await logAuditAction(req.userId, 'delete_alert_rule', 'alert_rule', id, {}, req);

    res.json({
      status: 'success',
      message: 'Alert rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete alert rule error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get Alert History
app.get('/api/super-admin/alert-history', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, acknowledged } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('alert_history')
      .select(`
        *,
        rule:rule_id (name, rule_type),
        acknowledged_by_user:acknowledged_by (full_name, email)
      `, { count: 'exact' })
      .order('triggered_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (acknowledged !== undefined) {
      query = query.eq('acknowledged', acknowledged === 'true');
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      alerts: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get alert history error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Acknowledge Alert
app.post('/api/super-admin/alerts/:id/acknowledge', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('alert_history')
      .update({
        acknowledged: true,
        acknowledged_by: req.userId,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      message: 'Alert acknowledged successfully',
      alert: data
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== ANOMALY DETECTION ====================

// Detect Anomalies
app.post('/api/super-admin/detect-anomalies', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { entityType, timeRange = '7d' } = req.body;
    
    const now = new Date();
    const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const anomalies = [];

    if (entityType === 'transaction' || !entityType) {
      // Detect unusual transaction amounts
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, amount, till_id, phone_number, created_at')
        .gte('created_at', startDate.toISOString())
        .order('amount', { ascending: false });

      if (transactions && transactions.length > 0) {
        const amounts = transactions.map(t => parseFloat(t.amount));
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length);

        transactions.forEach(tx => {
          const amount = parseFloat(tx.amount);
          const zScore = Math.abs((amount - mean) / stdDev);
          
          if (zScore > 3) {
            anomalies.push({
              entity_type: 'transaction',
              entity_id: tx.id,
              anomaly_type: 'unusual_amount',
              severity: zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium',
              confidence_score: Math.min(zScore * 15, 100).toFixed(2),
              details: {
                amount,
                mean: mean.toFixed(2),
                stdDev: stdDev.toFixed(2),
                zScore: zScore.toFixed(2),
                till_id: tx.till_id,
                phone_number: tx.phone_number
              }
            });
          }
        });
      }

      // Detect rapid transactions from same phone
      const phoneTransactions = {};
      transactions?.forEach(tx => {
        if (!phoneTransactions[tx.phone_number]) {
          phoneTransactions[tx.phone_number] = [];
        }
        phoneTransactions[tx.phone_number].push(new Date(tx.created_at));
      });

      Object.entries(phoneTransactions).forEach(([phone, dates]) => {
        if (dates.length > 10) {
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
          const recentCount = dates.filter(d => d > oneHourAgo).length;
          
          if (recentCount > 5) {
            anomalies.push({
              entity_type: 'transaction',
              entity_id: phone,
              anomaly_type: 'rapid_transactions',
              severity: recentCount > 10 ? 'critical' : 'high',
              confidence_score: Math.min(recentCount * 10, 100).toFixed(2),
              details: {
                phone_number: phone,
                transaction_count: recentCount,
                time_window: '1 hour'
              }
            });
          }
        }
      });
    }

    // Save detected anomalies
    for (const anomaly of anomalies) {
      await supabase.from('anomaly_detection').insert([{
        ...anomaly,
        detected_at: new Date().toISOString()
      }]);
    }

    res.json({
      status: 'success',
      message: `Detected ${anomalies.length} anomalies`,
      anomalies
    });
  } catch (error) {
    console.error('Detect anomalies error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get Anomalies
app.get('/api/super-admin/anomalies', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, severity, resolved } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('anomaly_detection')
      .select('*', { count: 'exact' })
      .order('detected_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (resolved !== undefined) {
      query = query.eq('resolved', resolved === 'true');
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      anomalies: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get anomalies error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Resolve Anomaly
app.post('/api/super-admin/anomalies/:id/resolve', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const { data, error } = await supabase
      .from('anomaly_detection')
      .update({
        resolved: true,
        resolved_by: req.userId,
        resolved_at: new Date().toISOString(),
        notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    await logAuditAction(req.userId, 'resolve_anomaly', 'anomaly', id, { notes }, req);

    res.json({
      status: 'success',
      message: 'Anomaly resolved successfully',
      anomaly: data
    });
  } catch (error) {
    console.error('Resolve anomaly error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== SYSTEM HEALTH ====================

// Record System Health Metric
const recordHealthMetric = async (metricType, metricName, value, unit, status, metadata = {}) => {
  try {
    await supabase.from('system_health_metrics').insert([{
      metric_type: metricType,
      metric_name: metricName,
      value,
      unit,
      status,
      metadata,
      recorded_at: new Date().toISOString()
    }]);
  } catch (error) {
    console.error('Error recording health metric:', error);
  }
};

// Get System Health
app.get('/api/super-admin/system-health', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('system_health_metrics')
      .select('*')
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: false });

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    // Group by metric type
    const grouped = {};
    (data || []).forEach(metric => {
      if (!grouped[metric.metric_type]) {
        grouped[metric.metric_type] = [];
      }
      grouped[metric.metric_type].push(metric);
    });

    // Calculate current status for each metric type
    const summary = {};
    Object.entries(grouped).forEach(([type, metrics]) => {
      const latest = metrics[0];
      summary[type] = {
        current: latest.value,
        status: latest.status,
        unit: latest.unit,
        trend: metrics.length > 1 ? 
          (latest.value - metrics[1].value) / metrics[1].value * 100 : 0
      };
    });

    res.json({
      status: 'success',
      metrics: grouped,
      summary
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== BULK ACTIONS ====================

// Bulk Suspend Tills
app.post('/api/super-admin/tills/bulk-suspend', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { tillIds, reason } = req.body;

    const { data, error } = await supabase
      .from('tills')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason
      })
      .in('id', tillIds)
      .select();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    await logAuditAction(req.userId, 'bulk_suspend_tills', 'till', null, { count: tillIds.length, reason }, req);

    res.json({
      status: 'success',
      message: `Suspended ${data?.length || 0} tills successfully`,
      tills: data || []
    });
  } catch (error) {
    console.error('Bulk suspend tills error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Bulk Reactivate Tills
app.post('/api/super-admin/tills/bulk-reactivate', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { tillIds } = req.body;

    const { data, error } = await supabase
      .from('tills')
      .update({
        status: 'active',
        suspended_at: null,
        suspension_reason: null
      })
      .in('id', tillIds)
      .select();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    await logAuditAction(req.userId, 'bulk_reactivate_tills', 'till', null, { count: tillIds.length }, req);

    res.json({
      status: 'success',
      message: `Reactivated ${data?.length || 0} tills successfully`,
      tills: data || []
    });
  } catch (error) {
    console.error('Bulk reactivate tills error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== ANNOUNCEMENTS ====================

// Create Announcement
app.post('/api/super-admin/announcements', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { title, message, priority, targetAudience, expiresAt } = req.body;

    const { data, error } = await supabase
      .from('announcements')
      .insert([{
        admin_id: req.userId,
        title,
        message,
        priority: priority || 'info',
        target_audience: targetAudience || 'all',
        expires_at: expiresAt,
        published: true,
        published_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    await logAuditAction(req.userId, 'create_announcement', 'announcement', data.id, { title }, req);

    res.json({
      status: 'success',
      message: 'Announcement created successfully',
      announcement: data
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get Announcements
app.get('/api/super-admin/announcements', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('announcements')
      .select(`
        *,
        admin:admin_id (full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      announcements: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== ADVANCED REPORTING ====================

// Generate Report
app.post('/api/super-admin/reports/generate', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { reportType, startDate, endDate, format = 'csv', filters = {} } = req.body;

    let data = [];
    let filename = '';

    if (reportType === 'transactions') {
      const { data: txData } = await supabase
        .from('transactions')
        .select(`
          *,
          tills:till_id (name),
          users:tills.user_id (email, full_name)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      data = txData || [];
      filename = `transactions_${startDate}_${endDate}`;
    } else if (reportType === 'revenue') {
      const { data: txData } = await supabase
        .from('transactions')
        .select('amount, created_at, till_id')
        .eq('status', 'completed')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      data = txData || [];
      filename = `revenue_${startDate}_${endDate}`;
    } else if (reportType === 'tills') {
      const { data: tillData } = await supabase
        .from('tills')
        .select(`
          *,
          users:user_id (email, full_name, company_name)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      data = tillData || [];
      filename = `tills_${startDate}_${endDate}`;
    }

    // For now, return data as JSON (in production, you'd generate CSV/PDF files)
    res.json({
      status: 'success',
      message: 'Report generated successfully',
      report: {
        type: reportType,
        format,
        filename,
        data,
        recordCount: data.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, companyName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          full_name: fullName,
          company_name: companyName
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    const user = data[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        companyName: user.company_name
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/notifications/email-settings', verifyToken, async (req, res) => {
  try {
    const settings = await getUserNotificationSettings(req.userId);
    res.json({ status: 'success', settings });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.put('/api/notifications/email-settings', verifyToken, async (req, res) => {
  try {
    const enabled = req.body?.enabled !== false;
    const rawEmails = Array.isArray(req.body?.emails) ? req.body.emails : [];

    const normalized = rawEmails
      .map(normalizeEmail)
      .filter((e) => e);

    const unique = Array.from(new Set(normalized));

    if (unique.length > 5) {
      return res.status(400).json({ status: 'error', message: 'You can add a maximum of 5 emails' });
    }

    const invalid = unique.filter((e) => !isValidEmail(e));
    if (invalid.length > 0) {
      return res.status(400).json({ status: 'error', message: `Invalid email(s): ${invalid.join(', ')}` });
    }

    const saved = await upsertUserNotificationSettings(req.userId, enabled, unique);
    res.json({ status: 'success', settings: { enabled: saved.enabled !== false, emails: saved.emails || [] } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/notifications/test-email', verifyToken, async (req, res) => {
  try {
    const force = req.body?.force === true;
    const toRaw = req.body?.to;

    const transporter = getEmailTransporter();
    if (!transporter) {
      return res.status(500).json({
        status: 'error',
        message: 'Email transporter not configured. Set SMTP_HOST + SMTP_FROM (and optionally SMTP_USER/SMTP_PASS).'
      });
    }

    const settings = await getUserNotificationSettings(req.userId);
    if (!force && settings.enabled === false) {
      return res.status(400).json({
        status: 'error',
        message: 'Email notifications are disabled. Enable them in settings or call with { force: true }.'
      });
    }

    let recipients = [];
    if (toRaw) {
      const to = normalizeEmail(toRaw);
      if (!isValidEmail(to)) {
        return res.status(400).json({ status: 'error', message: 'Invalid "to" email address' });
      }
      recipients = [to];
    } else {
      recipients = (settings.emails || [])
        .map(normalizeEmail)
        .filter((e) => isValidEmail(e));
    }

    recipients = Array.from(new Set(recipients)).slice(0, 5);

    if (recipients.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No recipient emails found. Add emails in Dashboard Settings or provide { to: "email" }.'
      });
    }

    const when = new Date().toISOString();
    const subject = 'SwiftPay Test Email';
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px">SwiftPay Test Email</h2>
        <p style="margin:0 0 16px;color:#4b5563">This is a test notification email from your SwiftPay backend.</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:6px 10px;color:#6b7280">User</td><td style="padding:6px 10px"><b>${req.userId}</b></td></tr>
          <tr><td style="padding:6px 10px;color:#6b7280">Time</td><td style="padding:6px 10px"><b>${when}</b></td></tr>
          <tr><td style="padding:6px 10px;color:#6b7280">Backend</td><td style="padding:6px 10px"><b>SMTP (Brevo)</b></td></tr>
        </table>
      </div>
    `;

    await Promise.all(
      recipients.map((to) =>
        transporter.sendMail({
          from: SMTP_FROM,
          to,
          subject,
          html
        })
      )
    );

    res.json({ status: 'success', message: 'Test email queued', recipients });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/dashboard/ai-insights', verifyToken, async (req, res) => {
  try {
    const { range, tillId, force } = req.query;
    const requestedTillId = tillId ? String(tillId) : null;
    const rangeKey = String(range || 'week').toLowerCase();
    const forceRefresh = String(force || '').toLowerCase() === 'true';

    const cacheKey = `${req.userId}|${requestedTillId || 'all'}|${rangeKey}`;
    const now = Date.now();

    if (!forceRefresh) {
      const cached = geminiInsightsCache.get(cacheKey);
      if (cached && cached.expiresAt > now) {
        return res.json({
          status: 'success',
          cached: true,
          generatedAt: cached.generatedAt,
          expiresAt: cached.expiresAt,
          provider: cached.provider,
          model: cached.model,
          aiInsights: cached.aiInsights
        });
      }

      return res.json({
        status: 'success',
        cached: false,
        available: false
      });
    }

    const rl = checkGeminiRateLimit(req.userId);
    if (!rl.allowed) {
      return res.status(429).json({
        status: 'error',
        message: 'Too many AI insight requests. Please try again shortly.',
        retryAfterMs: rl.retryAfterMs
      });
    }

    const inFlight = geminiInFlight.get(cacheKey);
    if (inFlight) {
      const result = await inFlight;
      return res.json(result);
    }

    const promise = (async () => {
      const transactions = await fetchTransactionsForUserAnalytics({
        userId: req.userId,
        requestedTillId
      });

      const isPaidStatus = (status) => {
        const s = String(status || '').toLowerCase();
        return s === 'success' || s === 'paid' || s === 'completed';
      };

      const nowDate = new Date();
      const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(todayStart.getDate() - todayStart.getDay());
      const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
      const yearStart = new Date(nowDate.getFullYear(), 0, 1);

      let selectedStart = weekStart;
      let selectedEnd = new Date(weekStart);
      selectedEnd.setDate(weekStart.getDate() + 7);
      if (rangeKey === 'today') {
        selectedStart = todayStart;
        selectedEnd = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 1);
      } else if (rangeKey === 'month') {
        selectedStart = monthStart;
        selectedEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 1);
      } else if (rangeKey === 'year') {
        selectedStart = yearStart;
        selectedEnd = new Date(nowDate.getFullYear() + 1, 0, 1);
      }

      const filterByWindow = (tx, startDate, endDate) => {
        const txDate = new Date(tx.created_at);
        return txDate >= startDate && txDate < endDate;
      };

      const rangeTransactions = transactions.filter(tx => filterByWindow(tx, selectedStart, selectedEnd));
      const successCount = rangeTransactions.filter(t => isPaidStatus(t.status)).length;
      const failedCount = rangeTransactions.filter(t => String(t.status || '').toLowerCase() === 'failed').length;
      const pendingCount = rangeTransactions.filter(t => String(t.status || '').toLowerCase() === 'pending').length;
      const paidRevenue = rangeTransactions.filter(t => isPaidStatus(t.status)).reduce((sum, t) => sum + (t.amount || 0), 0);

      const amountMap = {};
      rangeTransactions.forEach(tx => {
        const amount = Number(tx.amount || 0);
        const key = String(amount);
        if (!amountMap[key]) amountMap[key] = { amount, totalCount: 0, paidCount: 0, failedCount: 0, pendingCount: 0, paidRevenue: 0 };
        amountMap[key].totalCount++;
        const st = String(tx.status || '').toLowerCase();
        if (isPaidStatus(st)) {
          amountMap[key].paidCount++;
          amountMap[key].paidRevenue += amount;
        } else if (st === 'failed') amountMap[key].failedCount++;
        else if (st === 'pending') amountMap[key].pendingCount++;
      });

      const topAmountsByCount = Object.values(amountMap).sort((a, b) => b.totalCount - a.totalCount).slice(0, 10);
      const topAmountsByPaidRevenue = Object.values(amountMap).sort((a, b) => b.paidRevenue - a.paidRevenue).slice(0, 10);
      const topFailedAmount = Object.values(amountMap).sort((a, b) => b.failedCount - a.failedCount)[0] || null;

      const revenueOverTime = [];
      if (rangeKey === 'today') {
        for (let h = 0; h < 24; h++) {
          const bucketStart = new Date(selectedStart);
          bucketStart.setHours(h, 0, 0, 0);
          const bucketEnd = new Date(selectedStart);
          bucketEnd.setHours(h + 1, 0, 0, 0);
          const bucketTx = rangeTransactions.filter(tx => filterByWindow(tx, bucketStart, bucketEnd));
          const bucketRevenue = bucketTx.filter(t => isPaidStatus(t.status)).reduce((sum, t) => sum + (t.amount || 0), 0);
          revenueOverTime.push({ date: `${String(h).padStart(2, '0')}:00`, revenue: bucketRevenue, transactions: bucketTx.length, successful: bucketTx.filter(t => isPaidStatus(t.status)).length });
        }
      } else if (rangeKey === 'month') {
        for (let d = new Date(selectedStart); d < selectedEnd; d.setDate(d.getDate() + 1)) {
          const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
          const dayTx = rangeTransactions.filter(tx => filterByWindow(tx, dayStart, dayEnd));
          const dayRevenue = dayTx.filter(t => isPaidStatus(t.status)).reduce((sum, t) => sum + (t.amount || 0), 0);
          revenueOverTime.push({ date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: dayRevenue, transactions: dayTx.length, successful: dayTx.filter(t => isPaidStatus(t.status)).length });
        }
      } else if (rangeKey === 'year') {
        for (let m = 0; m < 12; m++) {
          const mStart = new Date(nowDate.getFullYear(), m, 1);
          const mEnd = new Date(nowDate.getFullYear(), m + 1, 1);
          const monthTx = rangeTransactions.filter(tx => filterByWindow(tx, mStart, mEnd));
          const monthRevenue = monthTx.filter(t => isPaidStatus(t.status)).reduce((sum, t) => sum + (t.amount || 0), 0);
          revenueOverTime.push({ date: mStart.toLocaleDateString('en-US', { month: 'short' }), revenue: monthRevenue, transactions: monthTx.length, successful: monthTx.filter(t => isPaidStatus(t.status)).length });
        }
      } else {
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
          const dayTx = rangeTransactions.filter(tx => filterByWindow(tx, dayStart, dayEnd));
          const dayRevenue = dayTx.filter(t => isPaidStatus(t.status)).reduce((sum, t) => sum + (t.amount || 0), 0);
          revenueOverTime.push({ date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: dayRevenue, transactions: dayTx.length, successful: dayTx.filter(t => isPaidStatus(t.status)).length });
        }
      }

      const recentRevenue = revenueOverTime.slice(-3).reduce((sum, d) => sum + (d.revenue || 0), 0);
      const previousRevenue = revenueOverTime.slice(-6, -3).reduce((sum, d) => sum + (d.revenue || 0), 0);
      const revenueChangePct = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : null;

      const core = {
        totalTransactions: rangeTransactions.length,
        successCount,
        failedCount,
        pendingCount,
        paidRevenue,
        revenueOverTime,
        topAmountsByCount,
        topAmountsByPaidRevenue,
        topFailedAmount,
        revenueChangePct
      };

      const ai = await generateGeminiInsights({ core, rangeKey, userId: req.userId, requestedTillId });
      const generatedAt = Date.now();
      const expiresAt = generatedAt + GEMINI_INSIGHTS_TTL_MS;

      const payload = {
        status: 'success',
        cached: false,
        generatedAt,
        expiresAt,
        provider: ai.provider,
        model: ai.model || null,
        aiInsights: {
          anomalyScore: ai.anomalyScore,
          insights: ai.insights
        }
      };

      geminiInsightsCache.set(cacheKey, {
        generatedAt,
        expiresAt,
        provider: ai.provider,
        model: ai.model || null,
        aiInsights: payload.aiInsights
      });

      return payload;
    })();

    geminiInFlight.set(cacheKey, promise);
    const result = await promise;
    geminiInFlight.delete(cacheKey);
    res.json(result);
  } catch (error) {
    geminiInFlight.delete(`${req.userId}|${String(req.query.tillId || 'all')}|${String(req.query.range || 'week').toLowerCase()}`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password required' });
    }

    // Get user from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (error || !data) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, data.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const transporterCheck = getEmailTransporter();
    if (!transporterCheck && !(BREVO_API_KEY && SMTP_FROM)) {
      return res.status(500).json({
        status: 'error',
        message: 'Email transporter not configured. Set SMTP_HOST + SMTP_FROM (and optionally SMTP_USER/SMTP_PASS), or configure BREVO_API_KEY + SMTP_FROM.'
      });
    }

    const otpWindowSeconds = 60;
    const { data: lastOtp } = await supabase
      .from('auth_email_otps')
      .select('created_at')
      .eq('user_id', data.id)
      .eq('purpose', 'login')
      .order('created_at', { ascending: false })
      .limit(1);

    const lastCreated = lastOtp?.[0]?.created_at ? new Date(lastOtp[0].created_at).getTime() : 0;
    if (lastCreated && Date.now() - lastCreated < otpWindowSeconds * 1000) {
      return res.status(429).json({
        status: 'error',
        message: `Please wait ${otpWindowSeconds} seconds before requesting another OTP.`
      });
    }

    await supabase
      .from('auth_email_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('user_id', data.id)
      .eq('purpose', 'login')
      .is('consumed_at', null);

    const otp = generateOtpCode();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const challengeToken = createLoginChallengeToken({ userId: data.id, email: normalizedEmail });

    const otpRow = {
      id: uuidv4(),
      user_id: data.id,
      email: normalizedEmail,
      otp_hash: otpHash,
      purpose: 'login',
      attempts: 0,
      max_attempts: 5,
      expires_at: expiresAt.toISOString(),
      consumed_at: null,
      ip: req.ip,
      user_agent: req.headers['user-agent']
    };

    const { error: otpInsertError } = await supabase
      .from('auth_email_otps')
      .insert([otpRow]);

    if (otpInsertError) {
      return res.status(400).json({ status: 'error', message: otpInsertError.message });
    }

    const subject = 'SwiftPay Login OTP';
    const html = buildEmailHtml({
      title: 'SwiftPay Login Verification',
      lead: 'Use the OTP below to complete your login.',
      contentHtml: `
        <div style="margin:14px 0 6px;color:#e5e7eb">Your One-Time Password (OTP):</div>
        <div style="font-size:34px;letter-spacing:6px;font-weight:800;color:#fff;margin:10px 0 14px">${otp}</div>
        <div style="color:#94a3b8;font-size:13px">This code expires in <b>10 minutes</b>.</div>
      `,
      footerHtml: 'If you did not attempt to sign in, you can ignore this email.'
    });

    await sendEmail({ to: normalizedEmail, subject, html });

    return res.json({
      status: 'otp_required',
      message: 'OTP sent to your email',
      challengeToken,
      expiresAt: expiresAt.toISOString(),
      rememberMe: rememberMe === true
    });

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/auth/login/verify-otp', async (req, res) => {
  try {
    const { otp, challengeToken, rememberMe } = req.body;

    if (!otp || !challengeToken) {
      return res.status(400).json({ status: 'error', message: 'OTP and challengeToken required' });
    }

    let decoded;
    try {
      decoded = verifyLoginChallengeToken(challengeToken);
    } catch (e) {
      return res.status(401).json({ status: 'error', message: 'Invalid or expired login challenge' });
    }

    const userId = decoded.userId;
    const email = normalizeEmail(decoded.email);

    const { data: otpRows, error: otpFetchError } = await supabase
      .from('auth_email_otps')
      .select('*')
      .eq('user_id', userId)
      .eq('email', email)
      .eq('purpose', 'login')
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (otpFetchError) {
      return res.status(400).json({ status: 'error', message: otpFetchError.message });
    }

    const otpRow = otpRows?.[0];
    if (!otpRow) {
      return res.status(401).json({ status: 'error', message: 'OTP not found or already used' });
    }

    if (otpRow.expires_at && new Date(otpRow.expires_at).getTime() < Date.now()) {
      return res.status(401).json({ status: 'error', message: 'OTP expired' });
    }

    const maxAttempts = Number(otpRow.max_attempts || 5);
    const attempts = Number(otpRow.attempts || 0);
    if (attempts >= maxAttempts) {
      return res.status(429).json({ status: 'error', message: 'Too many attempts. Please request a new OTP.' });
    }

    const isValidOtp = await bcrypt.compare(String(otp), String(otpRow.otp_hash || ''));
    if (!isValidOtp) {
      await supabase
        .from('auth_email_otps')
        .update({ attempts: attempts + 1 })
        .eq('id', otpRow.id);
      return res.status(401).json({ status: 'error', message: 'Invalid OTP' });
    }

    await supabase
      .from('auth_email_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', otpRow.id);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const token = issueAccessToken({ userId: user.id, email: user.email, rememberMe: rememberMe === true });

    res.json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        companyName: user.company_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/auth/login/resend-otp', async (req, res) => {
  try {
    const { challengeToken } = req.body;

    if (!challengeToken) {
      return res.status(400).json({ status: 'error', message: 'challengeToken required' });
    }

    let decoded;
    try {
      decoded = verifyLoginChallengeToken(challengeToken);
    } catch (e) {
      return res.status(401).json({ status: 'error', message: 'Invalid or expired login challenge' });
    }

    const userId = decoded.userId;
    const email = normalizeEmail(decoded.email);

    const otpWindowSeconds = 60;
    const { data: lastOtp } = await supabase
      .from('auth_email_otps')
      .select('created_at')
      .eq('user_id', userId)
      .eq('purpose', 'login')
      .order('created_at', { ascending: false })
      .limit(1);

    const lastCreated = lastOtp?.[0]?.created_at ? new Date(lastOtp[0].created_at).getTime() : 0;
    if (lastCreated && Date.now() - lastCreated < otpWindowSeconds * 1000) {
      return res.status(429).json({
        status: 'error',
        message: `Please wait ${otpWindowSeconds} seconds before requesting another OTP.`
      });
    }

    await supabase
      .from('auth_email_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('purpose', 'login')
      .is('consumed_at', null);

    const otp = generateOtpCode();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const otpRow = {
      id: uuidv4(),
      user_id: userId,
      email,
      otp_hash: otpHash,
      purpose: 'login',
      attempts: 0,
      max_attempts: 5,
      expires_at: expiresAt.toISOString(),
      consumed_at: null,
      ip: req.ip,
      user_agent: req.headers['user-agent']
    };

    const { error: otpInsertError } = await supabase
      .from('auth_email_otps')
      .insert([otpRow]);

    if (otpInsertError) {
      return res.status(400).json({ status: 'error', message: otpInsertError.message });
    }

    const subject = 'SwiftPay Login OTP';
    const html = buildEmailHtml({
      title: 'SwiftPay Login Verification',
      lead: 'Use the OTP below to complete your login.',
      contentHtml: `
        <div style="margin:14px 0 6px;color:#e5e7eb">Your One-Time Password (OTP):</div>
        <div style="font-size:34px;letter-spacing:6px;font-weight:800;color:#fff;margin:10px 0 14px">${otp}</div>
        <div style="color:#94a3b8;font-size:13px">This code expires in <b>10 minutes</b>.</div>
      `,
      footerHtml: 'If you did not attempt to sign in, you can ignore this email.'
    });

    await sendEmail({ to: email, subject, html });

    res.json({
      status: 'success',
      message: 'OTP resent',
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get Current User
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (error) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({
      status: 'success',
      user: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        companyName: data.company_name,
        phone: data.phone,
        country: data.country
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== TILL ROUTES ====================

// Create Till
app.post('/api/tills', verifyToken, async (req, res) => {
  try {
    const { tillName, tillNumber, businessShortCode, description } = req.body;

    if (!tillName || !tillNumber) {
      return res.status(400).json({ status: 'error', message: 'Till name and number required' });
    }

    console.log('Creating till for user:', req.userId);
    console.log('Till data:', { tillName, tillNumber, businessShortCode, description });

    const { data, error } = await supabase
      .from('tills')
      .insert([
        {
          user_id: req.userId,
          till_name: tillName,
          till_number: tillNumber,
          business_short_code: businessShortCode || MPESA_BUSINESS_SHORT_CODE,
          description: description || ''
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error creating till:', error);
      return res.status(400).json({ status: 'error', message: error.message, details: error });
    }

    console.log('Till created successfully:', data[0]);

    res.json({
      status: 'success',
      message: 'Till created successfully',
      till: data[0]
    });
  } catch (error) {
    console.error('Error creating till:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get User's Tills (super_admin can see all, users see only their own)
app.get('/api/tills', verifyToken, async (req, res) => {
  try {
    let query = supabase.from('tills').select('*');

    if (req.userRole === ROLES.SUPER_ADMIN) {
      const { page = 1, limit = 20, search = '', status = 'all' } = req.query;
      const offset = (page - 1) * limit;

      if (search) {
        query = query.ilike('till_name', `%${search}%`);
      }

      if (status === 'active') {
        query = query.is('is_suspended', false);
      } else if (status === 'suspended') {
        query = query.is('is_suspended', true);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return res.status(400).json({ status: 'error', message: error.message });
      }

      res.json({
        status: 'success',
        tills: data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0
        }
      });
    } else {
      const { data, error } = await query.eq('user_id', req.userId);

      if (error) {
        return res.status(400).json({ status: 'error', message: error.message });
      }

      res.json({
        status: 'success',
        tills: data
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update Till (with object-level authorization)
app.put('/api/tills/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tillName, tillNumber, description } = req.body;

    const hasAccess = await authorizeTillAccess(req.userId, req.userRole, id);
    if (!hasAccess) {
      return res.status(403).json({ status: 'error', message: 'Access denied. You do not own this till.' });
    }

    const { data, error } = await supabase
      .from('tills')
      .update({
        till_name: tillName,
        till_number: tillNumber,
        description: description || ''
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Till not found' });
    }

    res.json({
      status: 'success',
      message: 'Till updated successfully',
      till: data[0]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Delete Till (with object-level authorization)
app.delete('/api/tills/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const hasAccess = await authorizeTillAccess(req.userId, req.userRole, id);
    if (!hasAccess) {
      return res.status(403).json({ status: 'error', message: 'Access denied. You do not own this till.' });
    }

    const { error } = await supabase
      .from('tills')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      message: 'Till deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== API KEY ROUTES ====================

// Public: Generate API Key (Self-Service - No Auth Required)
app.post('/api/keys/generate', async (req, res) => {
  try {
    const { projectName, tillId, email } = req.body;

    if (!projectName || !tillId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Project name and till ID are required' 
      });
    }

    // Validate till exists
    const { data: till, error: tillError } = await supabase
      .from('tills')
      .select('id')
      .eq('id', tillId)
      .single();

    if (tillError || !till) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Till ID not found. Please create a till first.' 
      });
    }

    // Generate API key with project name pattern
    const apiKey = `${projectName.toLowerCase()}-key`;
    const apiSecret = `secret_${uuidv4()}`;

    // Create a system user for this project if email provided
    const userId = email ? `user_${projectName.toLowerCase()}` : 'system-user';

    const { data, error } = await supabase
      .from('api_keys')
      .insert([
        {
          user_id: userId,
          till_id: tillId,
          key_name: projectName,
          api_key: apiKey,
          api_secret: apiSecret,
          is_active: true
        }
      ])
      .select();

    if (error) {
      console.error('API key creation error:', error);
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    res.json({
      status: 'success',
      message: 'API key generated successfully',
      data: {
        projectName,
        apiKey: apiKey,
        apiSecret: apiSecret,
        tillId: tillId,
        instructions: `Use this API key in your project's initiate-payment.js: const SWIFTPAY_API_KEY = '${apiKey}';`
      }
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Generate API Key (Authenticated)
app.post('/api/keys', verifyToken, async (req, res) => {
  try {
    const { keyName, tillId } = req.body;

    if (!keyName || !tillId) {
      return res.status(400).json({ status: 'error', message: 'Key name and till ID required' });
    }

    const hasAccess = await authorizeTillAccess(req.userId, req.userRole, tillId);
    if (!hasAccess) {
      return res.status(403).json({ status: 'error', message: 'Access denied. You do not own this till.' });
    }

    const apiKey = `sp_${uuidv4()}`;
    const apiSecret = `secret_${uuidv4()}`;

    const { data, error } = await supabase
      .from('api_keys')
      .insert([
        {
          user_id: req.userId,
          till_id: tillId,
          key_name: keyName,
          api_key: apiKey,
          api_secret: apiSecret
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      message: 'API key generated successfully',
      apiKey: data[0]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get API Keys (super_admin can see all, users see only their own)
app.get('/api/keys', verifyToken, async (req, res) => {
  try {
    let query = supabase.from('api_keys').select('*');

    if (req.userRole === ROLES.SUPER_ADMIN) {
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ status: 'error', message: error.message });
      }

      res.json({
        status: 'success',
        keys: data
      });
    } else {
      const { data, error } = await query.eq('user_id', req.userId);

      if (error) {
        return res.status(400).json({ status: 'error', message: error.message });
      }

      res.json({
        status: 'success',
        keys: data
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Delete API Key (with object-level authorization)
app.delete('/api/keys/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    let query = supabase.from('api_keys').delete();

    if (req.userRole === ROLES.SUPER_ADMIN) {
      query = query.eq('id', id);
    } else {
      query = query.eq('id', id).eq('user_id', req.userId);
    }

    const { error } = await query;

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      message: 'API key deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== PAYMENT LINKS ROUTES ====================

// Create Payment Link
app.post('/api/payment-links', verifyToken, async (req, res) => {
  try {
    const { title, amount, description, expiryDays, requireContact, requireEmail, customFields } = req.body;

    if (!title) {
      return res.status(400).json({ status: 'error', message: 'Title is required' });
    }

    // Generate unique link ID
    const linkId = uuidv4();
    const link = `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:8080'}/pay/${linkId}`;
    
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (parseInt(expiryDays) || 30));

    const { data, error } = await supabase
      .from('payment_links')
      .insert([
        {
          id: linkId,
          user_id: req.userId,
          title,
          amount: parseFloat(amount) || 0,
          description: description || '',
          link,
          expires_at: expiryDate.toISOString(),
          require_contact: requireContact || false,
          require_email: requireEmail || false,
          custom_fields: customFields || '',
          status: 'active',
          clicks: 0,
          conversions: 0,
          revenue: 0
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      message: 'Payment link created successfully',
      link: data[0]
    });
  } catch (error) {
    console.error('Create payment link error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get User's Payment Links (super_admin can see all, users see only their own)
app.get('/api/payment-links', verifyToken, async (req, res) => {
  try {
    let query = supabase.from('payment_links').select('*');

    if (req.userRole === ROLES.SUPER_ADMIN) {
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ status: 'error', message: error.message });
      }

      res.json({
        status: 'success',
        links: data
      });
    } else {
      const { data, error } = await query
        .eq('user_id', req.userId)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ status: 'error', message: error.message });
      }

      const now = new Date();
      const updatedLinks = (data || []).map(link => {
        const expiryDate = new Date(link.expires_at);
        if (expiryDate < now && link.status === 'active') {
          return { ...link, status: 'expired' };
        }
        return link;
      });

      res.json({
        status: 'success',
        links: updatedLinks
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Delete Payment Link (with object-level authorization)
app.delete('/api/payment-links/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    let query = supabase.from('payment_links').delete();

    if (req.userRole === ROLES.SUPER_ADMIN) {
      query = query.eq('id', id);
    } else {
      query = query.eq('id', id).eq('user_id', req.userId);
    }

    const { error } = await query;

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      message: 'Payment link deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Track Payment Link Click
app.post('/api/payment-links/:id/click', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('payment_links')
      .update({
        clicks: supabase.raw('clicks + 1')
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      link: data[0]
    });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get Payment Link by ID (Public)
app.get('/api/payment-links/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ status: 'error', message: 'Payment link not found' });
    }

    // Check if link is expired
    const now = new Date();
    const expiryDate = new Date(data.expires_at);
    if (expiryDate < now && data.status === 'active') {
      await supabase
        .from('payment_links')
        .update({ status: 'expired' })
        .eq('id', id);
      return res.json({ ...data, status: 'expired' });
    }

    res.json({
      status: 'success',
      link: data
    });
  } catch (error) {
    console.error('Get payment link error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== M-PESA INTEGRATION ROUTES ====================

// STK Push
app.post('/api/mpesa/stk-push', verifyToken, async (req, res) => {
  try {
    const { phone, amount, reference, description, tillId } = req.body;

    if (!phone || !amount || !tillId) {
      return res.status(400).json({ status: 'error', message: 'Phone, amount, and till ID required' });
    }

    // Get till details
    const { data: till } = await supabase
      .from('tills')
      .select('*')
      .eq('id', tillId)
      .eq('user_id', req.userId)
      .single();

    if (!till) {
      return res.status(404).json({ status: 'error', message: 'Till not found' });
    }

    const token = await getMpesaAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${MPESA_BUSINESS_SHORT_CODE}${MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const payload = {
      BusinessShortCode: MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: till.till_number,
      PhoneNumber: phone,
      CallBackURL: `${CALLBACK_URL}/api/callbacks/stk-push`,
      AccountReference: reference || 'SwiftPay',
      TransactionDesc: description || 'Payment via SwiftPay'
    };

    const response = await axios.post(STK_PUSH_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Log transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .insert([
        {
          till_id: tillId,
          phone_number: phone,
          amount,
          status: 'pending',
          transaction_type: 'stk_push',
          reference,
          description,
          mpesa_request_id: response.data.MerchantRequestID || response.data.MerchantRequestId || response.data.RequestId || response.data.RequestID,
          checkout_request_id: response.data.CheckoutRequestID || response.data.CheckoutRequestId,
          mpesa_response: response.data
        }
      ])
      .select();

    // Trigger payment.pending webhook
    triggerWebhook(req.userId, 'payment.pending', {
      transactionId: transaction?.[0]?.id,
      amount,
      phone,
      reference,
      description,
      status: 'pending',
      timestamp: new Date().toISOString()
    });

    res.json({
      status: 'success',
      message: 'STK Push sent successfully',
      data: response.data
    });
  } catch (error) {
    console.error('STK Push Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: error.response?.data?.errorMessage || error.message,
      data: error.response?.data
    });
  }
});

const processMpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body;
    console.log('M-Pesa Callback received:', callbackData);

    const stkCallback = callbackData?.Body?.stkCallback;
    const resultCode = stkCallback?.ResultCode;
    const merchantRequestId = stkCallback?.MerchantRequestID;
    const checkoutRequestId = stkCallback?.CheckoutRequestID;

    const result = stkCallback?.CallbackMetadata?.Item || [];
    const amount = result.find(item => item.Name === 'Amount')?.Value;
    const phone = result.find(item => item.Name === 'PhoneNumber')?.Value;
    const mpesaReceiptNumber = result.find(item => item.Name === 'MpesaReceiptNumber')?.Value;

    let lookupQuery = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkoutRequestId) {
      lookupQuery = lookupQuery.eq('checkout_request_id', checkoutRequestId);
    } else if (merchantRequestId) {
      lookupQuery = lookupQuery.eq('mpesa_request_id', merchantRequestId);
    } else {
      lookupQuery = lookupQuery.eq('phone_number', phone).eq('amount', amount).eq('status', 'pending');
    }

    const { data: existingTx } = await lookupQuery;
    const prior = existingTx?.[0];

    if (!prior?.id) {
      console.warn('M-Pesa callback: no matching transaction found', {
        phone,
        amount,
        resultCode,
        merchantRequestId,
        checkoutRequestId
      });
      return res.json({ status: 'success', message: 'Callback processed' });
    }

    const normalizedResultCode = resultCode === null || typeof resultCode === 'undefined'
      ? null
      : parseInt(String(resultCode), 10);

    if (normalizedResultCode === 0) {
      if (String(prior.status || '').toLowerCase() === 'success') {
        return res.json({ status: 'success', message: 'Callback processed' });
      }

      const { data: transaction, error } = await supabase
        .from('transactions')
        .update({
          status: 'success',
          mpesa_request_id: prior.mpesa_request_id || merchantRequestId || null,
          checkout_request_id: prior.checkout_request_id || checkoutRequestId || null,
          callback_data: callbackData,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', prior.id)
        .select();

      if (error) {
        console.error('Callback update error:', error);
      }

      if (transaction && transaction.length > 0) {
        const txn = transaction[0];

        const { data: till } = await supabase
          .from('tills')
          .select('user_id')
          .eq('id', txn.till_id)
          .single();

        if (till) {
          triggerWebhook(till.user_id, 'payment.success', {
            transactionId: txn.id,
            amount,
            phone,
            mpesaReceiptNumber,
            status: 'success',
            timestamp: new Date().toISOString()
          });

          await sendPaymentNotificationEmails({
            userId: till.user_id,
            event: 'payment.success',
            transaction: {
              transactionId: txn.id,
              amount,
              phone,
              mpesaReceiptNumber,
              reference: txn.reference,
              description: txn.description,
              till_id: txn.till_id,
              mpesa_request_id: txn.mpesa_request_id,
              checkout_request_id: txn.checkout_request_id,
              status: 'success',
              timestamp: new Date().toISOString()
            }
          }).catch((err) => {
            console.error('Failed to send payment notification emails:', err?.message || err);
          });
        }
      }
    } else {
      if (String(prior.status || '').toLowerCase() === 'failed') {
        return res.json({ status: 'success', message: 'Callback processed' });
      }

      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          mpesa_request_id: prior.mpesa_request_id || merchantRequestId || null,
          checkout_request_id: prior.checkout_request_id || checkoutRequestId || null,
          callback_data: callbackData,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', prior.id);
    }

    res.json({ status: 'success', message: 'Callback processed' });
  } catch (error) {
    console.error('Callback Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

app.post('/api/mpesa/callback', processMpesaCallback);
app.post('/api/callbacks/stk-push', processMpesaCallback);

// STK Push (API Key Authentication - for third-party integrations)
app.post('/api/mpesa/stk-push-api', verifyApiKey, async (req, res) => {
  try {
    const { phone_number, amount, till_id, reference, description } = req.body;

    if (!phone_number || !amount) {
      return res.status(400).json({ status: 'error', message: 'Phone number and amount required' });
    }

    // Use till_id from request body or from API key
    let tillId = till_id || req.tillId;

    if (!tillId) {
      return res.status(400).json({ status: 'error', message: 'Till ID required' });
    }

    // Get till details
    let { data: till } = await supabase
      .from('tills')
      .select('*')
      .eq('id', tillId)
      .single();

    // If till doesn't exist, create a default one
    if (!till) {
      console.log(`Till ${tillId} not found, creating default till`);
      const { data: newTill, error: createError } = await supabase
        .from('tills')
        .insert([
          {
            id: tillId,
            user_id: req.userId,
            till_name: `Till ${tillId}`,
            till_number: MPESA_BUSINESS_SHORT_CODE,
            description: 'Auto-created till for API integration'
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating till:', createError);
        return res.status(500).json({ status: 'error', message: 'Failed to create till' });
      }

      till = newTill;
      console.log('Till created successfully:', till);
    }

    const token = await getMpesaAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${MPESA_BUSINESS_SHORT_CODE}${MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const payload = {
      BusinessShortCode: MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: amount,
      PartyA: phone_number,
      PartyB: till.till_number,
      PhoneNumber: phone_number,
      CallBackURL: `${CALLBACK_URL}/api/callbacks/stk-push`,
      AccountReference: reference || 'SwiftPay',
      TransactionDesc: description || 'Payment via SwiftPay'
    };

    console.log('STK Push API request:', { phone_number, amount, tillId });

    const response = await axios.post(STK_PUSH_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Log transaction
    await supabase
      .from('transactions')
      .insert([
        {
          till_id: tillId,
          phone_number: phone_number,
          amount,
          status: 'pending',
          transaction_type: 'stk_push',
          reference,
          description,
          mpesa_request_id: response.data.MerchantRequestID, // Store MerchantRequestID, not RequestId
          checkout_request_id: response.data.CheckoutRequestID,
          mpesa_response: response.data
        }
      ]);

    console.log('STK Push API success:', response.data);
    console.log(`Transaction created with MerchantRequestID: ${response.data.MerchantRequestID}, CheckoutRequestID: ${response.data.CheckoutRequestID}`);
    
    // Log the actual structure to debug
    console.log('Full STK Push response structure:', JSON.stringify(response.data, null, 2));

    res.json({
      success: true,
      message: 'STK Push sent successfully',
      data: {
        request_id: response.data.RequestId,
        checkout_id: response.data.CheckoutRequestID,
        phone: phone_number,
        amount: amount,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('STK Push API Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.errorMessage || error.message,
      code: 'MPESA_ERROR'
    });
  }
});

// Account Balance
app.get('/api/mpesa/balance', verifyToken, async (req, res) => {
  try {
    const token = await getMpesaAccessToken();

    const payload = {
      CommandID: 'GetAccount',
      PartyA: MPESA_BUSINESS_SHORT_CODE,
      IdentifierType: '4',
      Remarks: 'Balance Check',
      QueueTimeOutURL: `${CALLBACK_URL}/timeout.php`,
      ResultURL: `${CALLBACK_URL}/result.php`
    };

    const response = await axios.post(ACCOUNT_BALANCE_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      status: 'success',
      message: 'Balance check initiated',
      data: response.data
    });
  } catch (error) {
    console.error('Balance Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: error.response?.data?.errorMessage || error.message
    });
  }
});

// Transaction Status
app.post('/api/mpesa/status', verifyToken, async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ status: 'error', message: 'Transaction ID required' });
    }

    const token = await getMpesaAccessToken();

    const payload = {
      CommandID: 'CheckTransactionStatus',
      PartyA: MPESA_BUSINESS_SHORT_CODE,
      IdentifierType: '4',
      TransactionID: transactionId,
      Remarks: 'Status Check',
      QueueTimeOutURL: `${CALLBACK_URL}/timeout.php`,
      ResultURL: `${CALLBACK_URL}/result.php`
    };

    const response = await axios.post(TRANSACTION_STATUS_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      status: 'success',
      message: 'Status check initiated',
      data: response.data
    });
  } catch (error) {
    console.error('Status Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: error.response?.data?.errorMessage || error.message
    });
  }
});

// ==================== TRANSACTION ROUTES ====================

// Get Transactions (with object-level authorization)
app.get('/api/transactions', verifyToken, async (req, res) => {
  try {
    const tillId = typeof req.query.tillId === 'string' ? req.query.tillId : undefined;

    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (req.userRole === ROLES.SUPER_ADMIN) {
      if (tillId) {
        query = query.eq('till_id', tillId);
      }
    } else {
      const { data: tills, error: tillsError } = await supabase
        .from('tills')
        .select('id')
        .eq('user_id', req.userId);

      if (tillsError) {
        return res.status(400).json({ status: 'error', message: tillsError.message });
      }

      const tillIds = (tills || []).map(t => t.id);

      if (tillId) {
        if (tillIds.length > 0 && !tillIds.includes(tillId)) {
          return res.status(403).json({ status: 'error', message: 'Access denied for this till' });
        }
        query = query.eq('till_id', tillId);
      } else if (tillIds.length > 0) {
        query = query.in('till_id', tillIds);
      } else {
        query = query.limit(0);
      }
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      transactions: data
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update Transaction Status (Called by M-Pesa callback)
app.post('/api/transactions/update-status', async (req, res) => {
  try {
    const {
      mpesa_request_id,
      checkout_request_id,
      checkout_id,
      checkoutId,
      status,
      callback_data,
      result_code
    } = req.body;

    const normalizedCheckoutId = checkout_request_id || checkout_id || checkoutId || null;

    if (!mpesa_request_id && !normalizedCheckoutId) {
      return res.status(400).json({ status: 'error', message: 'Request ID or Checkout ID required' });
    }

    // Determine transaction status based on result code
    let transactionStatus = 'pending';
    const normalizedStatus = String(status || '').toLowerCase();
    const normalizedResultCode = result_code === null || typeof result_code === 'undefined' ? null : String(result_code);
    if (normalizedResultCode === '0' || normalizedStatus === 'success') {
      transactionStatus = 'success';
    } else if (normalizedResultCode && normalizedResultCode !== '0') {
      transactionStatus = 'failed';
    }

    const lookupLatestBy = async (column, value) => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq(column, value)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn(`Lookup failed for column ${column}`, error);
        return null;
      }
      return data?.[0] || null;
    };

    let prior = null;

    if (mpesa_request_id) {
      prior = await lookupLatestBy('mpesa_request_id', mpesa_request_id);
    }

    if (!prior && normalizedCheckoutId) {
      prior = await lookupLatestBy('checkout_request_id', normalizedCheckoutId);
    }

    // Backwards/legacy support: some clients store/use checkout_id
    if (!prior && normalizedCheckoutId) {
      prior = await lookupLatestBy('checkout_id', normalizedCheckoutId);
    }

    if (!prior?.id) {
      console.warn(`No transaction found with mpesa_request_id: ${mpesa_request_id}, checkout_request_id: ${normalizedCheckoutId}`);
      return res.status(404).json({ status: 'error', message: 'Transaction not found' });
    }

    const priorStatus = String(prior.status || '').toLowerCase();
    const nextStatus = String(transactionStatus || '').toLowerCase();

    if (priorStatus === nextStatus) {
      return res.json({
        status: 'success',
        message: `Transaction status already ${transactionStatus}`,
        transaction: prior
      });
    }

    // Update transaction by mpesa_request_id
    let updateQuery = supabase
      .from('transactions')
      .update({
        status: transactionStatus,
        mpesa_request_id: prior.mpesa_request_id || mpesa_request_id || null,
        checkout_request_id: prior.checkout_request_id || normalizedCheckoutId || null,
        callback_data: callback_data || null,
        completed_at: transactionStatus !== 'pending' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', prior.id);

    const { data, error } = await updateQuery.select();

    if (error) {
      console.error('Transaction update error:', error);
      return res.status(400).json({ status: 'error', message: error.message });
    }

    if (!data || data.length === 0) {
      console.warn(`No transaction found with mpesa_request_id: ${mpesa_request_id}, checkout_request_id: ${checkout_request_id}`);
      return res.status(404).json({ status: 'error', message: 'Transaction not found' });
    }

    console.log(`Transaction ${mpesa_request_id || checkout_request_id} updated to status: ${transactionStatus}`, data[0]);

    if (transactionStatus === 'success') {
      const { data: till } = await supabase
        .from('tills')
        .select('user_id')
        .eq('id', data[0].till_id)
        .single();

      if (till?.user_id) {
        const mpesaReceiptNumber =
          data?.[0]?.callback_data?.Body?.stkCallback?.CallbackMetadata?.Item?.find?.((i) => i?.Name === 'MpesaReceiptNumber')?.Value ||
          data?.[0]?.callback_data?.MpesaReceiptNumber ||
          null;

        sendPaymentNotificationEmails({
          userId: till.user_id,
          event: 'payment.success',
          transaction: {
            transactionId: data[0].id,
            amount: data[0].amount,
            phone: data[0].phone_number,
            mpesaReceiptNumber,
            reference: data[0].reference,
            description: data[0].description,
            till_id: data[0].till_id,
            mpesa_request_id: data[0].mpesa_request_id,
            checkout_request_id: data[0].checkout_request_id,
            status: 'success',
            timestamp: new Date().toISOString()
          }
        }).catch((err) => {
          console.error('Failed to send payment notification emails:', err?.message || err);
        });
      }
    }

    if (res.headersSent) return;
    res.json({
      status: 'success',
      message: `Transaction status updated to ${transactionStatus}`,
      transaction: data[0]
    });
  } catch (error) {
    console.error('Status update error:', error);
    if (res.headersSent) return;
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Test endpoint: Mark all pending transactions as success (for testing only)
app.post('/api/transactions/test-mark-success', verifyToken, async (req, res) => {
  try {
    const { data: tills } = await supabase
      .from('tills')
      .select('id')
      .eq('user_id', req.userId);

    const tillIds = tills.map(t => t.id);

    const { data, error } = await supabase
      .from('transactions')
      .update({ status: 'success', completed_at: new Date().toISOString() })
      .in('till_id', tillIds)
      .eq('status', 'pending')
      .select();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    console.log(`Marked ${data.length} transactions as success`);

    res.json({
      status: 'success',
      message: `Marked ${data.length} transactions as success`,
      updatedCount: data.length
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get Advanced Dashboard Analytics
app.get('/api/dashboard/analytics', verifyToken, async (req, res) => {
  try {
    const { range, tillId } = req.query; // Get time range from query params
    const requestedTillId = tillId ? String(tillId) : null;
    const isPaidStatus = (status) => {
      const s = String(status || '').toLowerCase();
      return s === 'success' || s === 'paid' || s === 'completed';
    };
    const getEffectiveTxDate = (tx) => {
      const ts = isPaidStatus(tx?.status) && tx?.completed_at ? tx.completed_at : tx?.created_at;
      return new Date(ts);
    };
    const transactions = await fetchTransactionsForUserAnalytics({
      userId: req.userId,
      requestedTillId
    });

    console.log(`Analytics: Found ${transactions?.length || 0} transactions for user ${req.userId}`);

    // Analytics Calculations
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

    const filterByWindow = (tx, startDate, endDate) => {
      const txDate = getEffectiveTxDate(tx);
      return txDate >= startDate && txDate < endDate;
    };

    const rangeKey = String(range || 'week').toLowerCase();
    let selectedStart = weekStart;
    let selectedEnd = weekEnd;
    if (rangeKey === 'today') {
      selectedStart = todayStart;
      selectedEnd = todayEnd;
    } else if (rangeKey === 'month') {
      selectedStart = monthStart;
      selectedEnd = monthEnd;
    } else if (rangeKey === 'year') {
      selectedStart = yearStart;
      selectedEnd = yearEnd;
    }

    const todayTransactions = transactions.filter(tx => filterByWindow(tx, todayStart, todayEnd));
    const weekTransactions = transactions.filter(tx => filterByWindow(tx, weekStart, weekEnd));
    const monthTransactions = transactions.filter(tx => filterByWindow(tx, monthStart, monthEnd));
    const yearTransactions = transactions.filter(tx => filterByWindow(tx, yearStart, yearEnd));

    const calculateStats = (txs) => {
      const successful = txs.filter(t => isPaidStatus(t.status));
      const pending = txs.filter(t => String(t.status || '').toLowerCase() === 'pending');
      const failed = txs.filter(t => String(t.status || '').toLowerCase() === 'failed');

      const totalRevenue = successful.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const totalTransactions = txs.length;
      const successRate = totalTransactions > 0 ? (successful.length / totalTransactions) * 100 : 0;

      return {
        totalRevenue,
        totalTransactions,
        successfulTransactions: successful.length,
        pendingTransactions: pending.length,
        failedTransactions: failed.length,
        successRate: successRate.toFixed(1) + '%',
        averageTransactionValue: successful.length > 0 ? (totalRevenue / successful.length).toFixed(2) : 0,
      };
    };

    // Calculate revenue over time (last 7 days)
    const revenueOverTime = [];
    if (rangeKey === 'today') {
      for (let h = 0; h < 24; h++) {
        const bucketStart = new Date(selectedStart);
        bucketStart.setHours(h, 0, 0, 0);
        const bucketEnd = new Date(selectedStart);
        bucketEnd.setHours(h + 1, 0, 0, 0);

        const bucketTx = transactions.filter(tx => filterByWindow(tx, bucketStart, bucketEnd));
        const bucketRevenue = bucketTx
          .filter(t => isPaidStatus(t.status))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        revenueOverTime.push({
          date: `${String(h).padStart(2, '0')}:00`,
          revenue: bucketRevenue,
          transactions: bucketTx.length,
          successful: bucketTx.filter(t => isPaidStatus(t.status)).length
        });
      }
    } else if (rangeKey === 'month') {
      for (let d = new Date(selectedStart); d < selectedEnd; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        const dayTransactions = transactions.filter(tx => filterByWindow(tx, dayStart, dayEnd));

        const dayRevenue = dayTransactions
          .filter(t => isPaidStatus(t.status))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        revenueOverTime.push({
          date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue,
          transactions: dayTransactions.length,
          successful: dayTransactions.filter(t => isPaidStatus(t.status)).length
        });
      }
    } else if (rangeKey === 'year') {
      for (let m = 0; m < 12; m++) {
        const monthBucketStart = new Date(now.getFullYear(), m, 1);
        const monthBucketEnd = new Date(now.getFullYear(), m + 1, 1);
        const monthTransactions = transactions.filter(tx => filterByWindow(tx, monthBucketStart, monthBucketEnd));

        const monthRevenue = monthTransactions
          .filter(t => isPaidStatus(t.status))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        revenueOverTime.push({
          date: monthBucketStart.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthRevenue,
          transactions: monthTransactions.length,
          successful: monthTransactions.filter(t => isPaidStatus(t.status)).length
        });
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        const dayTransactions = transactions.filter(tx => {
          const txDate = getEffectiveTxDate(tx);
          return txDate >= dayStart && txDate < dayEnd;
        });

        const dayRevenue = dayTransactions
          .filter(t => isPaidStatus(t.status))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        revenueOverTime.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue,
          transactions: dayTransactions.length,
          successful: dayTransactions.filter(t => isPaidStatus(t.status)).length
        });
      }
    }

    // Calculate peak hours
    const peakHours = {};
    transactions.forEach(tx => {
      const hour = getEffectiveTxDate(tx).getHours();
      if (!peakHours[hour]) {
        peakHours[hour] = { count: 0, revenue: 0, success: 0 };
      }
      peakHours[hour].count++;
      // Count revenue from paid transactions only
      if (isPaidStatus(tx.status)) {
        peakHours[hour].revenue += Number(tx.amount || 0);
        peakHours[hour].success++;
      }
    });

    // Calculate status distribution with amounts
    const statusDistribution = {
      success: {
        count: transactions.filter(t => isPaidStatus(t.status)).length,
        amount: transactions.filter(t => isPaidStatus(t.status)).reduce((sum, t) => sum + Number(t.amount || 0), 0)
      },
      failed: {
        count: transactions.filter(t => String(t.status || '').toLowerCase() === 'failed').length,
        amount: transactions.filter(t => String(t.status || '').toLowerCase() === 'failed').reduce((sum, t) => sum + Number(t.amount || 0), 0)
      },
      pending: {
        count: transactions.filter(t => String(t.status || '').toLowerCase() === 'pending').length,
        amount: transactions.filter(t => String(t.status || '').toLowerCase() === 'pending').reduce((sum, t) => sum + Number(t.amount || 0), 0)
      }
    };

    // Calculate unique amounts and other advanced metrics
    const uniqueAmounts = [...new Set(transactions.map(t => t.amount || 0))].sort((a, b) => b - a);
    const mostCommonAmounts = {};
    transactions.forEach(tx => {
      const amount = tx.amount || 0;
      mostCommonAmounts[amount] = (mostCommonAmounts[amount] || 0) + 1;
    });
    
    const topAmounts = Object.entries(mostCommonAmounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([amount, count]) => ({ amount: parseFloat(amount), count }));

    const rangeTransactions = transactions.filter(tx => filterByWindow(tx, selectedStart, selectedEnd));
    const amountSummaryMap = {};
    const normalizeStatus = (s) => String(s || '').toLowerCase();

    rangeTransactions.forEach(tx => {
      const amount = Number(tx.amount || 0);
      const key = String(amount);
      if (!amountSummaryMap[key]) {
        amountSummaryMap[key] = {
          amount,
          totalCount: 0,
          paidCount: 0,
          failedCount: 0,
          pendingCount: 0,
          paidRevenue: 0
        };
      }

      amountSummaryMap[key].totalCount++;
      const st = normalizeStatus(tx.status);
      if (isPaidStatus(st)) {
        amountSummaryMap[key].paidCount++;
        amountSummaryMap[key].paidRevenue += amount;
      } else if (st === 'failed') {
        amountSummaryMap[key].failedCount++;
      } else if (st === 'pending') {
        amountSummaryMap[key].pendingCount++;
      }
    });

    const totalRangeTx = rangeTransactions.length || 1;
    const totalRangePaidRevenue = rangeTransactions
      .filter(t => isPaidStatus(t.status))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0) || 1;

    const amountSummary = Object.values(amountSummaryMap)
      .map(a => ({
        ...a,
        shareOfTransactions: a.totalCount / totalRangeTx,
        shareOfPaidRevenue: a.paidRevenue / totalRangePaidRevenue,
        failureRate: a.totalCount > 0 ? a.failedCount / a.totalCount : 0
      }))
      .sort((a, b) => b.totalCount - a.totalCount)
      ;

    const pad2 = (n) => String(n).padStart(2, '0');
    const toDateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const weekNumber = (d) => {
      const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const yearStartLocal = new Date(date.getFullYear(), 0, 1);
      const diffDays = Math.floor((date - yearStartLocal) / (24 * 60 * 60 * 1000));
      return Math.floor((diffDays + yearStartLocal.getDay()) / 7) + 1;
    };

    const dailyMap = {};
    const weeklyMap = {};
    const monthlyMap = {};

    rangeTransactions.forEach(tx => {
      const created = new Date(tx.created_at);
      const amount = Number(tx.amount || 0);
      const amountKey = String(amount);
      const st = normalizeStatus(tx.status);
      const dayKey = toDateKey(created);
      const weekKey = `${created.getFullYear()}-W${pad2(weekNumber(created))}`;
      const monthKey = `${created.getFullYear()}-${pad2(created.getMonth() + 1)}`;

      const dailyKey = `${dayKey}|${amountKey}`;
      if (!dailyMap[dailyKey]) {
        dailyMap[dailyKey] = { date: dayKey, amount, count: 0, paidCount: 0, failedCount: 0, pendingCount: 0, paidRevenue: 0 };
      }
      dailyMap[dailyKey].count++;
      if (isPaidStatus(st)) {
        dailyMap[dailyKey].paidCount++;
        dailyMap[dailyKey].paidRevenue += amount;
      } else if (st === 'failed') {
        dailyMap[dailyKey].failedCount++;
      } else if (st === 'pending') {
        dailyMap[dailyKey].pendingCount++;
      }

      const weeklyKey = `${weekKey}|${amountKey}`;
      if (!weeklyMap[weeklyKey]) {
        weeklyMap[weeklyKey] = { week: weekKey, amount, count: 0, paidCount: 0, failedCount: 0, pendingCount: 0, paidRevenue: 0 };
      }
      weeklyMap[weeklyKey].count++;
      if (isPaidStatus(st)) {
        weeklyMap[weeklyKey].paidCount++;
        weeklyMap[weeklyKey].paidRevenue += amount;
      } else if (st === 'failed') {
        weeklyMap[weeklyKey].failedCount++;
      } else if (st === 'pending') {
        weeklyMap[weeklyKey].pendingCount++;
      }

      const monthlyKey = `${monthKey}|${amountKey}`;
      if (!monthlyMap[monthlyKey]) {
        monthlyMap[monthlyKey] = { month: monthKey, amount, count: 0, paidCount: 0, failedCount: 0, pendingCount: 0, paidRevenue: 0 };
      }
      monthlyMap[monthlyKey].count++;
      if (isPaidStatus(st)) {
        monthlyMap[monthlyKey].paidCount++;
        monthlyMap[monthlyKey].paidRevenue += amount;
      } else if (st === 'failed') {
        monthlyMap[monthlyKey].failedCount++;
      } else if (st === 'pending') {
        monthlyMap[monthlyKey].pendingCount++;
      }
    });

    const amountDailyTotals = Object.values(dailyMap)
      .sort((a, b) => (a.date === b.date ? a.amount - b.amount : a.date.localeCompare(b.date)));
    const amountWeeklyTotals = Object.values(weeklyMap)
      .sort((a, b) => (a.week === b.week ? a.amount - b.amount : a.week.localeCompare(b.week)));
    const amountMonthlyTotals = Object.values(monthlyMap)
      .sort((a, b) => (a.month === b.month ? a.amount - b.amount : a.month.localeCompare(b.month)));

    const amountPerformance = amountSummary.map(a => ({
      ...a,
      successRate: a.totalCount > 0 ? a.paidCount / a.totalCount : 0,
      avgPaidValue: a.paidCount > 0 ? a.paidRevenue / a.paidCount : 0
    }));

    const minAmountTxCount = 10;
    const topAmountsByPaidRevenue = [...amountPerformance]
      .sort((a, b) => b.paidRevenue - a.paidRevenue)
      ;
    const topAmountsBySuccessRate = [...amountPerformance]
      .filter(a => a.totalCount >= minAmountTxCount)
      .sort((a, b) => b.successRate - a.successRate);
    const topFailedAmounts = [...amountPerformance]
      .sort((a, b) => b.failedCount - a.failedCount);

    const topAmountSet = new Set(amountSummary.slice(0, 25).map(a => String(a.amount)));
    const peakHoursByAmount = {};
    rangeTransactions.forEach(tx => {
      const amount = Number(tx.amount || 0);
      const amountKey = String(amount);
      if (!topAmountSet.has(amountKey)) return;
      const hour = new Date(tx.created_at).getHours();
      const st = normalizeStatus(tx.status);
      if (!peakHoursByAmount[amountKey]) peakHoursByAmount[amountKey] = {};
      if (!peakHoursByAmount[amountKey][hour]) {
        peakHoursByAmount[amountKey][hour] = { count: 0, paidCount: 0, failedCount: 0, pendingCount: 0, paidRevenue: 0 };
      }
      peakHoursByAmount[amountKey][hour].count++;
      if (isPaidStatus(st)) {
        peakHoursByAmount[amountKey][hour].paidCount++;
        peakHoursByAmount[amountKey][hour].paidRevenue += amount;
      } else if (st === 'failed') {
        peakHoursByAmount[amountKey][hour].failedCount++;
      } else if (st === 'pending') {
        peakHoursByAmount[amountKey][hour].pendingCount++;
      }
    });

    // Calculate average processing time
    const completedTransactions = transactions.filter(t => isPaidStatus(t.status) && t.completed_at);
    const avgProcessingTime = completedTransactions.length > 0 
      ? completedTransactions.reduce((sum, t) => {
          const created = new Date(t.created_at);
          const completed = new Date(t.completed_at);
          return sum + (completed - created);
        }, 0) / completedTransactions.length / 1000 / 60 // Convert to minutes
      : 0;

    // AI-Powered Insights and Anomaly Detection
    const insights = [];
    
    // Detect unusual transaction patterns
    const hourlyAvg = Object.values(peakHours).reduce((sum, hour) => sum + hour.count, 0) / Object.keys(peakHours).length;
    const peakHoursData = Object.entries(peakHours)
      .filter(([hour, data]) => data.count > hourlyAvg * 1.5)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        count: data.count,
        revenue: data.revenue
      }));
    
    if (peakHoursData.length > 0) {
      insights.push({
        type: 'anomaly',
        title: 'Unusual Activity Detected',
        description: `Peak activity detected at ${peakHoursData.map(h => h.hour + ':00').join(', ')} with ${Math.round((peakHoursData[0].count / hourlyAvg - 1) * 100)}% higher transaction volume`,
        severity: 'warning',
        action: 'Monitor for potential system load issues'
      });
    }

    // Revenue trend analysis
    const recentRevenue = revenueOverTime.slice(-3).reduce((sum, day) => sum + day.revenue, 0);
    const previousRevenue = revenueOverTime.slice(-6, -3).reduce((sum, day) => sum + day.revenue, 0);
    const revenueChange = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    
    if (revenueChange > 20) {
      insights.push({
        type: 'positive',
        title: 'Revenue Surge',
        description: `Revenue increased by ${revenueChange.toFixed(1)}% in the last 3 days`,
        severity: 'success',
        action: 'Consider scaling operations to meet demand'
      });
    } else if (revenueChange < -15) {
      insights.push({
        type: 'negative',
        title: 'Revenue Decline',
        description: `Revenue decreased by ${Math.abs(revenueChange).toFixed(1)}% in the last 3 days`,
        severity: 'error',
        action: 'Investigate potential issues affecting transactions'
      });
    }

    // Success rate anomalies
    const recentSuccessRate = (revenueOverTime.slice(-3).reduce((sum, day) => sum + day.successful, 0) / 
                               revenueOverTime.slice(-3).reduce((sum, day) => sum + day.transactions, 0)) * 100;
    const overallSuccessRate = (statusDistribution.success.count / transactions.length) * 100;
    
    if (recentSuccessRate < overallSuccessRate - 10) {
      insights.push({
        type: 'anomaly',
        title: 'Success Rate Drop',
        description: `Recent success rate (${recentSuccessRate.toFixed(1)}%) is below average (${overallSuccessRate.toFixed(1)}%)`,
        severity: 'warning',
        action: 'Check for technical issues or payment gateway problems'
      });
    }

    // Predictive Analytics - Simple forecasting
    const forecastData = [];
    const avgDailyRevenue = revenueOverTime.reduce((sum, day) => sum + day.revenue, 0) / revenueOverTime.length;
    const trend = revenueOverTime.length > 1 ? 
      (revenueOverTime[revenueOverTime.length - 1].revenue - revenueOverTime[0].revenue) / revenueOverTime.length : 0;
    
    for (let i = 1; i <= 7; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      const dayOfWeek = forecastDate.getDay();
      
      // Adjust for weekend patterns
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.1;
      const forecastRevenue = Math.max(0, avgDailyRevenue + (trend * i)) * weekendMultiplier;
      
      forecastData.push({
        date: forecastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        forecast: Math.round(forecastRevenue),
        confidence: Math.max(60, 95 - (i * 5)) // Decreasing confidence over time
      });
    }

    // Customer segmentation analysis
    const customerSegments = {
      highValue: { count: 0, revenue: 0 }, // > KES 10,000
      mediumValue: { count: 0, revenue: 0 }, // KES 1,000 - 10,000
      lowValue: { count: 0, revenue: 0 } // < KES 1,000
    };
    
    // Group by customer phone (simplified segmentation)
    const customerData = {};
    transactions.filter(t => isPaidStatus(t.status) && t.phone_number).forEach(tx => {
      if (!customerData[tx.phone_number]) {
        customerData[tx.phone_number] = { count: 0, totalAmount: 0 };
      }
      customerData[tx.phone_number].count++;
      customerData[tx.phone_number].totalAmount += Number(tx.amount || 0);
    });
    
    Object.values(customerData).forEach(customer => {
      if (customer.totalAmount > 10000) {
        customerSegments.highValue.count++;
        customerSegments.highValue.revenue += customer.totalAmount;
      } else if (customer.totalAmount >= 1000) {
        customerSegments.mediumValue.count++;
        customerSegments.mediumValue.revenue += customer.totalAmount;
      } else {
        customerSegments.lowValue.count++;
        customerSegments.lowValue.revenue += customer.totalAmount;
      }
    });

    // Fraud detection patterns
    const fraudAlerts = [];
    const recentTransactions = transactions.filter(t => {
      const txDate = new Date(t.created_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return txDate > oneHourAgo;
    });
    
    // Check for rapid successive transactions from same phone
    const phoneTransactions = {};
    recentTransactions.forEach(tx => {
      if (tx.phone_number) {
        if (!phoneTransactions[tx.phone_number]) phoneTransactions[tx.phone_number] = [];
        phoneTransactions[tx.phone_number].push(tx);
      }
    });
    
    Object.entries(phoneTransactions).forEach(([phone, txs]) => {
      if (txs.length > 10) { // More than 10 transactions in 1 hour
        fraudAlerts.push({
          type: 'suspicious_activity',
          phone,
          count: txs.length,
          totalAmount: txs.reduce((sum, tx) => sum + (tx.amount || 0), 0),
          severity: 'high'
        });
      }
    });

    const analytics = {
      today: calculateStats(todayTransactions),
      thisWeek: calculateStats(weekTransactions),
      thisMonth: calculateStats(monthTransactions),
      thisYear: calculateStats(yearTransactions),
      allTime: calculateStats(transactions),
      revenueOverTime,
      peakHours,
      statusDistribution,
      amountAnalytics: {
        range: rangeKey,
        amountSummary,
        topAmountsByPaidRevenue,
        topAmountsBySuccessRate,
        topFailedAmounts,
        amountDailyTotals,
        amountWeeklyTotals,
        amountMonthlyTotals,
        peakHoursByAmount
      },
      advancedMetrics: {
        uniqueAmounts: uniqueAmounts.length,
        topAmounts,
        avgProcessingTime: avgProcessingTime.toFixed(1),
        totalVolume: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        totalPaidVolume: transactions.filter(t => isPaidStatus(t.status)).reduce((sum, t) => sum + (t.amount || 0), 0),
        conversionRate: transactions.length > 0 
          ? ((statusDistribution.success.count / transactions.length) * 100).toFixed(1) + '%'
          : '0%'
      },
      aiInsights: {
        insights,
        forecast: forecastData,
        customerSegments,
        fraudAlerts,
        anomalyScore: insights.filter(i => i.type === 'anomaly').length > 0 ? 'high' : 'low'
      }
    };

    res.json({ status: 'success', analytics });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/dashboard/stats', verifyToken, async (req, res) => {
  try {
    const isPaidStatus = (status) => {
      const s = String(status || '').toLowerCase();
      return s === 'success' || s === 'paid' || s === 'completed';
    };

    const { data: tills, error: tillsError } = await supabase
      .from('tills')
      .select('id')
      .eq('user_id', req.userId);

    if (tillsError) {
      return res.status(400).json({ status: 'error', message: tillsError.message });
    }

    const tillIds = (tills || []).map(t => t.id);

    let allTransactions = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;
    
    if (tillIds.length > 0) {
      // User has tills, get all transactions for those tills with pagination
      while (hasMore) {
        const result = await supabase
          .from('transactions')
          .select('*')
          .in('till_id', tillIds)
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('created_at', { ascending: false });
        
        if (result.error) {
          return res.status(400).json({ status: 'error', message: result.error.message });
        }
        
        if (result.data && result.data.length > 0) {
          allTransactions = allTransactions.concat(result.data);
          page++;
          hasMore = result.data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
    } else {
      // User has no tills, get all transactions (for admin/testing) with pagination
      while (hasMore) {
        const result = await supabase
          .from('transactions')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('created_at', { ascending: false });
        
        if (result.error) {
          return res.status(400).json({ status: 'error', message: result.error.message });
        }
        
        if (result.data && result.data.length > 0) {
          allTransactions = allTransactions.concat(result.data);
          page++;
          hasMore = result.data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
    }

    const txs = allTransactions;
    const successfulTransactions = txs.filter(t => isPaidStatus(t.status));

    const stats = {
      totalTransactions: txs.length,
      totalAmount: successfulTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      successfulTransactions: successfulTransactions.length,
      failedTransactions: txs.filter(t => String(t.status || '').toLowerCase() === 'failed').length,
      pendingTransactions: txs.filter(t => String(t.status || '').toLowerCase() === 'pending').length
    };

    res.json({ status: 'success', stats });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== WEBHOOK HELPER FUNCTION ====================

const triggerWebhook = async (userId, event, eventData) => {
  try {
    // Get all active webhooks for this user that are subscribed to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error || !webhooks) {
      console.log('No webhooks found for user:', userId);
      return;
    }

    // Filter webhooks that are subscribed to this event
    const subscribedWebhooks = webhooks.filter(w => 
      w.events && w.events.includes(event)
    );

    console.log(`Triggering ${subscribedWebhooks.length} webhooks for event: ${event}`);

    // Send webhook to each subscribed endpoint
    for (const webhook of subscribedWebhooks) {
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data: eventData
      };

      // Send webhook asynchronously (don't wait for response)
      axios.post(webhook.url, payload, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      })
        .then(response => {
          console.log(`Webhook delivered successfully to ${webhook.url}:`, response.status);
          
          // Log successful delivery
          supabase
            .from('webhook_deliveries')
            .insert([{
              webhook_id: webhook.id,
              event,
              status: 'success',
              status_code: response.status,
              response_body: JSON.stringify(response.data)
            }])
            .catch(err => console.error('Failed to log webhook delivery:', err));
        })
        .catch(error => {
          console.error(`Webhook delivery failed to ${webhook.url}:`, error.message);
          
          // Log failed delivery
          supabase
            .from('webhook_deliveries')
            .insert([{
              webhook_id: webhook.id,
              event,
              status: 'failed',
              status_code: error.response?.status || 0,
              error_message: error.message
            }])
            .catch(err => console.error('Failed to log webhook delivery error:', err));
        });
    }
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
};

// ==================== WEBHOOK ROUTES ====================

// Create Webhook
app.post('/api/webhooks', verifyToken, async (req, res) => {
  try {
    const { url, events, description } = req.body;

    if (!url || !events || events.length === 0) {
      return res.status(400).json({ status: 'error', message: 'URL and events required' });
    }

    const { data, error } = await supabase
      .from('webhook_configs')
      .insert([
        {
          user_id: req.userId,
          url,
          events: events,
          description: description || '',
          is_active: true
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      message: 'Webhook created successfully',
      webhook: data[0]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get User's Webhooks (super_admin can see all, users see only their own)
app.get('/api/webhooks', verifyToken, async (req, res) => {
  try {
    let query = supabase.from('webhook_configs').select('*');

    if (req.userRole === ROLES.SUPER_ADMIN) {
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ status: 'error', message: error.message });
      }

      res.json({
        status: 'success',
        webhooks: data
      });
    } else {
      const { data, error } = await query
        .eq('user_id', req.userId)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ status: 'error', message: error.message });
      }

      res.json({
        status: 'success',
        webhooks: data
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update Webhook (with object-level authorization)
app.put('/api/webhooks/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, events, description, is_active } = req.body;

    let query = supabase.from('webhook_configs').update({
      url,
      events,
      description: description || '',
      is_active
    });

    if (req.userRole === ROLES.SUPER_ADMIN) {
      query = query.eq('id', id);
    } else {
      query = query.eq('id', id).eq('user_id', req.userId);
    }

    const { data, error } = await query.select();

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Webhook not found' });
    }

    res.json({
      status: 'success',
      message: 'Webhook updated successfully',
      webhook: data[0]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Delete Webhook (with object-level authorization)
app.delete('/api/webhooks/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    let query = supabase.from('webhook_configs').delete();

    if (req.userRole === ROLES.SUPER_ADMIN) {
      query = query.eq('id', id);
    } else {
      query = query.eq('id', id).eq('user_id', req.userId);
    }

    const { error } = await query;

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Test Webhook
app.post('/api/webhooks/:id/test', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: webhook, error: webhookError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (webhookError || !webhook) {
      return res.status(404).json({ status: 'error', message: 'Webhook not found' });
    }

    const testPayload = {
      event: 'test.event',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: id
      }
    };

    try {
      const response = await axios.post(webhook.url, testPayload, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });

      res.json({
        status: 'success',
        message: 'Webhook test successful',
        response: {
          statusCode: response.status,
          statusText: response.statusText
        }
      });
    } catch (axiosError) {
      res.status(400).json({
        status: 'error',
        message: 'Webhook delivery failed',
        error: axiosError.message
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get Webhook Deliveries
app.get('/api/webhooks/:id/deliveries', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      deliveries: data
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// M-Pesa Verification Proxy Endpoint
app.post('/api/mpesa-verification-proxy', mpesaVerificationProxy);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SwiftPay API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Real-time transaction monitoring endpoint
app.get('/api/dashboard/realtime', verifyToken, async (req, res) => {
  try {
    // First try to get user's tills
    const { data: tills } = await supabase
      .from('tills')
      .select('id')
      .eq('user_id', req.userId);

    let transactions, error;
    
    if (tills && tills.length > 0) {
      // User has tills, get transactions for those tills
      const tillIds = tills.map(t => t.id);
      const result = await supabase
        .from('transactions')
        .select('*')
        .in('till_id', tillIds)
        .order('created_at', { ascending: false })
        .limit(50);
      transactions = result.data;
      error = result.error;
    } else {
      // User has no tills, get all transactions (for admin/testing)
      const result = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      transactions = result.data;
      error = result.error;
    }

    if (error) throw error;

    console.log(`Realtime: Found ${transactions?.length || 0} transactions for user ${req.userId}`);

    // Calculate real-time metrics
    const now = new Date();
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentTransactions = transactions.filter(tx => new Date(tx.created_at) > last5Minutes);
    const hourlyTransactions = transactions.filter(tx => new Date(tx.created_at) > lastHour);
    
    const realtimeMetrics = {
      transactionsLast5Min: recentTransactions.length,
      transactionsLastHour: hourlyTransactions.length,
      revenueLast5Min: recentTransactions
        .filter(t => t.status === 'success')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      revenueLastHour: hourlyTransactions
        .filter(t => t.status === 'success')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      recentTransactions: transactions.slice(0, 10),
      activeUsers: new Set(transactions.slice(0, 50).map(tx => tx.phone_number).filter(Boolean)).size,
      averageTransactionValue: recentTransactions.length > 0
        ? recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) / recentTransactions.length
        : 0
    };

    res.json({ status: 'success', metrics: realtimeMetrics });
  } catch (error) {
    console.error('Real-time monitoring error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Generate Sample Transaction Data for Testing
app.post('/api/generate-sample-data', verifyToken, async (req, res) => {
  try {
    const { count = 100 } = req.body;
    
    // Get user's tills
    const { data: tills } = await supabase
      .from('tills')
      .select('id')
      .eq('user_id', req.userId);
    
    if (!tills || tills.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No till found' });
    }
    
    const sampleTransactions = [];
    const statuses = ['success', 'failed', 'pending'];
    const phoneNumbers = ['254712345678', '254723456789', '254734567890', '254745678901', '254756789012'];
    
    for (let i = 0; i < count; i++) {
      // Generate random date within last 30 days
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const randomHoursAgo = Math.floor(Math.random() * 24);
      const transactionDate = new Date();
      transactionDate.setDate(transactionDate.getDate() - randomDaysAgo);
      transactionDate.setHours(transactionDate.getHours() - randomHoursAgo);
      
      // Generate realistic amount (KES 100 - 50,000)
      const amount = Math.floor(Math.random() * 49900) + 100;
      
      // Random status with weighted probability (more success than failure)
      const statusRand = Math.random();
      let status;
      if (statusRand < 0.7) status = 'success';
      else if (statusRand < 0.9) status = 'failed';
      else status = 'pending';
      
      sampleTransactions.push({
        phone_number: phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)],
        amount: amount,
        status: status,
        till_id: tills[0].id,
        created_at: transactionDate.toISOString(),
        updated_at: transactionDate.toISOString(),
        transaction_id: `SAMPLE_${Date.now()}_${i}`,
        merchant_request_id: `MERCH_${Date.now()}_${i}`,
        checkout_request_id: `CHECK_${Date.now()}_${i}`
      });
    }
    
    // Insert sample transactions
    const { data, error } = await supabase
      .from('transactions')
      .insert(sampleTransactions);
    
    if (error) {
      console.error('Sample data insertion error:', error);
      return res.status(500).json({ status: 'error', message: error.message });
    }
    
    res.json({ 
      status: 'success', 
      message: `Generated ${count} sample transactions`,
      transactions: sampleTransactions.length
    });
    
  } catch (error) {
    console.error('Sample data generation error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== MINI-APP ROUTES ====================

// Create Mini-App
app.post('/api/mini-apps', verifyToken, async (req, res) => {
  try {
    const { title, slug, description, theme_config } = req.body;
    const { data, error } = await supabase
      .from('mini_apps')
      .insert([{ user_id: req.userId, title, slug, description, theme_config }])
      .select();
    if (error) return res.status(400).json({ status: 'error', message: error.message });
    res.json({ status: 'success', mini_app: data[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Add Product to Mini-App
app.post('/api/mini-apps/:id/products', verifyToken, async (req, res) => {
  try {
    const { name, price, stock, image_url, description } = req.body;
    const { data, error } = await supabase
      .from('mini_app_products')
      .insert([{ mini_app_id: req.params.id, name, price, stock, image_url, description }])
      .select();
    if (error) return res.status(400).json({ status: 'error', message: error.message });
    res.json({ status: 'success', product: data[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get Public Mini-App by Slug
app.get('/api/public/mini-apps/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: miniApp, error: appError } = await supabase
      .from('mini_apps')
      .select('*, products:mini_app_products(*)')
      .eq('slug', slug)
      .single();

    if (appError || !miniApp) return res.status(404).json({ status: 'error', message: 'Shop not found' });
    res.json({ status: 'success', mini_app: miniApp });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== ESCROW ROUTES ====================

// Initiate Escrow Payment
app.post('/api/escrow/initiate', verifyToken, async (req, res) => {
  try {
    const { phone, amount, till_id, reference } = req.body;
    const releaseCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // 1. Trigger STK Push (Simplified for this blueprint)
    // In production, this would call the existing STK push logic
    
    // 2. Create Escrow Transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: req.userId,
        till_id,
        amount,
        phone_number: phone,
        reference,
        is_escrow: true,
        escrow_status: 'held',
        release_code: releaseCode,
        status: 'pending'
      }])
      .select();

    if (error) return res.status(400).json({ status: 'error', message: error.message });
    // 3. Send Release Code via Brevo (Email/SMS)
    if (data && data[0]) {
      const emailHtml = buildEmailHtml({
        title: 'SwiftPay Escrow: Payment Secured',
        lead: `A payment of KES ${amount} is being held in escrow.`,
        contentHtml: `
          <p>Hello,</p>
          <p>Your payment for <strong>${reference}</strong> has been successfully secured by SwiftPay Trust-Shield.</p>
          <p><strong>Your Release Code:</strong> <span style="font-size: 24px; font-weight: bold; color: #2563eb;">${releaseCode}</span></p>
          <p>Please share this code with the seller <strong>ONLY AFTER</strong> you have received and verified your items.</p>
        `,
        footerHtml: 'SwiftPay Financial - Building Trust in African Commerce'
      });

      await sendEmail({
        to: req.user.email,
        subject: `Escrow Release Code: ${releaseCode}`,
        html: emailHtml
      }).catch(err => console.error('Failed to send escrow email:', err));
    }

    res.json({ status: 'success', message: 'Escrow payment initiated and code sent', transaction: data[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Release Escrow Funds
app.post('/api/escrow/release', async (req, res) => {
  try {
    const { transactionId, releaseCode } = req.body;
    const { data: tx, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError || !tx) return res.status(404).json({ status: 'error', message: 'Transaction not found' });
    if (tx.release_code !== releaseCode) return res.status(401).json({ status: 'error', message: 'Invalid release code' });

    // Update status to released
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ escrow_status: 'released', status: 'success' })
      .eq('id', transactionId);

    if (updateError) return res.status(400).json({ status: 'error', message: updateError.message });
    res.json({ status: 'success', message: 'Funds released to merchant' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== LENDING ROUTES ====================

// Get Loan Eligibility
app.get('/api/lending/eligibility', verifyToken, async (req, res) => {
  try {
    // Logic to calculate "Float-Score" based on transaction history
    const { data: txs } = await supabase.from('transactions').select('amount').eq('user_id', req.userId).eq('status', 'success');
    const totalVolume = txs?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const maxLoan = totalVolume * 0.1; // Eligible for 10% of 90-day volume

    res.json({
      status: 'success',
      eligible: maxLoan > 1000,
      maxAmount: maxLoan,
      score: Math.min(100, (totalVolume / 100000) * 100)
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 SwiftPay API Server running on http://localhost:${PORT}`);
  console.log(`📱 STK Push endpoint: POST http://localhost:${PORT}/api/mpesa/stk-push`);
  console.log(`💰 Balance endpoint: GET http://localhost:${PORT}/api/mpesa/balance`);
  console.log(`📊 Dashboard stats: GET http://localhost:${PORT}/api/dashboard/stats`);
});

// Set server timeout
server.setTimeout(30000);
