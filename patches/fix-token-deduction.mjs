import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = 'c:\\Users\\APEX INFINITY\\Downloads\\SWIFTPAYMODERN\\blank-canvas';
const serverPath = join(ROOT, 'server.js');

let src = readFileSync(serverPath, 'utf8').replace(/\r\n/g, '\n');

// ─── PATCH: Call deductPlatformFee in the STK callback success block ──────────
// The till.user_id is fetched on line ~5486, and we have txn from the transaction update.
// We need to deduct the platform fee right after we confirm `till` exists, 
// BEFORE the webhook/notification calls, so deduction happens atomically with payment success.
//
// Anchor: the webhook trigger line inside `if (till) {` block

const ANCHOR = `        if (till) {
          triggerWebhook(till.user_id, 'payment.success', {`;

const REPLACEMENT = `        if (till) {
          // ── Deduct platform fee tokens from till owner ──────────────────────
          try {
            if (txn?.id && !txn?.fee_charged) {
              await deductPlatformFee(till.user_id, txn.id, txn.amount || amount || 0);
              console.log(\`[Tokens] Deducted platform fee for txn \${txn.id} from user \${till.user_id}\`);
            }
          } catch (feeErr) {
            console.error('[Tokens] Fee deduction error (non-fatal):', feeErr?.message || feeErr);
          }
          // ───────────────────────────────────────────────────────────────────
          triggerWebhook(till.user_id, 'payment.success', {`;

if (!src.includes(ANCHOR)) {
  console.error('❌ Anchor not found! Check if the callback handler changed.');
  process.exit(1);
}

src = src.replace(ANCHOR, REPLACEMENT);

writeFileSync(serverPath, src, 'utf8');
console.log('✅ Patch 1 applied: deductPlatformFee now called in processMpesaCallback success block');
