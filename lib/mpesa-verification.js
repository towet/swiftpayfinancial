/**
 * M-Pesa Payment Verification Utility
 * 
 * A reusable module for verifying M-Pesa STK Push payments directly with Safaricom's API.
 * This module handles authentication, timestamp generation, and payment status queries.
 * 
 * Usage:
 * ```javascript
 * import { getMpesaToken, queryMpesaPaymentStatus } from './lib/mpesa-verification.js';
 * 
 * const token = await getMpesaToken(consumerKey, consumerSecret);
 * const status = await queryMpesaPaymentStatus(token, checkoutId, config);
 * ```
 */

/**
 * Get OAuth token from Safaricom M-Pesa API
 * 
 * @param {string} consumerKey - M-Pesa Consumer Key from Safaricom
 * @param {string} consumerSecret - M-Pesa Consumer Secret from Safaricom
 * @returns {Promise<string|null>} Access token or null if failed
 * 
 * @example
 * const token = await getMpesaToken(
 *   'QNDgt0ltfcmiiDAEVWfwAwWq2uHq3XeXv7BEXKGJKS7X7wVg',
 *   'TD6vam4JJs7ghG5eGutL4zsNFFNLBF9yEBxUNZRopGPVNv77yqQvYo0OhsMy3eSq'
 * );
 */
export async function getMpesaToken(consumerKey, consumerSecret) {
  try {
    if (!consumerKey || !consumerSecret) {
      console.error('M-Pesa credentials not provided');
      return null;
    }
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const response = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('M-Pesa token response status:', response.status);
      const text = await response.text();
      console.error('M-Pesa token response:', text);
      return null;
    }

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('Error getting M-Pesa token:', error.message);
    return null;
  }
}

/**
 * Generate Safaricom M-Pesa API timestamp in correct format
 * 
 * @param {Date} date - Date object (defaults to current time)
 * @returns {string} Timestamp in YYYYMMDDHHmmss format
 * 
 * @example
 * const timestamp = generateMpesaTimestamp();
 * // Returns: "20251214234530"
 */
export function generateMpesaTimestamp(date = new Date()) {
  return date.getFullYear().toString() + 
    String(date.getMonth() + 1).padStart(2, '0') + 
    String(date.getDate()).padStart(2, '0') + 
    String(date.getHours()).padStart(2, '0') + 
    String(date.getMinutes()).padStart(2, '0') + 
    String(date.getSeconds()).padStart(2, '0');
}

/**
 * Generate Safaricom M-Pesa API password
 * 
 * @param {string} businessShortCode - M-Pesa Business Short Code
 * @param {string} passkey - M-Pesa Pass Key from Safaricom
 * @param {string} timestamp - Timestamp in YYYYMMDDHHmmss format
 * @returns {string} Base64 encoded password
 * 
 * @example
 * const password = generateMpesaPassword('3581047', 'cb9041a559db0ad7cbd8debaa5574661c5bf4e1fb7c7e99a8116c83dcaa8474d', '20251214234530');
 */
export function generateMpesaPassword(businessShortCode, passkey, timestamp) {
  return Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');
}

/**
 * Query M-Pesa STK Push payment status from Safaricom
 * 
 * @param {string} token - OAuth token from getMpesaToken()
 * @param {string} checkoutRequestId - CheckoutRequestID from STK push response
 * @param {Object} config - Configuration object
 * @param {string} config.businessShortCode - M-Pesa Business Short Code
 * @param {string} config.passkey - M-Pesa Pass Key
 * @returns {Promise<Object>} Safaricom API response
 * 
 * @example
 * const response = await queryMpesaPaymentStatus(token, 'ws_CO_14122025231025749795704273', {
 *   businessShortCode: '3581047',
 *   passkey: 'cb9041a559db0ad7cbd8debaa5574661c5bf4e1fb7c7e99a8116c83dcaa8474d'
 * });
 * 
 * if (response.ResultCode === '0') {
 *   console.log('Payment successful!');
 * } else if (response.ResultCode === '4999') {
 *   console.log('Payment still processing...');
 * }
 */
export async function queryMpesaPaymentStatus(token, checkoutRequestId, config) {
  try {
    if (!token || !checkoutRequestId || !config.businessShortCode || !config.passkey) {
      console.error('Missing required parameters for M-Pesa query');
      return null;
    }

    const timestamp = generateMpesaTimestamp();
    const password = generateMpesaPassword(config.businessShortCode, config.passkey, timestamp);

    const response = await fetch('https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        BusinessShortCode: config.businessShortCode,
        CheckoutRequestID: checkoutRequestId,
        Timestamp: timestamp,
        Password: password
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error querying M-Pesa payment status:', error.message);
    return null;
  }
}

/**
 * Verify M-Pesa payment status and return normalized result
 * 
 * This is a convenience function that combines token generation and status query.
 * 
 * @param {string} checkoutRequestId - CheckoutRequestID from STK push response
 * @param {Object} credentials - M-Pesa credentials
 * @param {string} credentials.consumerKey - M-Pesa Consumer Key
 * @param {string} credentials.consumerSecret - M-Pesa Consumer Secret
 * @param {string} credentials.businessShortCode - M-Pesa Business Short Code
 * @param {string} credentials.passkey - M-Pesa Pass Key
 * @returns {Promise<Object>} Normalized payment status
 * 
 * @example
 * const result = await verifyMpesaPayment('ws_CO_14122025231025749795704273', {
 *   consumerKey: 'QNDgt0ltfcmiiDAEVWfwAwWq2uHq3XeXv7BEXKGJKS7X7wVg',
 *   consumerSecret: 'TD6vam4JJs7ghG5eGutL4zsNFFNLBF9yEBxUNZRopGPVNv77yqQvYo0OhsMy3eSq',
 *   businessShortCode: '3581047',
 *   passkey: 'cb9041a559db0ad7cbd8debaa5574661c5bf4e1fb7c7e99a8116c83dcaa8474d'
 * });
 * 
 * if (result.success) {
 *   console.log('Payment confirmed:', result.status);
 * }
 */
export async function verifyMpesaPayment(checkoutRequestId, credentials) {
  try {
    const token = await getMpesaToken(credentials.consumerKey, credentials.consumerSecret);
    if (!token) {
      return {
        success: false,
        status: 'error',
        message: 'Failed to authenticate with M-Pesa'
      };
    }

    const response = await queryMpesaPaymentStatus(token, checkoutRequestId, {
      businessShortCode: credentials.businessShortCode,
      passkey: credentials.passkey
    });

    if (!response) {
      return {
        success: false,
        status: 'error',
        message: 'Failed to query payment status'
      };
    }

    // Normalize Safaricom response codes
    let status = 'pending';
    if (response.ResultCode === '0') {
      status = 'success';
    } else if (response.ResultCode === '4999') {
      status = 'processing';
    } else if (response.ResultCode && response.ResultCode !== '0') {
      status = 'failed';
    }

    return {
      success: response.ResultCode === '0',
      status: status,
      resultCode: response.ResultCode,
      resultDesc: response.ResultDesc,
      merchantRequestId: response.MerchantRequestID,
      checkoutRequestId: response.CheckoutRequestID,
      mpesaReceiptNumber: response.MpesaReceiptNumber,
      rawResponse: response
    };
  } catch (error) {
    console.error('Error verifying M-Pesa payment:', error);
    return {
      success: false,
      status: 'error',
      message: error.message
    };
  }
}
