import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

async function createSuperAdmin() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  const email = 'franklintowett@gmail.com';
  const password = '@Frank18498';

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  console.log('Creating super admin account...');
  console.log('Email:', email);
  console.log('Password Hash:', passwordHash);

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', email)
    .single();

  if (existingUser) {
    console.log('\nUser already exists! Updating role to super_admin...');

    const { data, error } = await supabase
      .from('users')
      .update({
        role: 'super_admin',
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return;
    }

    console.log('\n✅ User updated successfully!');
    console.log('ID:', data.id);
    console.log('Email:', data.email);
    console.log('Role:', data.role);
  } else {
    console.log('\nCreating new user...');

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: crypto.randomUUID(),
        email,
        password_hash: passwordHash,
        full_name: 'Super Admin',
        company_name: 'SwiftPay',
        role: 'super_admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    console.log('\n✅ Super admin account created successfully!');
    console.log('ID:', data.id);
    console.log('Email:', data.email);
    console.log('Role:', data.role);
  }

  console.log('\n🎉 You can now login with:');
  console.log('   Email: franklintowett@gmail.com');
  console.log('   Password: @Frank18498');
  console.log('\nThen access the Super Admin Dashboard at: /dashboard/super-admin');
}

createSuperAdmin().catch(console.error);
