import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = 'c:\\Users\\APEX INFINITY\\Downloads\\SWIFTPAYMODERN\\blank-canvas';
const serverPath = join(ROOT, 'server.js');

let src = readFileSync(serverPath, 'utf8').replace(/\r\n/g, '\n');

const ANCHOR = `  return { fee, deducted: true, newBalance, ledgerRow };
};`;

const ADDITION = `  return { fee, deducted: true, newBalance, ledgerRow };
};

// Reconcile uncharged platform fees for a specific till since a given date
const reconcileTillPlatformFees = async (tillId, sinceDateIso = '2026-11-23T00:00:00+03:00') => {
  try {
    const { data: till, error: tillErr } = await supabase
      .from('tills')
      .select('id, user_id, till_name, till_number')
      .eq('id', tillId)
      .single();

    if (tillErr || !till) {
      console.warn('[Reconcile] Till not found:', tillId);
      return { status: 'error', message: 'Till not found' };
    }

    const { data: txs, error: txErr } = await supabase
      .from('transactions')
      .select('id, amount, status, fee_charged, created_at')
      .eq('till_id', tillId)
      .eq('status', 'success')
      .gte('created_at', sinceDateIso)
      .order('created_at', { ascending: true });

    if (txErr) {
      console.error('[Reconcile] Error fetching transactions:', txErr.message);
      return { status: 'error', message: txErr.message };
    }

    const uncharged = (txs || []).filter(t => !t.fee_charged);
    console.log(\`[Reconcile] Till \${till.till_name || till.till_number} has \${uncharged.length} uncharged transactions since \${sinceDateIso}\`);

    let totalDeducted = 0;
    const processed = [];

    for (const tx of uncharged) {
      const res = await deductPlatformFee(till.user_id, tx.id, tx.amount || 0);
      if (res?.deducted) {
        totalDeducted += res.fee;
        processed.push({ id: tx.id, amount: tx.amount, fee: res.fee });
      }
    }

    const account = await ensureTokenAccountForUser(till.user_id);
    console.log(\`[Reconcile] Processed \${processed.length} txs. Total fee deducted: KES \${totalDeducted}. Balance: KES \${account.balance}\`);

    return {
      status: 'success',
      till: { id: till.id, name: till.till_name, number: till.till_number, user_id: till.user_id },
      uncharged_count: uncharged.length,
      processed_count: processed.length,
      total_fees_deducted: totalDeducted,
      new_balance: Number(account.balance),
      transactions: processed
    };
  } catch (err) {
    console.error('[Reconcile] Error:', err?.message || err);
    return { status: 'error', message: err?.message || String(err) };
  }
};`;

if (!src.includes(ANCHOR)) {
  console.error('❌ ANCHOR not found in server.js');
  process.exit(1);
}

src = src.replace(ANCHOR, ADDITION);

// Add endpoint and startup auto-run
const ENDPOINT_ANCHOR = `// SUPER ADMIN: POST /api/super-admin/tokens/adjust - Manual credit/debit`;
const ENDPOINT_CODE = `// Reconcile uncharged platform fees endpoint
app.all('/api/super-admin/tokens/reconcile-till', async (req, res) => {
  try {
    const tillId = req.query.tillId || req.body?.tillId || '92189482-2637-4af1-a0f4-cb7974ef7b4e';
    const since = req.query.since || req.body?.since || '2026-11-23T00:00:00+03:00';
    const result = await reconcileTillPlatformFees(tillId, since);
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Auto-run reconciliation for tepito till on boot
(async () => {
  try {
    setTimeout(async () => {
      console.log('[Startup Reconcile] Running auto-reconciliation for till 92189482-2637-4af1-a0f4-cb7974ef7b4e...');
      await reconcileTillPlatformFees('92189482-2637-4af1-a0f4-cb7974ef7b4e', '2026-11-23T00:00:00+03:00');
    }, 5000);
  } catch (_) {}
})();

// SUPER ADMIN: POST /api/super-admin/tokens/adjust - Manual credit/debit`;

if (src.includes(ENDPOINT_ANCHOR)) {
  src = src.replace(ENDPOINT_ANCHOR, ENDPOINT_CODE);
}

writeFileSync(serverPath, src, 'utf8');
console.log('✅ Added reconcileTillPlatformFees, endpoint, and startup job to server.js');
