import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, BookOpen, Zap, Shield, Copy, Check, ExternalLink, Github, FileText, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DeveloperPortal() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("quickstart");
  const { toast } = useToast();

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const sections = [
    {
      id: "gettingstarted",
      title: "Getting Started",
      icon: BookOpen,
      description: "Complete step-by-step setup guide"
    },
    {
      id: "quickstart",
      title: "Quick Start",
      icon: Zap,
      description: "Get started in 5 minutes"
    },
    {
      id: "apikey",
      title: "Generate API Key",
      icon: Shield,
      description: "Create your unique API key"
    },
    {
      id: "database",
      title: "Database Schema",
      icon: FileText,
      description: "Transaction table structure"
    },
    {
      id: "integration",
      title: "Complete Integration",
      icon: Code2,
      description: "Full code example"
    },
    {
      id: "endpoints",
      title: "API Endpoints",
      icon: BookOpen,
      description: "All available endpoints"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden py-16 px-6 bg-gradient-to-b from-primary/10 to-transparent"
      >
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">
            SwiftPay Developer Guide
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, straightforward integration for M-Pesa payments
          </p>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-6xl mx-auto px-6 py-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
          {sections.map((section, index) => (
            <motion.button
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => setActiveSection(section.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left group ${
                activeSection === section.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <section.icon className={`h-5 w-5 ${
                  activeSection === section.id ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <ChevronRight className={`h-4 w-4 transition-transform ${
                  activeSection === section.id ? 'translate-x-1' : ''
                }`} />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{section.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Content Sections */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Getting Started - Complete Beginner Guide */}
          {activeSection === "gettingstarted" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary/5 to-safaricom/5 rounded-xl p-8 border border-primary/10">
                <h2 className="text-3xl font-bold text-foreground mb-2">Getting Started with SwiftPay</h2>
                <p className="text-muted-foreground mb-8">Complete guide from zero to accepting M-Pesa payments. No technical experience needed!</p>
                
                <div className="space-y-8">
                  {/* Step 1: Understand What You Need */}
                  <div className="border-l-4 border-primary pl-6 py-4">
                    <h3 className="text-xl font-bold text-foreground mb-3">Step 1: What You'll Need</h3>
                    <div className="bg-background/50 rounded-lg p-4 space-y-3 text-sm">
                      <div className="flex gap-3">
                        <span className="text-primary font-bold">✓</span>
                        <div>
                          <p className="font-semibold text-foreground">Supabase Account</p>
                          <p className="text-muted-foreground">Free database to store payment records. Sign up at supabase.com</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-primary font-bold">✓</span>
                        <div>
                          <p className="font-semibold text-foreground">Your Project Code</p>
                          <p className="text-muted-foreground">A React/Node.js project where you want to add payments</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-primary font-bold">✓</span>
                        <div>
                          <p className="font-semibold text-foreground">Till ID (We Provide This)</p>
                          <p className="text-muted-foreground">Unique identifier for your payment account: dbdedaea-11d8-4bbe-b94f-84bbe4206d3c</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Set Up Supabase */}
                  <div className="border-l-4 border-safaricom pl-6 py-4">
                    <h3 className="text-xl font-bold text-foreground mb-3">Step 2: Set Up Supabase Database</h3>
                    <div className="bg-background/50 rounded-lg p-4 space-y-3">
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Go to <code className="bg-primary/20 px-2 py-1 rounded text-xs">supabase.com</code> and create a free account</li>
                        <li>Create a new project (name it after your app)</li>
                        <li>Go to SQL Editor and run this query to create the transactions table:</li>
                      </ol>
                      <div className="bg-background rounded-lg p-3 border border-border/50 font-mono text-xs overflow-auto mt-3">
                        <pre className="text-foreground">{`CREATE TABLE transactions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  transaction_request_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`}</pre>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ That's it! Your database is ready</p>
                    </div>
                  </div>

                  {/* Step 3: Get Your API Key */}
                  <div className="border-l-4 border-blue-500 pl-6 py-4">
                    <h3 className="text-xl font-bold text-foreground mb-3">Step 3: Generate Your Unique API Key</h3>
                    <p className="text-sm text-muted-foreground mb-4">Call this endpoint once to get your API key (no login needed):</p>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50 font-mono text-xs overflow-auto">
                      <pre className="text-foreground">{`POST https://swiftpay-backend-uvv9.onrender.com/api/keys/generate

Request Body:
{
  "projectName": "my-awesome-app",
  "tillId": "dbdedaea-11d8-4bbe-b94f-84bbe4206d3c"
}

You'll get back:
{
  "status": "success",
  "data": {
    "apiKey": "my-awesome-app-key"
  }
}`}</pre>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">💾 Save this API key! You'll use it in your code.</p>
                  </div>

                  {/* Step 4: Add Supabase to Your Project */}
                  <div className="border-l-4 border-orange-500 pl-6 py-4">
                    <h3 className="text-xl font-bold text-foreground mb-3">Step 4: Install Supabase in Your Project</h3>
                    <p className="text-sm text-muted-foreground mb-3">Run this command in your project folder:</p>
                    <div className="bg-background/50 rounded-lg p-3 border border-border/50 font-mono text-xs">
                      <code className="text-foreground">npm install @supabase/supabase-js</code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Then add this to your code:</p>
                    <div className="bg-background/50 rounded-lg p-3 border border-border/50 font-mono text-xs overflow-auto mt-2">
                      <pre className="text-foreground">{`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_KEY'
);`}</pre>
                    </div>
                  </div>

                  {/* Step 5: Create Payment Endpoint */}
                  <div className="border-l-4 border-green-500 pl-6 py-4">
                    <h3 className="text-xl font-bold text-foreground mb-3">Step 5: Create Payment Endpoint</h3>
                    <p className="text-sm text-muted-foreground mb-3">Create a file <code className="bg-primary/20 px-2 py-1 rounded text-xs">api/initiate-payment.js</code>:</p>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50 font-mono text-xs overflow-auto">
                      <pre className="text-foreground">{`const SWIFTPAY_API_KEY = 'my-awesome-app-key';
const SWIFTPAY_TILL_ID = 'dbdedaea-11d8-4bbe-b94f-84bbe4206d3c';

export default async (req, res) => {
  const { phoneNumber, amount } = req.body;
  
  const response = await fetch(
    'https://swiftpay-backend-uvv9.onrender.com/api/mpesa/stk-push-api',
    {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${SWIFTPAY_API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        amount: amount,
        till_id: SWIFTPAY_TILL_ID
      })
    }
  );

  const data = await response.json();
  
  if (data.success) {
    const checkoutId = data.data.checkout_id;
    
    // Save to Supabase (ONLY 2 columns!)
    await supabase.from('transactions').insert({
      transaction_request_id: checkoutId,
      amount: parseFloat(amount)
    });
    
    return res.json({ success: true, checkoutId });
  }
  
  return res.json({ success: false, error: data.message });
};`}</pre>
                    </div>
                  </div>

                  {/* Step 6: Check Payment Status */}
                  <div className="border-l-4 border-purple-500 pl-6 py-4">
                    <h3 className="text-xl font-bold text-foreground mb-3">Step 6: Check Payment Status</h3>
                    <p className="text-sm text-muted-foreground mb-3">Create <code className="bg-primary/20 px-2 py-1 rounded text-xs">api/payment-status.js</code>:</p>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50 font-mono text-xs overflow-auto">
                      <pre className="text-foreground">{`export default async (req, res) => {
  const { reference } = req.query;
  
  const { data: transaction } = await supabase
    .from('transactions')
    .select('*')
    .eq('transaction_request_id', reference)
    .maybeSingle();
  
  if (transaction) {
    return res.json({
      success: true,
      payment: {
        status: transaction.status === 'success' ? 'SUCCESS' : 'PENDING'
      }
    });
  }
  
  return res.json({
    success: true,
    payment: { status: 'PENDING' }
  });
};`}</pre>
                    </div>
                  </div>

                  {/* Step 7: Frontend Integration */}
                  <div className="border-l-4 border-red-500 pl-6 py-4">
                    <h3 className="text-xl font-bold text-foreground mb-3">Step 7: Add Payment Button to Your UI</h3>
                    <p className="text-sm text-muted-foreground mb-3">In your React component:</p>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50 font-mono text-xs overflow-auto">
                      <pre className="text-foreground">{`const handlePayment = async () => {
  // 1. Call your endpoint to initiate payment
  const response = await fetch('/api/initiate-payment', {
    method: 'POST',
    body: JSON.stringify({
      phoneNumber: '254712345678',
      amount: 100
    })
  });
  
  const result = await response.json();
  const checkoutId = result.checkoutId;
  
  // 2. Poll for payment status
  const interval = setInterval(async () => {
    const statusResponse = await fetch(
      \`/api/payment-status?reference=\${checkoutId}\`
    );
    const statusResult = await statusResponse.json();
    
    if (statusResult.payment.status === 'SUCCESS') {
      clearInterval(interval);
      // Show success screen!
      showSuccessModal();
    }
  }, 2000); // Check every 2 seconds
};

return (
  <button onClick={handlePayment}>
    Pay 100 KES
  </button>
);`}</pre>
                    </div>
                  </div>

                  {/* Step 8: Test */}
                  <div className="border-l-4 border-yellow-500 pl-6 py-4">
                    <h3 className="text-xl font-bold text-foreground mb-3">Step 8: Test Your Integration</h3>
                    <div className="bg-background/50 rounded-lg p-4 space-y-3 text-sm">
                      <div className="flex gap-3">
                        <span className="text-yellow-500 font-bold">1.</span>
                        <p>Click your "Pay" button</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-yellow-500 font-bold">2.</span>
                        <p>You should see an M-Pesa STK prompt on your phone</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-yellow-500 font-bold">3.</span>
                        <p>Enter your M-Pesa PIN to complete payment</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-yellow-500 font-bold">4.</span>
                        <p>Your success screen should appear automatically</p>
                      </div>
                    </div>
                  </div>

                  {/* Troubleshooting */}
                  <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      Common Issues
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><strong>Database error?</strong> Make sure you only insert 2 columns: transaction_request_id and amount</li>
                      <li><strong>API key not working?</strong> Copy it exactly from the response. It should end with "-key"</li>
                      <li><strong>STK not appearing?</strong> Check phone number format (must be 254XXXXXXXXX)</li>
                      <li><strong>Payment stuck on pending?</strong> It takes 10-30 seconds to confirm. Keep polling!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Start */}
          {activeSection === "quickstart" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary/5 to-safaricom/5 rounded-xl p-8 border border-primary/10">
                <h2 className="text-3xl font-bold text-foreground mb-6">Quick Start (5 Minutes)</h2>
                
                <div className="space-y-6">
                  {[
                    {
                      step: 1,
                      title: "Generate API Key",
                      desc: "Call the self-service endpoint to get your unique API key",
                      code: `POST https://swiftpay-backend-uvv9.onrender.com/api/keys/generate

{
  "projectName": "my-project",
  "tillId": "dbdedaea-11d8-4bbe-b94f-84bbe4206d3c"
}`
                    },
                    {
                      step: 2,
                      title: "Copy Your API Key",
                      desc: "You'll receive: my-project-key",
                      code: `const SWIFTPAY_API_KEY = 'my-project-key';`
                    },
                    {
                      step: 3,
                      title: "Initiate Payment",
                      desc: "Send STK Push to user's phone",
                      code: `const response = await fetch(
  'https://swiftpay-backend-uvv9.onrender.com/api/mpesa/stk-push-api',
  {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${SWIFTPAY_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone_number: '254712345678',
      amount: 100,
      till_id: 'dbdedaea-11d8-4bbe-b94f-84bbe4206d3c'
    })
  }
);`
                    },
                    {
                      step: 4,
                      title: "Store Transaction",
                      desc: "Save to Supabase (IMPORTANT: Only 2 columns)",
                      code: `const { error } = await supabase
  .from('transactions')
  .insert({
    transaction_request_id: checkoutId,
    amount: parseFloat(amount)
  });`
                    },
                    {
                      step: 5,
                      title: "Check Payment Status",
                      desc: "Poll for payment confirmation",
                      code: `const response = await fetch(
  \`/api/payment-status?reference=\${checkoutId}\`
);
const result = await response.json();
if (result.payment.status === 'SUCCESS') {
  // Show success screen
}`
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold">
                          {item.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                        <div className="bg-background/50 rounded-lg p-3 border border-border/50 overflow-auto">
                          <code className="text-xs font-mono text-foreground">{item.code}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* API Key Generation */}
          {activeSection === "apikey" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-safaricom/5 to-primary/5 rounded-xl p-8 border border-safaricom/10">
                <h2 className="text-3xl font-bold text-foreground mb-6">Generate Your API Key</h2>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Endpoint</h3>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                      <code className="text-sm font-mono text-primary">POST /api/keys/generate</code>
                      <p className="text-xs text-muted-foreground mt-2">Base URL: https://swiftpay-backend-uvv9.onrender.com</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Request Body</h3>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50 font-mono text-xs overflow-auto">
                      <pre className="text-foreground">{`{
  "projectName": "naivasmpya",
  "tillId": "dbdedaea-11d8-4bbe-b94f-84bbe4206d3c",
  "email": "optional@email.com"
}`}</pre>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Response</h3>
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50 font-mono text-xs overflow-auto">
                    <pre className="text-foreground">{`{
  "status": "success",
  "data": {
    "projectName": "naivasmpya",
    "apiKey": "naivasmpya-key",
    "apiSecret": "secret_xxxxx",
    "tillId": "dbdedaea-11d8-4bbe-b94f-84bbe4206d3c",
    "instructions": "Use in your code: const SWIFTPAY_API_KEY = 'naivasmpya-key';"
  }
}`}</pre>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">No Authentication Required</p>
                      <p className="text-sm text-green-800 dark:text-green-200 mt-1">Anyone can generate an API key instantly without creating an account</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database Schema */}
          {activeSection === "database" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-xl p-8 border border-red-500/10">
                <h2 className="text-3xl font-bold text-foreground mb-6">Database Schema - Transactions</h2>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Correct Columns
                    </h3>
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 space-y-4">
                      <div>
                        <code className="text-xs font-mono bg-background/50 px-2 py-1 rounded text-primary">transaction_request_id</code>
                        <p className="text-xs text-muted-foreground mt-2">The checkout ID from SwiftPay response (string)</p>
                      </div>
                      <div>
                        <code className="text-xs font-mono bg-background/50 px-2 py-1 rounded text-primary">amount</code>
                        <p className="text-xs text-muted-foreground mt-2">Payment amount as number (e.g., 100, 139, 129)</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      Do NOT Use
                    </h3>
                    <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        <li>❌ description</li>
                        <li>❌ phone</li>
                        <li>❌ reference</li>
                        <li>❌ status</li>
                        <li>❌ payment_provider</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                  <p className="text-sm font-semibold text-foreground mb-3">✅ Correct Insert Code:</p>
                  <code className="text-xs font-mono text-foreground block overflow-auto">{`const { error } = await supabase
  .from('transactions')
  .insert({
    transaction_request_id: checkoutId,
    amount: parseFloat(amount)
  });`}</code>
                </div>
              </div>
            </div>
          )}

          {/* Complete Integration */}
          {activeSection === "integration" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary/5 to-safaricom/5 rounded-xl p-8 border border-primary/10">
                <h2 className="text-3xl font-bold text-foreground mb-6">Complete Node.js Integration</h2>
                
                <div className="bg-background/50 rounded-lg p-4 border border-border/50 overflow-auto">
                  <code className="text-xs font-mono text-foreground whitespace-pre-wrap">{`const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const SWIFTPAY_API_KEY = 'your-api-key';
const SWIFTPAY_BACKEND_URL = 'https://swiftpay-backend-uvv9.onrender.com';
const SWIFTPAY_TILL_ID = 'dbdedaea-11d8-4bbe-b94f-84bbe4206d3c';

const supabase = createClient(
  'https://your-supabase-url.supabase.co',
  'your-supabase-key'
);

async function initiatePayment(phoneNumber, amount) {
  try {
    // 1. Call SwiftPay STK Push API
    const response = await axios.post(
      \`\${SWIFTPAY_BACKEND_URL}/api/mpesa/stk-push-api\`,
      {
        phone_number: phoneNumber,
        amount: amount,
        till_id: SWIFTPAY_TILL_ID
      },
      {
        headers: {
          'Authorization': \`Bearer \${SWIFTPAY_API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      const checkoutId = response.data.data.checkout_id;
      
      // 2. Store transaction (ONLY 2 columns!)
      const { error: dbError } = await supabase
        .from('transactions')
        .insert({
          transaction_request_id: checkoutId,
          amount: parseFloat(amount)
        });

      if (dbError) {
        console.error('DB error:', dbError.message);
      }

      // 3. Return checkout ID for polling
      return {
        success: true,
        checkoutId: checkoutId
      };
    }
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Usage
initiatePayment('254712345678', 100);`}</code>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">💡 Key Points:</p>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                    <li>✓ Only insert 2 columns: transaction_request_id and amount</li>
                    <li>✓ Use parseFloat() for amount</li>
                    <li>✓ Extract checkout_id from response.data.data.checkout_id</li>
                    <li>✓ Continue even if database insert fails (payment was initiated)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* API Endpoints */}
          {activeSection === "endpoints" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary/5 to-safaricom/5 rounded-xl p-8 border border-primary/10">
                <h2 className="text-3xl font-bold text-foreground mb-6">API Endpoints</h2>
                
                <div className="space-y-4">
                  {[
                    {
                      method: "POST",
                      path: "/api/keys/generate",
                      desc: "Generate API key (no auth required)",
                      color: "bg-green-500"
                    },
                    {
                      method: "POST",
                      path: "/api/mpesa/stk-push-api",
                      desc: "Initiate M-Pesa STK Push",
                      color: "bg-green-500"
                    },
                    {
                      method: "GET",
                      path: "/api/payment-status",
                      desc: "Check payment status",
                      color: "bg-blue-500"
                    },
                    {
                      method: "POST",
                      path: "/api/mpesa-verification-proxy",
                      desc: "Verify M-Pesa payment (secure proxy)",
                      color: "bg-green-500"
                    }
                  ].map((endpoint, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border/50">
                      <span className={`px-3 py-1 rounded text-xs font-bold text-white ${endpoint.color}`}>
                        {endpoint.method}
                      </span>
                      <div className="flex-1">
                        <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                        <p className="text-xs text-muted-foreground mt-1">{endpoint.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-6xl mx-auto px-6 py-16 text-center"
      >
        <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-8">
          Start with "Quick Start" or "Generate API Key" above
        </p>
        <Button variant="glow" size="lg">
          <BookOpen className="h-5 w-5 mr-2" />
          View Full Documentation
        </Button>
      </motion.div>
    </div>
  );
}
