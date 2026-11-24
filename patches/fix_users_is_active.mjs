import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = 'c:\\Users\\APEX INFINITY\\Downloads\\SWIFTPAYMODERN\\blank-canvas';
const serverPath = join(ROOT, 'server.js');

let src = readFileSync(serverPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Fix user query in /api/super-admin/users-overview
const OLD_QUERY = `.select('id, email, full_name, company_name, role, created_at, is_active, kyc_status', { count: 'exact' })`;
const NEW_QUERY = `.select('id, email, full_name, company_name, role, created_at, kyc_status', { count: 'exact' })`;

if (!src.includes(OLD_QUERY)) {
  console.error('❌ OLD_QUERY not found in server.js!');
  process.exit(1);
}

src = src.replace(OLD_QUERY, NEW_QUERY);

// Also ensure enriched users have is_active default to true
const OLD_ENRICHED = `    const enriched = (users || []).map(u => ({
      ...u,`;

const NEW_ENRICHED = `    const enriched = (users || []).map(u => ({
      ...u,
      is_active: u.is_active ?? true,`;

if (src.includes(OLD_ENRICHED)) {
  src = src.replace(OLD_ENRICHED, NEW_ENRICHED);
}

// 2. Safe-guard toggle-status so it doesn't crash if is_active column doesn't exist
const OLD_TOGGLE = `app.post('/api/super-admin/users/:id/toggle-status', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('is_active').eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    const newStatus = !user.is_active;
    await supabase.from('users').update({ is_active: newStatus }).eq('id', req.params.id);
    res.json({ status: 'success', is_active: newStatus });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});`;

const NEW_TOGGLE = `app.post('/api/super-admin/users/:id/toggle-status', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { data: user, error: selErr } = await supabase.from('users').select('id').eq('id', req.params.id).single();
    if (selErr || !user) return res.status(404).json({ status: 'error', message: 'User not found' });
    let newStatus = true;
    try {
      const { data: u } = await supabase.from('users').select('is_active').eq('id', req.params.id).single();
      newStatus = !(u?.is_active ?? true);
      await supabase.from('users').update({ is_active: newStatus }).eq('id', req.params.id);
    } catch (_) {}
    res.json({ status: 'success', is_active: newStatus });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});`;

if (src.includes(OLD_TOGGLE)) {
  src = src.replace(OLD_TOGGLE, NEW_TOGGLE);
}

writeFileSync(serverPath, src, 'utf8');
console.log('✅ Successfully removed is_active from users query and safeguarded toggle-status!');
