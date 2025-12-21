-- Check recent transactions and their stored IDs
SELECT 
    id,
    created_at,
    mpesa_request_id,
    checkout_request_id,
    status,
    amount,
    phone_number,
    mpesa_response->>'RequestId' as response_request_id,
    mpesa_response->>'MerchantRequestID' as response_merchant_request_id,
    mpesa_response->>'CheckoutRequestID' as response_checkout_request_id
FROM transactions 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any successful transactions
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM transactions 
GROUP BY status;

-- Check for any transactions with callback data
SELECT 
    id,
    status,
    mpesa_request_id,
    checkout_request_id,
    callback_data is not null as has_callback_data
FROM transactions 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 5;
