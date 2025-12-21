-- Add the missing checkout_request_id column
ALTER TABLE transactions 
ADD COLUMN checkout_request_id VARCHAR(255);

-- Check recent transactions to see the ID mismatch
SELECT 
    id,
    created_at,
    mpesa_request_id,
    status,
    amount,
    phone_number,
    mpesa_response->>'RequestId' as response_request_id,
    mpesa_response->>'MerchantRequestID' as response_merchant_request_id,
    mpesa_response->>'CheckoutRequestID' as response_checkout_request_id
FROM transactions 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 5;

