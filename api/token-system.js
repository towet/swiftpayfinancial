
// ================================================================
// TOKEN / PREPAID CREDITS SYSTEM
// ================================================================

// Platform fee schedule (KES)
const PLATFORM_FEE_SCHEDULE = [
  { min: 1,       max: 9,       fee: 0   },
  { min: 10,      max: 49,      fee: 3   },
  { min: 50,      max: 99,      fee: 5   },
  { min: 100,     max: 199,     fee: 6   },
  { min: 200,     max: 299,     fee: 7   },
  { min: 300,     max: 499,     fee: 8   },
  { min: 500,     max: 699,     fee: 10  },
  { min: 700,     max: 999,     fee: 12  },
  { min: 1000,    max: 1499,    fee: 15  },
  { min: 1500,    max: 1999,    fee: 18  },
  { min: 2000,    max: 2999,    fee: 22  },
  { min: 3000,    max: 3999,    fee: 27  },
  { min: 4000,    max: 4999,    fee: 32  },
  { min: 5000,    max: 6999,    fee: 38  },
  { min: 7000,    max: 9999,    fee: 45  },
  { min: 10000,   max: 14999,   fee: 52  },
  { min: 15000,   max: 19999,   fee: 60  },
  { min: 20000,   max: 29999,   fee: 70  },
  { min: 30000,   max: 39999,   fee: 85  },
  { min: 40000,   max: 49999,   fee: 100 },
  { min: 50000,   max: 69999,   fee: 115 },
  { min: 70000,   max: 99999,   fee: 130 },
  { min: 100000,  max: 149999,  fee: 145 },
  { min: 150000,  max: 199999,  fee: 165 },
  { min: 200000,  max: 249999,  fee: 180 },
  { min: 250000,  max: 349999,  fee: 200 },
  { min: 350000,  max: 449999,  fee: 225 },
  { min: 450000,  max: 549999,  fee: 250 },
  { min: 550000,  max: 649999,  fee: 270 },
  { min: 650000,  max: 749999,  fee: 290 },
  { min: 750000,  max: Infinity, fee: 320 },
];

const computePlatformFee = (amount) => {
  const amt = Number(amount || 0);
  if (!Number.isFinite(amt) || amt <= 0) return 0;
  const tier = PLATFORM_FEE_SCHEDULE.find((t) => amt >= t.min && amt <= t.max);
  return tier ? tier.fee : 0;
};

// Ensure a token account exists for a user (create if missing)
const ensureTokenAccountForUser = async (userId) => {
  const { data: existing, error: existingError } = await supabase
    .from('token_accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing && !existingError) return existing;

  const { data: created, error: createError } = await supabase
    .from('token_accounts')
    .insert([{ user_id: userId, balance: 0, total_topped_up: 0, total_fees_charged: 0 }])
    .select('*')
    .single();

  if (createError || !created) {
    throw new Error(createError?.message || 'Failed to create token account');
  }
  return created;
};

// Credit tokens to user (after successful top-up)
const creditTokens = async (userId, amount, source, reference, description) => {
  const account = await ensureTokenAccountForUser(userId);
  const newBalance = Number(account.balance) + Number(amount);

  const { data: ledgerRow, error: ledgerErr } = await supabase
    .from('token_ledger')
    .insert([{
      user_id: userId,
      entry_type: 'credit',
      amount: Number(amount),
      balance_after: newBalance,
      source: source || 'topup_mpesa',
      reference: reference || null,
      description: description || `Token top-up of KES ${amount}`,
    }])
    .select('*')
    .single();

  if (ledgerErr) throw new Error(ledgerErr.message);

  await supabase
    .from('token_accounts')
    .update({
      balance: newBalance,
      total_topped_up: Number(account.total_topped_up) + Number(amount),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return { ledgerRow, newBalance };
};

// Deduct platform fee from token balance when a transaction succeeds
const deductPlatformFee = async (userId, transactionId, transactionAmount) => {
  const fee = computePlatformFee(transactionAmount);
  if (fee <= 0) return { fee: 0, deducted: false };

  const account = await ensureTokenAccountForUser(userId);
  const currentBalance = Number(account.balance);

  if (currentBalance < fee) {
    console.warn(`[Tokens] User ${userId} has insufficient token balance (${currentBalance}) to pay fee (${fee}) for txn ${transactionId}`);
    // We deduct even if balance goes negative (debt model) – merchant still processed
  }

  const newBalance = currentBalance - fee;

  const { data: ledgerRow, error: ledgerErr } = await supabase
    .from('token_ledger')
    .insert([{
      user_id: userId,
      entry_type: 'debit',
      amount: fee,
      balance_after: newBalance,
      source: 'platform_fee',
      reference: transactionId || null,
      description: `Platform fee for KES ${transactionAmount} transaction`,
      transaction_amount: Number(transactionAmount),
    }])
    .select('*')
    .single();

  if (ledgerErr) throw new Error(ledgerErr.message);

  await supabase
    .from('token_accounts')
    .update({
      balance: newBalance,
      total_fees_charged: Number(account.total_fees_charged) + fee,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  // Mark transaction as fee_charged and store fee amount
  await supabase
    .from('transactions')
    .update({
      platform_fee: fee,
      fee_charged: true,
      fee_ledger_id: ledgerRow?.id || null,
    })
    .eq('id', transactionId);

  return { fee, deducted: true, newBalance, ledgerRow };
};

// ----------------------------------------------------------------
// GET /api/tokens - Get current user's token balance + summary
// ----------------------------------------------------------------
app.get('/api/tokens', verifyToken, async (req, res) => {
  try {
    const account = await ensureTokenAccountForUser(req.userId);
    res.json({ status: 'success', account });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ----------------------------------------------------------------
// GET /api/tokens/ledger - Token transaction history
// ----------------------------------------------------------------
app.get('/api/tokens/ledger', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const page = Math.max(Number(req.query.page || 1), 1);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('token_ledger')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return res.status(400).json({ status: 'error', message: error.message });

    res.json({ status: 'success', ledger: data || [], total: count || 0, page, limit });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ----------------------------------------------------------------
// GET /api/tokens/topups - Top-up request history
// ----------------------------------------------------------------
app.get('/api/tokens/topups', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);

    const { data, error } = await supabase
      .from('token_topup_requests')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return res.status(400).json({ status: 'error', message: error.message });

    res.json({ status: 'success', topups: data || [] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ----------------------------------------------------------------
// POST /api/tokens/topup - Initiate M-Pesa STK Push to top up tokens
// ----------------------------------------------------------------
app.post('/api/tokens/topup', verifyToken, async (req, res) => {
  try {
    const amountRaw = req.body?.amount;
    const phoneRaw = req.body?.phone_number || req.body?.phone || '';

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount < 10) {
      return res.status(400).json({ status: 'error', message: 'Minimum top-up amount is KES 10' });
    }
    if (amount > 150000) {
      return res.status(400).json({ status: 'error', message: 'Maximum top-up per transaction is KES 150,000' });
    }

    const phone_number = String(phoneRaw || '').trim();
    if (!phone_number || phone_number.length < 9) {
      return res.status(400).json({ status: 'error', message: 'Phone number is required' });
    }

    await ensureTokenAccountForUser(req.userId);

    const accountReference = `TOKENS${String(req.userId).replace(/-/g, '').slice(0, 6).toUpperCase()}`;

    const mpesaToken = await getMpesaAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_WALLET_SHORT_CODE}${MPESA_WALLET_PASSKEY}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: MPESA_WALLET_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: MPESA_WALLET_TRANSACTION_TYPE,
      Amount: Math.round(amount),
      PartyA: phone_number,
      PartyB: MPESA_WALLET_PARTY_B,
      PhoneNumber: phone_number,
      CallBackURL: `${CALLBACK_URL}/api/callbacks/token-topup`,
      AccountReference: accountReference,
      TransactionDesc: 'SwiftPay Token Top-Up',
    };

    const response = await axios.post(STK_PUSH_URL, payload, {
      headers: { Authorization: `Bearer ${mpesaToken}`, 'Content-Type': 'application/json' },
    });

    const mpesa_request_id = response.data.MerchantRequestID || response.data.MerchantRequestId || response.data.RequestId || response.data.RequestID;
    const checkout_request_id = response.data.CheckoutRequestID || response.data.CheckoutRequestId;

    const { data: topup, error: topupError } = await supabase
      .from('token_topup_requests')
      .insert([{
        user_id: req.userId,
        amount,
        phone_number,
        status: 'pending',
        mpesa_request_id,
        checkout_request_id,
        mpesa_response: response.data,
        updated_at: new Date().toISOString(),
      }])
      .select('*')
      .single();

    if (topupError || !topup) {
      return res.status(400).json({ status: 'error', message: topupError?.message || 'Failed to create top-up record' });
    }

    res.json({
      status: 'success',
      message: 'STK Push sent — please check your phone to complete the top-up',
      topup,
      mpesa: response.data,
    });
  } catch (error) {
    console.error('Token TopUp STK Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: error.response?.data?.errorMessage || error.message,
    });
  }
});

// ----------------------------------------------------------------
// GET /api/tokens/topup/:id/status - Poll a single top-up status
// ----------------------------------------------------------------
app.get('/api/tokens/topup/:id/status', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('token_topup_requests')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) return res.status(404).json({ status: 'error', message: 'Top-up not found' });

    // Also return the latest token balance
    const account = await ensureTokenAccountForUser(req.userId);

    res.json({ status: 'success', topup: data, account });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ----------------------------------------------------------------
// POST /api/callbacks/token-topup  – M-Pesa callback for token STK
// ----------------------------------------------------------------
app.post('/api/callbacks/token-topup', async (req, res) => {
  try {
    const callbackData = req.body;
    const {
      resultCode,
      resultDesc,
      merchantRequestId,
      checkoutRequestId,
      amount,
      phone,
      mpesaReceiptNumber,
    } = extractStkCallbackDetails(callbackData);

    console.log('[TokenTopup Callback]', { resultCode, checkoutRequestId, merchantRequestId, mpesaReceiptNumber });

    // Find pending topup by checkout_request_id or mpesa_request_id
    let query = supabase
      .from('token_topup_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkoutRequestId) {
      query = query.eq('checkout_request_id', checkoutRequestId);
    } else if (merchantRequestId) {
      query = query.eq('mpesa_request_id', merchantRequestId);
    } else {
      return res.json({ status: 'success', message: 'No identifier found, skipping' });
    }

    const { data: existing } = await query;
    const topup = existing?.[0];

    if (!topup?.id) {
      console.warn('[TokenTopup Callback] No matching pending topup found', { checkoutRequestId, merchantRequestId });
      return res.json({ status: 'success', message: 'Callback processed (no match)' });
    }

    if (resultCode === 0) {
      // Success – update record and credit tokens
      await supabase
        .from('token_topup_requests')
        .update({
          status: 'success',
          callback_data: callbackData,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', topup.id);

      await creditTokens(
        topup.user_id,
        amount || topup.amount,
        'topup_mpesa',
        topup.id,
        `M-Pesa top-up receipt: ${mpesaReceiptNumber || 'N/A'} — Phone: ${phone || topup.phone_number}`,
      );

      console.log(`[TokenTopup] Credited KES ${amount || topup.amount} tokens to user ${topup.user_id}`);
    } else {
      await supabase
        .from('token_topup_requests')
        .update({
          status: 'failed',
          callback_data: callbackData,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', topup.id);

      console.warn(`[TokenTopup] Failed for user ${topup.user_id}: ${resultDesc}`);
    }

    res.json({ status: 'success', message: 'Callback processed' });
  } catch (error) {
    console.error('[TokenTopup Callback Error]', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ----------------------------------------------------------------
// GET /api/tokens/fee-schedule - Return the full fee table
// ----------------------------------------------------------------
app.get('/api/tokens/fee-schedule', (req, res) => {
  res.json({ status: 'success', schedule: PLATFORM_FEE_SCHEDULE });
});

// ----------------------------------------------------------------
// POST /api/tokens/calculate-fee - Calculate fee for a given amount
// ----------------------------------------------------------------
app.post('/api/tokens/calculate-fee', (req, res) => {
  const amount = Number(req.body?.amount || 0);
  const fee = computePlatformFee(amount);
  res.json({ status: 'success', amount, fee, net: amount });
});

// ----------------------------------------------------------------
// SUPER ADMIN: GET /api/super-admin/tokens/overview
// ----------------------------------------------------------------
app.get('/api/super-admin/tokens/overview', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { data: accounts, error } = await supabase
      .from('token_accounts')
      .select('*, users:user_id (email, full_name, company_name)')
      .order('balance', { ascending: false });

    if (error) return res.status(400).json({ status: 'error', message: error.message });

    const totalBalance = (accounts || []).reduce((s, a) => s + Number(a.balance || 0), 0);
    const totalFees = (accounts || []).reduce((s, a) => s + Number(a.total_fees_charged || 0), 0);
    const totalTopups = (accounts || []).reduce((s, a) => s + Number(a.total_topped_up || 0), 0);

    res.json({ status: 'success', accounts, stats: { totalBalance, totalFees, totalTopups } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ----------------------------------------------------------------
// SUPER ADMIN: POST /api/super-admin/tokens/adjust - Manual credit/debit
// ----------------------------------------------------------------
app.post('/api/super-admin/tokens/adjust', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { user_id, amount, entry_type, description } = req.body;

    if (!user_id || !amount || !entry_type) {
      return res.status(400).json({ status: 'error', message: 'user_id, amount, and entry_type are required' });
    }
    if (!['credit', 'debit'].includes(entry_type)) {
      return res.status(400).json({ status: 'error', message: 'entry_type must be credit or debit' });
    }

    const adj = Number(amount);
    if (!Number.isFinite(adj) || adj <= 0) {
      return res.status(400).json({ status: 'error', message: 'Amount must be a positive number' });
    }

    const account = await ensureTokenAccountForUser(user_id);
    const newBalance = entry_type === 'credit'
      ? Number(account.balance) + adj
      : Number(account.balance) - adj;

    const { data: ledgerRow, error: ledgerErr } = await supabase
      .from('token_ledger')
      .insert([{
        user_id,
        entry_type,
        amount: adj,
        balance_after: newBalance,
        source: 'manual_adjustment',
        reference: `admin:${req.userId}`,
        description: description || `Admin ${entry_type} of KES ${adj}`,
      }])
      .select('*')
      .single();

    if (ledgerErr) return res.status(400).json({ status: 'error', message: ledgerErr.message });

    const updatePayload = {
      balance: newBalance,
      updated_at: new Date().toISOString(),
    };
    if (entry_type === 'credit') updatePayload.total_topped_up = Number(account.total_topped_up) + adj;

    await supabase.from('token_accounts').update(updatePayload).eq('user_id', user_id);

    res.json({ status: 'success', ledgerRow, newBalance });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
