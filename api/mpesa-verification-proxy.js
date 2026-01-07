/**
 * M-Pesa Verification Proxy Endpoint
 * 
 * Allows other projects to verify M-Pesa payments without exposing credentials.
 * This endpoint handles all credential management securely on the SwiftPay server.
 * 
 * Usage:
 * POST /api/mpesa-verification-proxy
 * {
 *   "checkoutId": "ws_CO_...",
 *   "apiKey": "optional-api-key"
 * }
 */

import { verifyMpesaPayment } from '../lib/mpesa-verification.js';

// M-Pesa Credentials (kept secure on server)
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORT_CODE || process.env.MPESA_BUSINESS_SHORTCODE || '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';

// Optional API key for proxy authentication
const PROXY_API_KEY = process.env.MPESA_PROXY_API_KEY || '';

export async function mpesaVerificationProxy(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { checkoutId, apiKey } = req.body;

    // Validate input
    if (!checkoutId) {
      return res.status(400).json({
        success: false,
        message: 'checkoutId is required'
      });
    }

    // Validate API key only if PROXY_API_KEY is configured
    if (PROXY_API_KEY && PROXY_API_KEY.length > 0) {
      if (!apiKey || apiKey !== PROXY_API_KEY) {
        console.warn(`Invalid API key attempt. Expected: ${PROXY_API_KEY}, Got: ${apiKey}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid API key'
        });
      }
    }

    // Check if credentials are configured
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_BUSINESS_SHORTCODE || !MPESA_PASSKEY) {
      console.error('M-Pesa credentials not configured on proxy server');
      return res.status(500).json({
        success: false,
        message: 'Proxy server not properly configured'
      });
    }

    console.log(`Verifying M-Pesa payment for checkoutId: ${checkoutId}`);

    // Verify payment using the utility
    const result = await verifyMpesaPayment(checkoutId, {
      consumerKey: MPESA_CONSUMER_KEY,
      consumerSecret: MPESA_CONSUMER_SECRET,
      businessShortCode: MPESA_BUSINESS_SHORTCODE,
      passkey: MPESA_PASSKEY
    });

    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment'
      });
    }

    console.log(`Payment verification result for ${checkoutId}:`, result);

    // Update transaction status in database if payment is successful or failed
    if (result.success || result.status === 'failed') {
      try {
        const updatePayload = {
          checkout_request_id: checkoutId,
          mpesa_request_id: result.merchantRequestId,
          result_code: result.resultCode,
          status: result.status,
          callback_data: result.rawResponse
        };

        const updateResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/transactions/update-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          console.log(`✅ Transaction updated for ${checkoutId}:`, updateData);
        } else {
          console.warn(`⚠️ Failed to update transaction for ${checkoutId}:`, updateResponse.status);
        }
      } catch (updateError) {
        console.error(`❌ Error updating transaction for ${checkoutId}:`, updateError.message);
      }
    }

    // Return normalized response
    if (res.headersSent) return;
    return res.status(200).json({
      success: result.success,
      payment: {
        status: result.status,
        resultCode: result.resultCode,
        resultDesc: result.resultDesc,
        receipt: result.mpesaReceiptNumber,
        checkoutId: checkoutId
      }
    });

  } catch (error) {
    console.error('Proxy verification error:', error);
    if (res.headersSent) return;
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
