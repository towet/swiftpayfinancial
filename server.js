import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { mpesaVerificationProxy } from './api/mpesa-verification-proxy.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co',
  process.env.SUPABASE_KEY || 'your-supabase-key'
);

// M-Pesa Credentials (Hardcoded for testing)
const MPESA_CONSUMER_KEY = 'QNDgt0ltfcmiiDAEVWfwAwWq2uHq3XeXv7BEXKGJKS7X7wVg';
const MPESA_CONSUMER_SECRET = 'TD6vam4JJs7ghG5eGutL4zsNFFNLBF9yEBxUNZRopGPVNv77yqQvYo0OhsMy3eSq';
const MPESA_BUSINESS_SHORT_CODE = '3581047';
const MPESA_PASSKEY = 'cb9041a559db0ad7cbd8debaa5574661c5bf4e1fb7c7e99a8116c83dcaa8474d';
const CALLBACK_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';

// M-Pesa API Endpoints
const OAUTH_URL = 'https://api.safaricom.co.ke/oauth/v1/generate';
const STK_PUSH_URL = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
const ACCOUNT_BALANCE_URL = 'https://api.safaricom.co.ke/mpesa/accountbalance/v1/query';
const TRANSACTION_STATUS_URL = 'https://api.safaricom.co.ke/mpesa/transactionstatus/v1/query';
const B2C_URL = 'https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware: Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
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
    next();
  } catch (error) {
    console.error('API Key verification error:', error);
    res.status(401).json({ status: 'error', message: 'API key verification failed' });
  }
};

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

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password required' });
    }

    // Get user from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, data.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);

    const token = jwt.sign({ userId: data.id, email: data.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        companyName: data.company_name
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
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

// Get User's Tills
app.get('/api/tills', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tills')
      .select('*')
      .eq('user_id', req.userId);

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      tills: data
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update Till
app.put('/api/tills/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tillName, tillNumber, description } = req.body;

    const { data, error } = await supabase
      .from('tills')
      .update({
        till_name: tillName,
        till_number: tillNumber,
        description: description || ''
      })
      .eq('id', id)
      .eq('user_id', req.userId)
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

// Delete Till
app.delete('/api/tills/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

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

// Get API Keys
app.get('/api/keys', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', req.userId);

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      keys: data
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Delete API Key
app.delete('/api/keys/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

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
          mpesa_request_id: response.data.RequestId,
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

// Payment Callback Handler (from M-Pesa)
app.post('/api/mpesa/callback', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log('M-Pesa Callback received:', callbackData);

    // Extract relevant data from M-Pesa callback
    const result = callbackData.Body?.stkCallback?.CallbackMetadata?.Item || [];
    const amount = result.find(item => item.Name === 'Amount')?.Value;
    const phone = result.find(item => item.Name === 'PhoneNumber')?.Value;
    const mpesaReceiptNumber = result.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
    const resultCode = callbackData.Body?.stkCallback?.ResultCode;

    if (resultCode === 0) {
      // Payment successful
      const { data: transaction, error } = await supabase
        .from('transactions')
        .update({
          status: 'success',
          mpesa_receipt_number: mpesaReceiptNumber
        })
        .eq('phone_number', phone)
        .eq('amount', amount)
        .order('created_at', { ascending: false })
        .limit(1)
        .select();

      if (transaction && transaction.length > 0) {
        const txn = transaction[0];
        
        // Get till details to find user
        const { data: till } = await supabase
          .from('tills')
          .select('user_id')
          .eq('id', txn.till_id)
          .single();

        if (till) {
          // Trigger payment.success webhook
          triggerWebhook(till.user_id, 'payment.success', {
            transactionId: txn.id,
            amount,
            phone,
            mpesaReceiptNumber,
            status: 'success',
            timestamp: new Date().toISOString()
          });
        }
      }
    } else {
      // Payment failed
      const { data: transaction } = await supabase
        .from('transactions')
        .update({
          status: 'failed'
        })
        .eq('phone_number', phone)
        .eq('amount', amount)
        .order('created_at', { ascending: false })
        .limit(1)
        .select();

      if (transaction && transaction.length > 0) {
        const txn = transaction[0];
        
        // Get till details to find user
        const { data: till } = await supabase
          .from('tills')
          .select('user_id')
          .eq('id', txn.till_id)
          .single();

        if (till) {
          // Trigger payment.failed webhook
          triggerWebhook(till.user_id, 'payment.failed', {
            transactionId: txn.id,
            amount,
            phone,
            status: 'failed',
            resultCode,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    res.json({ status: 'success', message: 'Callback processed' });
  } catch (error) {
    console.error('Callback Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

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
      CallBackURL: `${CALLBACK_URL}/callback.php`,
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
          mpesa_request_id: response.data.RequestId,
          mpesa_response: response.data
        }
      ]);

    console.log('STK Push API success:', response.data);

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

// Get Transactions
app.get('/api/transactions', verifyToken, async (req, res) => {
  try {
    const { tillId } = req.query;

    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (tillId) {
      query = query.eq('till_id', tillId);
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
    const { mpesa_request_id, checkout_request_id, status, callback_data, result_code } = req.body;

    if (!mpesa_request_id && !checkout_request_id) {
      return res.status(400).json({ status: 'error', message: 'Request ID or Checkout ID required' });
    }

    // Determine transaction status based on result code
    let transactionStatus = 'pending';
    if (result_code === 0 || status === 'success' || status === 'SUCCESS') {
      transactionStatus = 'success';
    } else if (result_code !== 0 && result_code !== null) {
      transactionStatus = 'failed';
    }

    // Update transaction by mpesa_request_id
    let updateQuery = supabase
      .from('transactions')
      .update({
        status: transactionStatus,
        callback_data: callback_data || null,
        completed_at: transactionStatus !== 'pending' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      });

    if (mpesa_request_id) {
      updateQuery = updateQuery.eq('mpesa_request_id', mpesa_request_id);
    } else if (checkout_request_id) {
      updateQuery = updateQuery.eq('checkout_request_id', checkout_request_id);
    }

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

    res.json({
      status: 'success',
      message: `Transaction status updated to ${transactionStatus}`,
      transaction: data[0]
    });
  } catch (error) {
    console.error('Status update error:', error);
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

// Get Dashboard Stats
app.get('/api/dashboard/stats', verifyToken, async (req, res) => {
  try {
    const { data: tills } = await supabase
      .from('tills')
      .select('id')
      .eq('user_id', req.userId);

    const tillIds = tills.map(t => t.id);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .in('till_id', tillIds);

    const successfulTransactions = transactions.filter(t => t.status === 'success');
    
    const stats = {
      totalTransactions: transactions.length,
      totalAmount: successfulTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      successfulTransactions: successfulTransactions.length,
      failedTransactions: transactions.filter(t => t.status === 'failed').length,
      pendingTransactions: transactions.filter(t => t.status === 'pending').length
    };

    res.json({
      status: 'success',
      stats
    });
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

// Get User's Webhooks
app.get('/api/webhooks', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({
      status: 'success',
      webhooks: data
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update Webhook
app.put('/api/webhooks/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, events, description, is_active } = req.body;

    const { data, error } = await supabase
      .from('webhook_configs')
      .update({
        url,
        events,
        description: description || '',
        is_active
      })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select();

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

// Delete Webhook
app.delete('/api/webhooks/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('webhook_configs')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

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

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 SwiftPay API Server running on http://localhost:${PORT}`);
  console.log(`📱 STK Push endpoint: POST http://localhost:${PORT}/api/mpesa/stk-push`);
  console.log(`💰 Balance endpoint: GET http://localhost:${PORT}/api/mpesa/balance`);
});
