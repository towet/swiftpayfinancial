import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = 'c:\\Users\\APEX INFINITY\\Downloads\\SWIFTPAYMODERN\\blank-canvas';
const serverPath = join(ROOT, 'server.js');

let src = readFileSync(serverPath, 'utf8').replace(/\r\n/g, '\n');

// The anchor - the console.log right after the fetchTransactionsForUserAnalytics call in /api/dashboard/analytics
// This occurs exactly once in the file
const ANCHOR = "console.log(`Analytics: Found ${transactions?.length || 0} transactions for user ${req.userId}`);";

if (!src.includes(ANCHOR)) {
  console.error('❌ Anchor not found! Patch aborted.');
  process.exit(1);
}

const anchorCount = (src.match(/console\.log\(`Analytics: Found \$\{transactions\?\.length \|\| 0\} transactions for user \$\{req\.userId\}`\)/g) || []).length;
console.log(`Found anchor ${anchorCount} time(s).`);

// Check if txList is already defined AFTER the anchor in the analytics handler
const anchorIdx = src.indexOf(ANCHOR);
const afterAnchor = src.slice(anchorIdx, anchorIdx + 200);
if (afterAnchor.includes('const txList = transactions')) {
  console.log('✅ Patch already applied at the correct location. Nothing to do.');
  process.exit(0);
}

// Apply patch - add txList alias right after the anchor line
const REPLACEMENT = ANCHOR + '\n    const txList = transactions || [];';

src = src.replace(ANCHOR, REPLACEMENT);

writeFileSync(serverPath, src, 'utf8');
console.log('✅ Patch applied successfully!');
console.log('   Added: const txList = transactions || []; after analytics fetch call');
