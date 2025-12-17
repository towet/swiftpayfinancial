-- Check the actual transactions table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- Check recent transactions with actual columns
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
