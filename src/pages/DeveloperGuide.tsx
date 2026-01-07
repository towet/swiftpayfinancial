import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, Check, ArrowRight, Zap, Shield, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DeveloperGuide() {
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

  const steps = [
    {
      number: 1,
      title: "Create Your Account",
      description: "Sign up for a free SwiftPay developer account",
      details: [
        "Visit the signup page",
        "Enter your email and password",
        "Verify your email address",
        "Complete your profile"
      ]
    },
    {
      number: 2,
      title: "Create Your First Till",
      description: "Set up a payment till to receive payments",
      details: [
        "Go to Payment Accounts",
        "Click 'Add New Till'",
        "Enter till name and number",
        "Copy your Till ID for later use"
      ]
    },
    {
      number: 3,
      title: "Generate API Key",
      description: "Create an API key for your till",
      details: [
        "Go to API Keys section",
        "Click 'Generate New Key'",
        "Select your till",
        "Copy and save your API key securely"
      ]
    },
    {
      number: 4,
      title: "Integrate into Your App",
      description: "Use the API to accept payments",
      details: [
        "Choose your programming language",
        "Follow the code examples",
        "Test with sandbox credentials",
        "Deploy to production"
      ]
    }
  ];

  const integrationExamples = [
    {
      id: "nodejs-express",
      title: "Node.js + Express",
      description: "Backend payment integration",
      code: `const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const API_KEY = process.env.SWIFTPAY_API_KEY;
const API_URL = 'http://localhost:5000/api';

app.post('/api/pay', async (req, res) => {
  try {
    const { phoneNumber, amount, orderId } = req.body;
    
    const response = await axios.post(
      \`\${API_URL}/mpesa/stk-push-api\`,
      {
        phone_number: phoneNumber,
        amount: amount,
        till_id: process.env.TILL_ID,
        reference: orderId,
        description: 'Order payment'
      },
      {
        headers: {
          'Authorization': \`Bearer \${API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json({
      success: true,
      checkoutRequestId: response.data.checkoutRequestId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`
    },
    {
      id: "react-frontend",
      title: "React Frontend",
      description: "Client-side payment integration",
      code: `import axios from 'axios';
import { useState } from 'react';

export function PaymentForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const response = await axios.post('/api/pay', {
        phoneNumber: formData.get('phone'),
        amount: formData.get('amount'),
        orderId: formData.get('orderId')
      });

      if (response.data.success) {
        alert('Payment initiated! Check your phone for prompt');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <input
        type="tel"
        name="phone"
        placeholder="254712345678"
        required
      />
      <input
        type="number"
        name="amount"
        placeholder="Amount"
        required
      />
      <input
        type="text"
        name="orderId"
        placeholder="Order ID"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}`
    },
    {
      id: "python-flask",
      title: "Python + Flask",
      description: "Flask backend integration",
      code: `from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

API_KEY = os.getenv('SWIFTPAY_API_KEY')
TILL_ID = os.getenv('TILL_ID')
API_URL = 'http://localhost:5000/api'

@app.route('/api/pay', methods=['POST'])
def initiate_payment():
    try:
        data = request.json
        
        headers = {
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'phone_number': data['phone_number'],
            'amount': data['amount'],
            'till_id': TILL_ID,
            'reference': data['order_id'],
            'description': 'Order payment'
        }
        
        response = requests.post(
            f'{API_URL}/mpesa/stk-push-api',
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            return jsonify({
                'success': True,
                'data': response.json()
            })
        else:
            return jsonify({
                'success': False,
                'error': response.json()
            }), response.status_code
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)`
    }
  ];

  const bestPractices = [
    {
      category: "Security",
      icon: Shield,
      tips: [
        "Never hardcode API keys in your code",
        "Use environment variables for sensitive data",
        "Always validate user input on the backend",
        "Implement HTTPS in production",
        "Rotate API keys periodically",
        "Monitor API usage for suspicious activity"
      ]
    },
    {
      category: "Performance",
      icon: Zap,
      tips: [
        "Cache API responses when appropriate",
        "Implement request timeouts",
        "Use connection pooling for databases",
        "Optimize database queries",
        "Implement rate limiting",
        "Monitor API response times"
      ]
    },
    {
      category: "Development",
      icon: Code2,
      tips: [
        "Test with sandbox credentials first",
        "Implement comprehensive error handling",
        "Log all API requests and responses",
        "Use version control for your code",
        "Write unit tests for payment logic",
        "Document your integration thoroughly"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden py-20 px-6"
      >
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold gradient-text mb-6">Integration Guide</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Get your payment integration up and running in minutes
          </p>
        </div>
      </motion.div>

      {/* Step-by-Step Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-4xl mx-auto px-6 py-16"
      >
        <h2 className="text-3xl font-bold text-foreground mb-12">Getting Started</h2>
        
        <div className="space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="glass rounded-xl p-8"
            >
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg gradient-primary">
                    <span className="text-primary-foreground font-bold text-lg">{step.number}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Code Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-4xl mx-auto px-6 py-16"
      >
        <h2 className="text-3xl font-bold text-foreground mb-12">Integration Examples</h2>
        
        <div className="space-y-8">
          {integrationExamples.map((example, index) => (
            <motion.div
              key={example.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="glass rounded-xl overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <h3 className="text-xl font-bold text-foreground mb-2">{example.title}</h3>
                <p className="text-muted-foreground">{example.description}</p>
              </div>
              <div className="p-6 bg-secondary">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-muted-foreground">Code Example</span>
                  <button
                    onClick={() => copyToClipboard(example.code, example.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    {copiedCode === example.id ? (
                      <>
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-xs text-success">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-sm text-foreground font-mono overflow-x-auto">
                  {example.code}
                </pre>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-4xl mx-auto px-6 py-16"
      >
        <h2 className="text-3xl font-bold text-foreground mb-12">Best Practices</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {bestPractices.map((practice, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg gradient-primary">
                  <practice.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-foreground">{practice.category}</h3>
              </div>
              <ul className="space-y-3">
                {practice.tips.map((tip, tipIndex) => (
                  <li key={tipIndex} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Testing Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="max-w-4xl mx-auto px-6 py-16"
      >
        <div className="glass rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Testing Your Integration</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Test Phone Numbers</h3>
              <div className="bg-secondary rounded-lg p-4">
                <code className="text-sm text-foreground font-mono">254712345678</code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Use this test number for sandbox testing</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Test Amounts</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Minimum: 1 KES</li>
                <li>• Maximum: 150,000 KES</li>
                <li>• Recommended for testing: 100 KES</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Expected Response</h3>
              <div className="bg-secondary rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-foreground font-mono">{`{
  "status": "success",
  "message": "STK Push sent successfully",
  "checkoutRequestId": "ws_CO_13012021095000000001",
  "responseCode": "0",
  "responseDescription": "Success"
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="max-w-4xl mx-auto px-6 py-20 text-center"
      >
        <h2 className="text-3xl font-bold text-foreground mb-6">Ready to Integrate?</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Start accepting payments in your application today
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button variant="glow" size="lg">
            Go to Dashboard
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button variant="outline" size="lg">
            View API Docs
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
