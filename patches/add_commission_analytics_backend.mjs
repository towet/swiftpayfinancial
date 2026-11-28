import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = 'c:\\Users\\APEX INFINITY\\Downloads\\SWIFTPAYMODERN\\blank-canvas';
const serverPath = join(ROOT, 'server.js');

let src = readFileSync(serverPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Extract commissionStart & commissionEnd from req.query
const QUERY_ANCHOR = `    const { range, tillId } = req.query; // Get time range from query params`;
const QUERY_REPLACE = `    const { range, tillId, commissionStart, commissionEnd } = req.query; // Get time range from query params`;

if (!src.includes(QUERY_ANCHOR)) {
  console.error('❌ QUERY_ANCHOR not found');
  process.exit(1);
}
src = src.replace(QUERY_ANCHOR, QUERY_REPLACE);

// 2. Add commissionAnalytics computation right before `const analytics = {`
const ANALYTICS_ANCHOR = `    const analytics = {
      today: calculateStats(todayTransactions),`;

const COMMISSION_BLOCK = `    // ── Commission Earnings & Insights (10% of paid revenue) ────────────────
    const COMMISSION_RATE = 0.10;
    const summarizeCommission = (txs) => {
      const paid = (txs || []).filter(t => isPaidStatus(t.status));
      const revenue = paid.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      return {
        revenue,
        commission: Number((revenue * COMMISSION_RATE).toFixed(2)),
        txCount: paid.length,
      };
    };

    const allTimeSummary = summarizeCommission(txList);
    const todayComm = summarizeCommission(todayTransactions);
    const weekComm = summarizeCommission(weekTransactions);
    const monthComm = summarizeCommission(monthTransactions);
    const yearComm = summarizeCommission(yearTransactions);

    let customComm = null;
    let customStartObj = null;
    let customEndObj = null;
    if (commissionStart && commissionEnd) {
      const s = new Date(String(commissionStart) + 'T00:00:00');
      const e = new Date(String(commissionEnd) + 'T23:59:59.999');
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && s <= e) {
        customStartObj = s;
        customEndObj = new Date(e.getTime() + 1);
        const customTxs = txList.filter(tx => filterByWindow(tx, customStartObj, customEndObj));
        customComm = {
          ...summarizeCommission(customTxs),
          start: String(commissionStart),
          end: String(commissionEnd),
        };
      }
    }

    // Daily series (last 30 days, or custom window if provided)
    const commPad2 = (n) => String(n).padStart(2, '0');
    const commDateKey = (d) => \`\${d.getFullYear()}-\${commPad2(d.getMonth() + 1)}-\${commPad2(d.getDate())}\`;
    const seriesStart = customStartObj || new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() - 29);
    const seriesEnd = customEndObj || todayEnd;

    const dailyBuckets = [];
    const dailyLookup = new Map();
    const cursor = new Date(seriesStart.getFullYear(), seriesStart.getMonth(), seriesStart.getDate());
    let guard = 0;
    while (cursor < seriesEnd && guard < 366) {
      guard++;
      const key = commDateKey(cursor);
      const entry = {
        date: key,
        label: cursor.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
        revenue: 0,
        commission: 0,
        txCount: 0,
      };
      dailyBuckets.push(entry);
      dailyLookup.set(key, entry);
      cursor.setDate(cursor.getDate() + 1);
    }

    // Also build last 8 weeks & last 12 months
    const weeklyLookup = new Map();
    const monthlyLookup = new Map();
    const paidAll = txList.filter(t => isPaidStatus(t.status));

    paidAll.forEach(tx => {
      const d = getEffectiveTxDate(tx);
      if (isNaN(d.getTime())) return;
      const amt = Number(tx.amount || 0);
      const comm = amt * COMMISSION_RATE;

      const dKey = commDateKey(d);
      if (dailyLookup.has(dKey)) {
        const b = dailyLookup.get(dKey);
        b.revenue += amt;
        b.commission = Number((b.commission + comm).toFixed(2));
        b.txCount += 1;
      }

      // Week bucket (start of week Sunday)
      const wStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
      const wKey = commDateKey(wStart);
      if (!weeklyLookup.has(wKey)) {
        weeklyLookup.set(wKey, {
          week: wKey,
          label: 'Wk ' + wStart.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
          revenue: 0,
          commission: 0,
          txCount: 0,
        });
      }
      const wb = weeklyLookup.get(wKey);
      wb.revenue += amt;
      wb.commission = Number((wb.commission + comm).toFixed(2));
      wb.txCount += 1;

      // Month bucket
      const mKey = \`\${d.getFullYear()}-\${commPad2(d.getMonth() + 1)}\`;
      if (!monthlyLookup.has(mKey)) {
        monthlyLookup.set(mKey, {
          month: mKey,
          label: d.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' }),
          revenue: 0,
          commission: 0,
          txCount: 0,
        });
      }
      const mb = monthlyLookup.get(mKey);
      mb.revenue += amt;
      mb.commission = Number((mb.commission + comm).toFixed(2));
      mb.txCount += 1;
    });

    const weeklySeries = Array.from(weeklyLookup.values())
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8);

    const monthlySeries = Array.from(monthlyLookup.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    const activeDaily = dailyBuckets.filter(d => d.txCount > 0);
    const bestDay = activeDaily.length > 0
      ? [...activeDaily].sort((a, b) => b.commission - a.commission)[0]
      : null;
    const total30dComm = dailyBuckets.reduce((s, d) => s + d.commission, 0);
    const avgDailyCommission = dailyBuckets.length > 0 ? Number((total30dComm / dailyBuckets.length).toFixed(2)) : 0;
    const avgCommissionPerTx = allTimeSummary.txCount > 0
      ? Number((allTimeSummary.commission / allTimeSummary.txCount).toFixed(2))
      : 0;

    const commissionAnalytics = {
      rate: COMMISSION_RATE,
      today: todayComm,
      week: weekComm,
      month: monthComm,
      year: yearComm,
      allTime: allTimeSummary,
      custom: customComm,
      dailySeries: dailyBuckets,
      weeklySeries,
      monthlySeries,
      insights: {
        bestDay,
        avgDailyCommission,
        avgCommissionPerTx,
        activeDays: activeDaily.length,
        totalDaysInWindow: dailyBuckets.length,
      },
    };

    const analytics = {
      commissionAnalytics,
      today: calculateStats(todayTransactions),`;

if (!src.includes(ANALYTICS_ANCHOR)) {
  console.error('❌ ANALYTICS_ANCHOR not found');
  process.exit(1);
}
src = src.replace(ANALYTICS_ANCHOR, COMMISSION_BLOCK);

writeFileSync(serverPath, src, 'utf8');
console.log('✅ Added commissionAnalytics to /api/dashboard/analytics in server.js');
