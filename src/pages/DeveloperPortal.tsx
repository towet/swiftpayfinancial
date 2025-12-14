import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, BookOpen, Zap, Shield, Copy, Check, ExternalLink, Github, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DeveloperPortal() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
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

  const codeExamples = [
    {
      id: "nodejs",
      language: "Node.js",
      code: `const axios = require('axios');

const apiKey = 'your_api_key_here';
const baseURL = 'http://localhost:5000/api';

// STK Push Request
async function initiatePayment() {
  try {
    const response = await axios.post(
      \`\${baseURL}/mpesa/stk-push-api\`,
      {
        phone_number: '254712345678',
        amount: 100,
        till_id: 'your_till_id',
        reference: 'ORDER123',
        description: 'Payment for order'
      },
      {
        headers: {
          'Authorization': \`Bearer \${apiKey}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Payment initiated:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data);
  }
}

initiatePayment();`
    },
    {
      id: "python",
      language: "Python",
      code: `import requests
import json

api_key = 'your_api_key_here'
base_url = 'http://localhost:5000/api'

def initiate_payment():
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'phone_number': '254712345678',
        'amount': 100,
        'till_id': 'your_till_id',
        'reference': 'ORDER123',
        'description': 'Payment for order'
    }
    
    try:
        response = requests.post(
            f'{base_url}/mpesa/stk-push-api',
            headers=headers,
            json=payload
        )
        print('Payment initiated:', response.json())
    except requests.exceptions.RequestException as e:
        print('Error:', str(e))

if __name__ == '__main__':
    initiate_payment()`
    },
    {
      id: "php",
      language: "PHP",
      code: `<?php
$apiKey = 'your_api_key_here';
$baseURL = 'http://localhost:5000/api';

function initiatePayment() {
    global $apiKey, $baseURL;
    
    $headers = [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ];
    
    $payload = [
        'phone_number' => '254712345678',
        'amount' => 100,
        'till_id' => 'your_till_id',
        'reference' => 'ORDER123',
        'description' => 'Payment for order'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseURL . '/mpesa/stk-push-api');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    echo 'Payment initiated: ' . $response;
}

initiatePayment();
?>`
    },
    {
      id: "javascript",
      language: "JavaScript (Browser)",
      code: `const apiKey = 'your_api_key_here';
const baseURL = 'http://localhost:5000/api';

async function initiatePayment() {
  try {
    const response = await fetch(
      \`\${baseURL}/mpesa/stk-push-api\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${apiKey}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_number: '254712345678',
          amount: 100,
          till_id: 'your_till_id',
          reference: 'ORDER123',
          description: 'Payment for order'
        })
      }
    );
    
    const data = await response.json();
    console.log('Payment initiated:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

initiatePayment();`
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant payment processing with real-time updates"
    },
    {
      icon: Shield,
      title: "Secure",
      description: "Bank-level security with JWT and API key authentication"
    },
    {
      icon: Code2,
      title: "Easy Integration",
      description: "Simple REST API with comprehensive documentation"
    },
    {
      icon: BookOpen,
      title: "Well Documented",
      description: "Complete guides and examples in multiple languages"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden py-20 px-6"
      >
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Code2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Developer Portal</span>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-6">
            Build with SwiftPay
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Integrate M-Pesa payments into your application with our powerful and easy-to-use API
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="glow" size="lg">
              <BookOpen className="h-5 w-5 mr-2" />
              Read Documentation
            </Button>
            <Button variant="outline" size="lg">
              <Github className="h-5 w-5 mr-2" />
              View Examples
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-6xl mx-auto px-6 py-16"
      >
        <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Why Choose SwiftPay?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="glass rounded-xl p-6 text-center hover:border-primary/30 transition-all"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-lg gradient-primary">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Start */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-6xl mx-auto px-6 py-16"
      >
        <h2 className="text-3xl font-bold text-foreground mb-12">Quick Start</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Steps */}
          <div className="space-y-6">
            {[
              { step: 1, title: "Create Account", desc: "Sign up and create your developer account" },
              { step: 2, title: "Create a Till", desc: "Set up a payment till in your dashboard" },
              { step: 3, title: "Generate API Key", desc: "Create an API key for your till" },
              { step: 4, title: "Start Integrating", desc: "Use our API to accept payments" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg gradient-primary">
                    <span className="text-primary-foreground font-bold">{item.step}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Code Example */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl p-6 h-fit"
          >
            <h3 className="font-semibold text-foreground mb-4">Example Request</h3>
            <div className="bg-secondary rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-foreground font-mono">
{`curl -X POST \\
  http://localhost:5000/api/mpesa/stk-push-api \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "phone_number": "254712345678",
    "amount": 100,
    "till_id": "your_till_id",
    "reference": "ORDER123",
    "description": "Payment"
  }'`}
              </pre>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Code Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-6xl mx-auto px-6 py-16"
      >
        <h2 className="text-3xl font-bold text-foreground mb-12">Code Examples</h2>
        
        <div className="space-y-8">
          {codeExamples.map((example, index) => (
            <motion.div
              key={example.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="glass rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="font-semibold text-foreground">{example.language}</h3>
                <button
                  onClick={() => copyToClipboard(example.code, example.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  {copiedCode === example.id ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-secondary p-6 overflow-x-auto">
                <pre className="text-sm text-foreground font-mono whitespace-pre-wrap break-words">
                  {example.code}
                </pre>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* API Endpoints */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="max-w-6xl mx-auto px-6 py-16"
      >
        <h2 className="text-3xl font-bold text-foreground mb-12">Core API Endpoints</h2>
        
        <div className="space-y-4">
          {[
            { method: "POST", path: "/api/auth/register", desc: "Register a new user account" },
            { method: "POST", path: "/api/auth/login", desc: "Login to your account" },
            { method: "GET", path: "/api/tills", desc: "Get all your tills" },
            { method: "POST", path: "/api/tills", desc: "Create a new till" },
            { method: "PUT", path: "/api/tills/:id", desc: "Update a till" },
            { method: "DELETE", path: "/api/tills/:id", desc: "Delete a till" },
            { method: "GET", path: "/api/keys", desc: "Get all API keys" },
            { method: "POST", path: "/api/keys", desc: "Generate new API key" },
            { method: "DELETE", path: "/api/keys/:id", desc: "Delete API key" },
            { method: "POST", path: "/api/mpesa/stk-push-api", desc: "Initiate STK Push payment" },
            { method: "GET", path: "/api/transactions", desc: "Get transaction history" },
            { method: "GET", path: "/api/dashboard/stats", desc: "Get dashboard statistics" }
          ].map((endpoint, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.05 }}
              className="glass rounded-lg p-4 flex items-center justify-between hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <span className={`px-3 py-1 rounded text-xs font-bold text-white ${
                  endpoint.method === 'GET' ? 'bg-blue-500' :
                  endpoint.method === 'POST' ? 'bg-green-500' :
                  endpoint.method === 'PUT' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {endpoint.method}
                </span>
                <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
              </div>
              <p className="text-sm text-muted-foreground text-right">{endpoint.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="max-w-6xl mx-auto px-6 py-16"
      >
        <h2 className="text-3xl font-bold text-foreground mb-12">Resources</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: FileText, title: "API Reference", desc: "Complete API documentation" },
            { icon: BookOpen, title: "Integration Guide", desc: "Step-by-step integration guide" },
            { icon: Github, title: "Code Examples", desc: "Ready-to-use code samples" }
          ].map((resource, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + index * 0.1 }}
              className="glass rounded-xl p-6 hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg gradient-primary group-hover:scale-110 transition-transform">
                  <resource.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{resource.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{resource.desc}</p>
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                Learn more <ExternalLink className="h-4 w-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="max-w-4xl mx-auto px-6 py-20 text-center"
      >
        <h2 className="text-3xl font-bold text-foreground mb-6">Ready to Get Started?</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join thousands of developers building payment solutions with SwiftPay
        </p>
        <Button variant="glow" size="lg">
          Create Your First Till
        </Button>
      </motion.div>
    </div>
  );
}
