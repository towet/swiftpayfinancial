import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Copy, Check, Play, ArrowRight, ChevronDown, ChevronUp,
  Zap, Shield, Code2, Rocket, BookOpen, Terminal, CreditCard,
  Smartphone, CheckCircle2, AlertCircle, Sparkles, Globe,
  Database, Key, UserPlus, Settings, Layers, RefreshCw, ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DeveloperPortal() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("quickstart");
  const [searchQuery, setSearchQuery] = useState("");
  const [wizardStep, setWizardStep] = useState(0);
  const [playgroundData, setPlaygroundData] = useState({
    apiKey: "",
    tillId: "",
    phoneNumber: "",
    amount: "100",
    reference: "TEST-ORDER"
  });
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedCodeSample, setSelectedCodeSample] = useState("button");
  const [codeTestMode, setCodeTestMode] = useState(false);
  const [codeTestCredentials, setCodeTestCredentials] = useState({
    apiKey: "",
    tillId: "",
    phoneNumber: "",
    amount: "100"
  });
  const [codeTestResult, setCodeTestResult] = useState<any>(null);
  const [codeTestLoading, setCodeTestLoading] = useState(false);
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

  const testPlayground = async () => {
    setPlaygroundLoading(true);
    setPlaygroundResult(null);

    try {
      const response = await fetch('https://swiftpay-backend-uvv9.onrender.com/api/mpesa/stk-push-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${playgroundData.apiKey}`,
        },
        body: JSON.stringify({
          phone_number: playgroundData.phoneNumber,
          amount: parseFloat(playgroundData.amount),
          till_id: playgroundData.tillId,
          reference: playgroundData.reference
        }),
      });

      const data = await response.json();
      setPlaygroundResult(data);
    } catch (error) {
      setPlaygroundResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to API'
      });
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const testCodeSample = async () => {
    setCodeTestLoading(true);
    setCodeTestResult(null);

    try {
      const response = await fetch('https://swiftpay-backend-uvv9.onrender.com/api/mpesa/stk-push-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${codeTestCredentials.apiKey}`,
        },
        body: JSON.stringify({
          phone_number: codeTestCredentials.phoneNumber,
          amount: parseFloat(codeTestCredentials.amount),
          till_id: codeTestCredentials.tillId,
          reference: `CODE-TEST-${Date.now()}`
        }),
      });

      const data = await response.json();
      setCodeTestResult(data);
      toast({
        title: data.success || data.status === 'success' ? "Payment Initiated!" : "Payment Failed",
        description: data.success || data.status === 'success' 
          ? "Check your phone for the STK push prompt" 
          : data.message || data.error || "Failed to initiate payment",
      });
    } catch (error) {
      setCodeTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to API'
      });
      toast({
        title: "Error",
        description: "Failed to connect to the API",
      });
    } finally {
      setCodeTestLoading(false);
    }
  };

  const normalizePhoneNumber = (phone: string) => {
    if (!phone) return phone;
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    return cleaned;
  };

  const wizardSteps = [
    {
      id: "account",
      title: "Create Account",
      icon: UserPlus,
      description: "Sign up for a SwiftPay account to get started",
      code: `// Step 1: Create your account
// Visit: https://swiftpay.com/register
// Fill in your details:
// - Email address
// - Password
// - Full name
// - Company name (optional)

// After registration, you'll receive a confirmation email
// Click the link to verify your account`
    },
    {
      id: "till",
      title: "Create Till",
      icon: CreditCard,
      description: "Create a payment till to receive payments",
      code: `// Step 2: Create a Till
// After logging in, navigate to Dashboard → Tills
// Click "Create New Till"
// Fill in:
// - Till Name: "Main Store"
// - Till Number: Your M-Pesa till number
// - Description: "Primary payment till"

// You'll receive a Till ID like:
// dbdedaea-11d8-4bbe-b94f-84bbe4206d3c
// Save this Till ID safely!`
    },
    {
      id: "apikey",
      title: "Generate API Key",
      icon: Key,
      description: "Generate an API key for your integration",
      code: `// Step 3: Generate API Key
// Navigate to Dashboard → API Keys
// Click "Generate New Key"
// Fill in:
// - Key Name: "My App"
// - Till ID: Select your till

// You'll receive:
// API Key: myapp-key
// API Secret: secret_xxxxx

// Store these securely in your environment variables
// Never commit them to version control!`
    },
    {
      id: "integrate",
      title: "Integrate",
      icon: Code2,
      description: "Add SwiftPay to your application",
      code: `// Step 4: Integrate SwiftPay
// Add your credentials to your app:

const SWIFTPAY_API_KEY = 'your-api-key';
const SWIFTPAY_TILL_ID = 'your-till-id';
const SWIFTPAY_BACKEND_URL = 'https://swiftpay-backend-uvv9.onrender.com';

// Use the code samples below to add payment functionality
// to your website or application`
    }
  ];

  const codeSamples = {
    button: {
      title: "Quick Payment Button",
      description: "A simple button to initiate payments",
      language: "javascript",
      code: `// Add this to your HTML/React component
<button onclick="initiatePayment()">
  Pay with M-Pesa
</button>

<script>
async function initiatePayment() {
  const SWIFTPAY_API_KEY = 'your-api-key';
  const SWIFTPAY_TILL_ID = 'your-till-id';
  const SWIFTPAY_BACKEND_URL = 'https://swiftpay-backend-uvv9.onrender.com';
  
  const phoneNumber = prompt('Enter phone number (2547XXXXXXXX):');
  const amount = 100; // Your amount
  
  try {
    const response = await fetch(\`\${SWIFTPAY_BACKEND_URL}/api/mpesa/stk-push-api\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${SWIFTPAY_API_KEY}\`
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        amount: amount,
        till_id: SWIFTPAY_TILL_ID,
        reference: 'ORDER-' + Date.now()
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Payment initiated! Check your phone for the STK push prompt.');
      console.log('Checkout ID:', result.data.checkout_id);
    } else {
      alert('Payment failed: ' + result.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
</script>`
    },
    checkout: {
      title: "Full Checkout Page",
      description: "Complete payment checkout form",
      language: "javascript",
      code: `// Complete checkout page implementation
import React, { useState } from 'react';

function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const SWIFTPAY_API_KEY = 'your-api-key';
  const SWIFTPAY_TILL_ID = 'your-till-id';
  const SWIFTPAY_BACKEND_URL = 'https://swiftpay-backend-uvv9.onrender.com';
  
  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const phoneNumber = formData.get('phone');
    const amount = formData.get('amount');
    
    try {
      const response = await fetch(\`\${SWIFTPAY_BACKEND_URL}/api/mpesa/stk-push-api\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${SWIFTPAY_API_KEY}\`
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          amount: parseFloat(amount),
          till_id: SWIFTPAY_TILL_ID,
          reference: 'ORDER-' + Date.now(),
          description: 'Payment for order'
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
      
      <form onSubmit={handlePayment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            placeholder="254712345678"
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Amount (KES)
          </label>
          <input
            type="number"
            name="amount"
            defaultValue="100"
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
      
      {result && (
        <div className={\`mt-4 p-4 rounded-lg \${result.success ? 'bg-green-50' : 'bg-red-50'}\`}>
          {result.success ? (
            <p className="text-green-800">
              ✓ Payment initiated! Check your phone for STK push prompt.
              <br />
              <small>Checkout ID: {result.data?.checkout_id}</small>
            </p>
          ) : (
            <p className="text-red-800">
              ✗ Payment failed: {result.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default CheckoutPage;`
    },
    nodejs: {
      title: "Node.js Backend",
      description: "Server-side integration with Express",
      language: "javascript",
      code: `// server.js - Express backend integration
const express = require('express');
const app = express();
app.use(express.json());

// SwiftPay Configuration
const SWIFTPAY_API_KEY = process.env.SWIFTPAY_API_KEY;
const SWIFTPAY_TILL_ID = process.env.SWIFTPAY_TILL_ID;
const SWIFTPAY_BACKEND_URL = process.env.SWIFTPAY_BACKEND_URL || 'https://swiftpay-backend-uvv9.onrender.com';

// Normalize phone number to 254 format
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[\\s\\-\\(\\)]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  if (cleaned.length !== 12 || !/^\\d+$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

// Initiate payment endpoint
app.post('/api/payment/initiate', async (req, res) => {
  try {
    const { phoneNumber, amount, reference, description } = req.body;
    
    if (!phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and amount are required'
      });
    }
    
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Use 2547XXXXXXXXX'
      });
    }
    
    const response = await fetch(\`\${SWIFTPAY_BACKEND_URL}/api/mpesa/stk-push-api\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${SWIFTPAY_API_KEY}\`
      },
      body: JSON.stringify({
        phone_number: normalizedPhone,
        amount: parseFloat(amount),
        till_id: SWIFTPAY_TILL_ID,
        reference: reference || \`ORDER-\${Date.now()}\`,
        description: description || 'Payment'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      res.json({
        success: true,
        message: 'Payment initiated successfully',
        checkoutId: data.data?.checkout_id,
        requestId: data.data?.request_id
      });
    } else {
      res.status(400).json({
        success: false,
        message: data.message || 'Payment initiation failed',
        error: data
      });
    }
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`
    },
    php: {
      title: "PHP Integration",
      description: "PHP backend integration",
      language: "php",
      code: `<?php
// payment.php - PHP integration

// SwiftPay Configuration
define('SWIFTPAY_API_KEY', 'your-api-key');
define('SWIFTPAY_TILL_ID', 'your-till-id');
define('SWIFTPAY_BACKEND_URL', 'https://swiftpay-backend-uvv9.onrender.com');

function normalizePhoneNumber($phone) {
    if (!$phone) return null;
    $cleaned = preg_replace('/[\\s\\-\\(\\)]/', '', $phone);
    if (strpos($cleaned, '0') === 0) {
        $cleaned = '254' . substr($cleaned, 1);
    }
    if (strlen($cleaned) !== 12 || !preg_match('/^\\d+$/', $cleaned)) {
        return null;
    }
    return $cleaned;
}

function initiatePayment($phoneNumber, $amount, $reference = null, $description = null) {
    $normalizedPhone = normalizePhoneNumber($phoneNumber);
    
    if (!$normalizedPhone) {
        return [
            'success' => false,
            'message' => 'Invalid phone number format'
        ];
    }
    
    $payload = [
        'phone_number' => $normalizedPhone,
        'amount' => floatval($amount),
        'till_id' => SWIFTPAY_TILL_ID,
        'reference' => $reference ?: 'ORDER-' . time(),
        'description' => $description ?: 'Payment'
    ];
    
    $ch = curl_init(SWIFTPAY_BACKEND_URL . '/api/mpesa/stk-push-api');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . SWIFTPAY_API_KEY
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $data = json_decode($response, true);
    
    if ($httpCode === 200 && ($data['success'] === true || $data['status'] === 'success')) {
        return [
            'success' => true,
            'message' => 'Payment initiated successfully',
            'checkout_id' => $data['data']['checkout_id'] ?? null,
            'request_id' => $data['data']['request_id'] ?? null
        ];
    }
    
    return [
        'success' => false,
        'message' => $data['message'] ?? 'Payment initiation failed',
        'error' => $data
    ];
}

// Usage example
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phoneNumber = $_POST['phone'] ?? '';
    $amount = $_POST['amount'] ?? 0;
    
    $result = initiatePayment($phoneNumber, $amount);
    
    header('Content-Type: application/json');
    echo json_encode($result);
}
?>`
    },
    python: {
      title: "Python Integration",
      description: "Python backend with Flask/Django support",
      language: "python",
      code: `# SwiftPay Python Integration
# Works with Flask, Django, FastAPI, or any Python framework

import os
import requests
import json
import time
from typing import Dict, Optional, Any

# Configuration
SWIFTPAY_API_KEY = os.getenv('SWIFTPAY_API_KEY', 'your-api-key')
SWIFTPAY_TILL_ID = os.getenv('SWIFTPAY_TILL_ID', 'your-till-id')
SWIFTPAY_BACKEND_URL = os.getenv('SWIFTPAY_BACKEND_URL', 'https://swiftpay-backend-uvv9.onrender.com')

class SwiftPayClient:
    """SwiftPay API Client for Python"""
    
    def __init__(self, api_key: str, till_id: str, backend_url: str = None):
        self.api_key = api_key
        self.till_id = till_id
        self.backend_url = backend_url or SWIFTPAY_BACKEND_URL
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }
    
    @staticmethod
    def normalize_phone_number(phone: str) -> Optional[str]:
        """Normalize phone number to 254 format"""
        if not phone:
            return None
        
        cleaned = ''.join(c for c in phone if c.isdigit())
        
        if cleaned.startswith('0'):
            cleaned = '254' + cleaned[1:]
        elif cleaned.startswith('254'):
            pass
        else:
            return None
        
        if len(cleaned) != 12:
            return None
        
        return cleaned
    
    def initiate_payment(
        self,
        phone_number: str,
        amount: float,
        reference: str = None,
        description: str = None
    ) -> Dict[str, Any]:
        """Initiate STK Push payment"""
        
        normalized_phone = self.normalize_phone_number(phone_number)
        
        if not normalized_phone:
            return {
                'success': False,
                'message': 'Invalid phone number format. Use 2547XXXXXXXXX'
            }
        
        payload = {
            'phone_number': normalized_phone,
            'amount': float(amount),
            'till_id': self.till_id,
            'reference': reference or f'ORDER-{int(time.time())}',
            'description': description or 'Payment'
        }
        
        try:
            response = requests.post(
                f'{self.backend_url}/api/mpesa/stk-push-api',
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            data = response.json()
            
            if response.status_code == 200 and (data.get('success') or data.get('status') == 'success'):
                return {
                    'success': True,
                    'message': 'Payment initiated successfully',
                    'checkout_id': data.get('data', {}).get('checkout_id') or data.get('checkoutRequestId'),
                    'request_id': data.get('data', {}).get('request_id')
                }
            
            return {
                'success': False,
                'message': data.get('message') or data.get('error') or 'Payment initiation failed',
                'error': data
            }
            
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'message': f'Connection error: {str(e)}'
            }
    
    def check_payment_status(self, checkout_id: str) -> Dict[str, Any]:
        """Check payment status"""
        
        try:
            response = requests.post(
                f'{self.backend_url}/api/mpesa-verification-proxy',
                headers={'Content-Type': 'application/json'},
                json={
                    'checkoutId': checkout_id,
                    'apiKey': self.api_key
                },
                timeout=30
            )
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            return {
                'status': 'error',
                'message': f'Connection error: {str(e)}'
            }


# Flask Example
from flask import Flask, request, jsonify
import time

app = Flask(__name__)
swiftpay = SwiftPayClient(SWIFTPAY_API_KEY, SWIFTPAY_TILL_ID)

@app.route('/api/payment/initiate', methods=['POST'])
def initiate_payment():
    """Initiate payment endpoint"""
    data = request.get_json()
    
    result = swiftpay.initiate_payment(
        phone_number=data.get('phone'),
        amount=data.get('amount'),
        reference=data.get('reference'),
        description=data.get('description')
    )
    
    return jsonify(result)

@app.route('/api/payment/status', methods=['POST'])
def check_status():
    """Check payment status endpoint"""
    data = request.get_json()
    
    result = swiftpay.check_payment_status(
        checkout_id=data.get('checkout_id')
    )
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)


# Django Example (views.py)
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def initiate_payment(request):
    """Django payment initiation view"""
    if request.method == 'POST':
        data = json.loads(request.body)
        
        client = SwiftPayClient(SWIFTPAY_API_KEY, SWIFTPAY_TILL_ID)
        result = client.initiate_payment(
            phone_number=data.get('phone'),
            amount=data.get('amount'),
            reference=data.get('reference')
        )
        
        return JsonResponse(result)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def payment_status(request):
    """Django payment status view"""
    if request.method == 'POST':
        data = json.loads(request.body)
        
        client = SwiftPayClient(SWIFTPAY_API_KEY, SWIFTPAY_TILL_ID)
        result = client.check_payment_status(
            checkout_id=data.get('checkout_id')
        )
        
        return JsonResponse(result)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)`
    },
    python_flask: {
      title: "Flask Quick Start",
      description: "Minimal Flask integration example",
      language: "python",
      code: `# app.py - Minimal Flask Integration
from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

# Configuration
SWIFTPAY_API_KEY = os.getenv('SWIFTPAY_API_KEY', 'your-api-key')
SWIFTPAY_TILL_ID = os.getenv('SWIFTPAY_TILL_ID', 'your-till-id')
SWIFTPAY_BACKEND_URL = 'https://swiftpay-backend-uvv9.onrender.com'

def normalize_phone(phone):
    """Normalize phone to 254 format"""
    if not phone:
        return None
    cleaned = ''.join(c for c in phone if c.isdigit())
    if cleaned.startswith('0'):
        cleaned = '254' + cleaned[1:]
    return cleaned if len(cleaned) == 12 else None

@app.route('/api/payment', methods=['POST'])
def initiate_payment():
    """Initiate M-Pesa payment"""
    data = request.get_json()
    
    phone = normalize_phone(data.get('phone'))
    if not phone:
        return jsonify({'success': False, 'message': 'Invalid phone number'}), 400
    
    payload = {
        'phone_number': phone,
        'amount': float(data.get('amount')),
        'till_id': SWIFTPAY_TILL_ID,
        'reference': data.get('reference', 'ORDER-123'),
        'description': 'Payment'
    }
    
    try:
        response = requests.post(
            f'{SWIFTPAY_BACKEND_URL}/api/mpesa/stk-push-api',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {SWIFTPAY_API_KEY}'
            },
            json=payload
        )
        
        result = response.json()
        
        if response.status_code == 200 and result.get('success'):
            return jsonify({
                'success': True,
                'message': 'Payment initiated',
                'checkout_id': result.get('data', {}).get('checkout_id')
            })
        
        return jsonify({'success': False, 'message': result.get('message', 'Failed')}), 400
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

# Run with: python app.py
# Test with: curl -X POST http://localhost:5000/api/payment -H "Content-Type: application/json" -d '{"phone":"254712345678","amount":100}'`
    },
    php_wordpress: {
      title: "WordPress Integration",
      description: "WordPress plugin/WooCommerce integration",
      language: "php",
      code: `<?php
/**
 * SwiftPay WordPress Integration
 * Add to your theme's functions.php or create a plugin
 */

// Configuration
add_action('init', 'swiftpay_init');
function swiftpay_init() {
    define('SWIFTPAY_API_KEY', get_option('swiftpay_api_key', 'your-api-key'));
    define('SWIFTPAY_TILL_ID', get_option('swiftpay_till_id', 'your-till-id'));
    define('SWIFTPAY_BACKEND_URL', 'https://swiftpay-backend-uvv9.onrender.com');
}

// Add settings page
add_action('admin_menu', 'swiftpay_settings_menu');
function swiftpay_settings_menu() {
    add_options_page(
        'SwiftPay Settings',
        'SwiftPay',
        'manage_options',
        'swiftpay-settings',
        'swiftpay_settings_page'
    );
}

function swiftpay_settings_page() {
    ?>
    <div class="wrap">
        <h1>SwiftPay Settings</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('swiftpay_options');
            do_settings_sections('swiftpay');
            ?>
            <table class="form-table">
                <tr>
                    <th>API Key</th>
                    <td>
                        <input type="text" 
                               name="swiftpay_api_key" 
                               value="<?php echo esc_attr(get_option('swiftpay_api_key')); ?>" 
                               class="regular-text">
                    </td>
                </tr>
                <tr>
                    <th>Till ID</th>
                    <td>
                        <input type="text" 
                               name="swiftpay_till_id" 
                               value="<?php echo esc_attr(get_option('swiftpay_till_id')); ?>" 
                               class="regular-text">
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

add_action('admin_init', 'swiftpay_register_settings');
function swiftpay_register_settings() {
    register_setting('swiftpay_options', 'swiftpay_api_key');
    register_setting('swiftpay_options', 'swiftpay_till_id');
}

// Payment initiation function
function swiftpay_initiate_payment($phone, $amount, $order_id = null) {
    $phone = preg_replace('/[^0-9]/', '', $phone);
    if (strpos($phone, '0') === 0) {
        $phone = '254' . substr($phone, 1);
    }
    
    $payload = [
        'phone_number' => $phone,
        'amount' => floatval($amount),
        'till_id' => SWIFTPAY_TILL_ID,
        'reference' => $order_id ?: 'ORDER-' . time(),
        'description' => 'WordPress Order Payment'
    ];
    
    $response = wp_remote_post(SWIFTPAY_BACKEND_URL . '/api/mpesa/stk-push-api', [
        'headers' => [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . SWIFTPAY_API_KEY
        ],
        'body' => json_encode($payload),
        'timeout' => 30
    ]);
    
    if (is_wp_error($response)) {
        return [
            'success' => false,
            'message' => $response->get_error_message()
        ];
    }
    
    $body = json_decode(wp_remote_retrieve_body($response), true);
    
    if (wp_remote_retrieve_response_code($response) === 200 && $body['success']) {
        return [
            'success' => true,
            'checkout_id' => $body['data']['checkout_id'] ?? null,
            'message' => 'Payment initiated'
        ];
    }
    
    return [
        'success' => false,
        'message' => $body['message'] ?? 'Payment failed'
    ];
}

// AJAX handler for frontend
add_action('wp_ajax_swiftpay_payment', 'swiftpay_ajax_handler');
add_action('wp_ajax_nopriv_swiftpay_payment', 'swiftpay_ajax_handler');
function swiftpay_ajax_handler() {
    check_ajax_referer('swiftpay_nonce', 'nonce');
    
    $phone = sanitize_text_field($_POST['phone']);
    $amount = floatval($_POST['amount']);
    $order_id = sanitize_text_field($_POST['order_id'] ?? '');
    
    $result = swiftpay_initiate_payment($phone, $amount, $order_id);
    
    wp_send_json($result);
}

// Shortcode for payment form
add_shortcode('swiftpay_form', 'swiftpay_payment_form_shortcode');
function swiftpay_payment_form_shortcode() {
    ob_start();
    ?>
    <div id="swiftpay-form-container">
        <form id="swiftpay-payment-form">
            <input type="text" 
                   id="swiftpay-phone" 
                   placeholder="254712345678" 
                   required>
            <input type="number" 
                   id="swiftpay-amount" 
                   placeholder="Amount" 
                   required>
            <button type="submit">Pay with M-Pesa</button>
        </form>
        <div id="swiftpay-result"></div>
    </div>
    <script>
    jQuery(document).ready(function($) {
        $('#swiftpay-payment-form').on('submit', function(e) {
            e.preventDefault();
            $.ajax({
                url: '<?php echo admin_url('admin-ajax.php'); ?>',
                type: 'POST',
                data: {
                    action: 'swiftpay_payment',
                    nonce: '<?php echo wp_create_nonce('swiftpay_nonce'); ?>',
                    phone: $('#swiftpay-phone').val(),
                    amount: $('#swiftpay-amount').val()
                },
                success: function(response) {
                    if (response.success) {
                        $('#swiftpay-result').html('✓ Payment initiated! Check your phone.');
                    } else {
                        $('#swiftpay-result').html('✗ ' + response.message);
                    }
                }
            });
        });
    });
    </script>
    <?php
    return ob_get_clean();
}
?>`
    }
  };

  const paymentStatusDocs = {
    title: "Check Payment Status",
    sections: [
      {
        heading: "Payment Status Endpoint",
        description: "Query the status of a payment using the checkout ID",
        code: `// Check payment status
const checkoutId = 'ws_CO_13012021095000000001';

const response = await fetch('https://swiftpay-backend-uvv9.onrender.com/api/mpesa-verification-proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    checkoutId: checkoutId,
    apiKey: 'your-api-key'
  })
});

const status = await response.json();

// Response
{
  "status": "success",
  "result": {
    "resultCode": "0",
    "resultDesc": "The service request is processed successfully.",
    "amount": "100",
    "mpesaReceiptNumber": "LHG7H5S3Q2",
    "transactionDate": "20240113105000"
  }
}`
      },
      {
        heading: "Status Codes",
        description: "Understanding payment status responses",
        code: `// Result Code 0: Payment Successful
{
  "resultCode": "0",
  "resultDesc": "The service request is processed successfully.",
  "mpesaReceiptNumber": "LHG7H5S3Q2"
}

// Result Code 1032: Request cancelled by user
{
  "resultCode": "1032",
  "resultDesc": "Request cancelled by user"
}

// Result Code 2001: Invalid amount
{
  "resultCode": "2001",
  "resultDesc": "Invalid amount"
}

// Other codes indicate various error conditions
// Always check resultCode === 0 for successful payments`
      },
      {
        heading: "Polling Strategy",
        description: "Implement polling to check payment status",
        code: `// Poll payment status
async function checkPaymentStatus(checkoutId, maxAttempts = 10, interval = 3000) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch('https://swiftpay-backend-uvv9.onrender.com/api/mpesa-verification-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        checkoutId: checkoutId,
        apiKey: 'your-api-key'
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'success' && data.result) {
      const resultCode = data.result.resultCode;
      
      if (resultCode === '0') {
        // Payment successful
        return {
          success: true,
          receipt: data.result.mpesaReceiptNumber,
          amount: data.result.amount
        };
      } else if (resultCode !== null && resultCode !== undefined) {
        // Payment failed
        return {
          success: false,
          error: data.result.resultDesc
        };
      }
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  // Timeout - payment still pending
  return {
    success: false,
    error: 'Payment verification timeout'
  };
}`
      }
    ]
  };

  const apiEndpoints = [
    {
      method: "POST",
      endpoint: "/api/keys/generate",
      description: "Generate a new API key (self-service)",
      auth: "None",
      body: {
        projectName: "string",
        tillId: "string",
        email: "string (optional)"
      }
    },
    {
      method: "POST",
      endpoint: "/api/mpesa/stk-push-api",
      description: "Initiate STK Push payment",
      auth: "Bearer API_KEY",
      body: {
        phone_number: "string (254 format)",
        amount: "number",
        till_id: "string",
        reference: "string (optional)",
        description: "string (optional)"
      }
    },
    {
      method: "POST",
      endpoint: "/api/mpesa-verification-proxy",
      description: "Check payment status",
      auth: "None",
      body: {
        checkoutId: "string",
        apiKey: "string"
      }
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated Background with Mesh Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 mesh-gradient" />
        
        {/* Safaricom green orb */}
        <motion.div
          className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full bg-safaricom/20 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Primary orb */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Safaricom light orb */}
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-safaricom-light/25 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-20 pb-16 px-6"
        >
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/20 mb-8"
            >
              <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">Developer Portal v2.0</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Build with
              <span className="gradient-text">
                {" "}SwiftPay
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
              Accept M-Pesa payments with enterprise-grade APIs. Build, scale, and grow your business with our powerful developer tools.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <Button
                size="lg"
                onClick={() => setActiveTab("quickstart")}
                variant="glow"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Quick Start
              </Button>
              <Button
                size="lg"
                onClick={() => setActiveTab("playground")}
                variant="glass"
              >
                <Terminal className="w-5 h-5 mr-2" />
                Try Playground
              </Button>
              <Button
                size="lg"
                onClick={() => setActiveTab("docs")}
                variant="glass"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Documentation
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { icon: Zap, label: "Fast Setup", value: "5 min" },
                { icon: Shield, label: "Secure", value: "256-bit" },
                { icon: Globe, label: "Uptime", value: "99.9%" },
                { icon: Layers, label: "SDKs", value: "All" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl glass border-primary/20 mb-3">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8 glass p-2 rounded-xl border border-border/50">
            {[
              { id: "quickstart", label: "Quick Start", icon: Rocket },
              { id: "playground", label: "Playground", icon: Terminal },
              { id: "wizard", label: "Setup Wizard", icon: Settings },
              { id: "codesamples", label: "Code Samples", icon: Code2 },
              { id: "status", label: "Payment Status", icon: RefreshCw },
              { id: "docs", label: "API Reference", icon: BookOpen }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Start Tab */}
          {activeTab === "quickstart" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="glass rounded-2xl border border-border/50 p-8">
                <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-primary" />
                  Get Started in 5 Minutes
                </h2>
                <p className="text-muted-foreground mb-8">
                  Follow these simple steps to integrate SwiftPay into your application
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { step: 1, title: "Create Account", desc: "Sign up and verify your email", icon: UserPlus },
                    { step: 2, title: "Create Till", desc: "Set up your payment till", icon: CreditCard },
                    { step: 3, title: "Get API Key", desc: "Generate your credentials", icon: Key },
                    { step: 4, title: "Integrate", desc: "Add payment to your app", icon: Code2 }
                  ].map((item) => (
                    <div
                      key={item.step}
                      onClick={() => { setActiveTab("wizard"); setWizardStep(item.step - 1); }}
                      className="group cursor-pointer glass rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-all hover:transform hover:scale-105"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-foreground font-bold">
                          {item.step}
                        </div>
                        <item.icon className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Code Sample */}
              <div className="glass rounded-2xl border border-border/50 p-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">Copy & Paste Integration</h3>
                <p className="text-muted-foreground mb-6">
                  The simplest way to add payments to your website
                </p>

                <div className="bg-background rounded-xl overflow-hidden border border-border">
                  <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
                    <span className="text-sm text-muted-foreground">HTML + JavaScript</span>
                    <button
                      onClick={() => copyToClipboard(codeSamples.button.code, "quick-sample")}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                    >
                      {copiedCode === "quick-sample" ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-sm">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-sm">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm text-foreground font-mono max-h-96">
                    {codeSamples.button.code}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}

          {/* Playground Tab */}
          {activeTab === "playground" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="glass rounded-2xl border border-border/50 p-8">
                <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Terminal className="w-8 h-8 text-primary" />
                  API Playground
                </h2>
                <p className="text-muted-foreground mb-8">
                  Test your SwiftPay integration without writing code. Enter your credentials and try a payment.
                </p>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Input Form */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        API Key
                      </label>
                      <Input
                        type="text"
                        placeholder="your-api-key"
                        value={playgroundData.apiKey}
                        onChange={(e) => setPlaygroundData({ ...playgroundData, apiKey: e.target.value })}
                        className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your SwiftPay API key (e.g., myapp-key)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Till ID
                      </label>
                      <Input
                        type="text"
                        placeholder="dbdedaea-11d8-4bbe-b94f-84bbe4206d3c"
                        value={playgroundData.tillId}
                        onChange={(e) => setPlaygroundData({ ...playgroundData, tillId: e.target.value })}
                        className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your till ID from the dashboard
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        placeholder="254712345678"
                        value={playgroundData.phoneNumber}
                        onChange={(e) => setPlaygroundData({ ...playgroundData, phoneNumber: normalizePhoneNumber(e.target.value) })}
                        className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be in 254 format (e.g., 254712345678)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Amount (KES)
                      </label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={playgroundData.amount}
                        onChange={(e) => setPlaygroundData({ ...playgroundData, amount: e.target.value })}
                        className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Reference
                      </label>
                      <Input
                        type="text"
                        placeholder="TEST-ORDER"
                        value={playgroundData.reference}
                        onChange={(e) => setPlaygroundData({ ...playgroundData, reference: e.target.value })}
                        className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50"
                      />
                    </div>

                    <Button
                      onClick={testPlayground}
                      disabled={playgroundLoading || !playgroundData.apiKey || !playgroundData.tillId || !playgroundData.phoneNumber}
                      className="w-full bg-primary text-foreground hover:bg-primary/90 py-6 text-lg"
                    >
                      {playgroundLoading ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Test Payment
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Result Display */}
                  <div className="bg-background rounded-xl border border-border overflow-hidden">
                    <div className="px-4 py-3 bg-secondary/50 border-b border-border">
                      <span className="text-sm text-muted-foreground">Response</span>
                    </div>
                    <div className="p-4 min-h-[400px]">
                      {playgroundResult ? (
                        <div className="space-y-4">
                          {playgroundResult.success || playgroundResult.status === 'success' ? (
                            <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-success mb-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-semibold">Payment Initiated Successfully!</span>
                              </div>
                              <p className="text-muted-foreground text-sm mb-3">
                                Check your phone for the STK push prompt to complete the payment.
                              </p>
                              {playgroundResult.data && (
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Checkout ID:</span>
                                    <span className="text-foreground font-mono">{playgroundResult.data.checkout_id || playgroundResult.data.request_id}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phone:</span>
                                    <span className="text-foreground">{playgroundData.phoneNumber}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount:</span>
                                    <span className="text-foreground">KES {playgroundData.amount}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-destructive mb-2">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-semibold">Payment Failed</span>
                              </div>
                              <p className="text-muted-foreground text-sm">
                                {playgroundResult.error || playgroundResult.message || 'Unknown error'}
                              </p>
                            </div>
                          )}
                          
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Full Response:</h4>
                            <pre className="bg-secondary/50 rounded-lg p-4 overflow-x-auto text-xs text-foreground font-mono">
                              {JSON.stringify(playgroundResult, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <Terminal className="w-16 h-16 mb-4 opacity-20" />
                          <p className="text-sm">Enter your credentials and click "Test Payment"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Setup Wizard Tab */}
          {activeTab === "wizard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="glass rounded-2xl border border-border/50 p-8">
                <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Settings className="w-8 h-8 text-primary" />
                  Setup Wizard
                </h2>
                <p className="text-muted-foreground mb-8">
                  Follow this step-by-step guide to set up your SwiftPay integration
                </p>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
                  {wizardSteps.map((step, index) => (
                    <div
                      key={step.id}
                      onClick={() => setWizardStep(index)}
                      className="flex items-center cursor-pointer min-w-fit"
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                        wizardStep >= index
                          ? 'bg-primary border-primary text-foreground'
                          : 'border-border text-muted-foreground'
                      }`}>
                        {wizardStep > index ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <span className="font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${
                          wizardStep >= index ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {step.title}
                        </div>
                      </div>
                      {index < wizardSteps.length - 1 && (
                        <div className={`w-16 h-0.5 mx-4 ${
                          wizardStep > index ? 'bg-primary' : 'bg-border'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Current Step Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={wizardStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-background rounded-xl p-6 border border-border">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                          {React.createElement(wizardSteps[wizardStep].icon, { className: "w-8 h-8 text-primary" })}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-foreground mb-2">
                            {wizardSteps[wizardStep].title}
                          </h3>
                          <p className="text-muted-foreground">
                            {wizardSteps[wizardStep].description}
                          </p>
                        </div>
                      </div>

                      <div className="bg-secondary/50 rounded-xl overflow-hidden border border-border">
                        <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
                          <span className="text-sm text-muted-foreground">Instructions</span>
                          <button
                            onClick={() => copyToClipboard(wizardSteps[wizardStep].code, `wizard-${wizardStep}`)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                          >
                            {copiedCode === `wizard-${wizardStep}` ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span className="text-sm">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span className="text-sm">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 overflow-x-auto text-sm text-foreground font-mono">
                          {wizardSteps[wizardStep].code}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                  <Button
                    onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
                    disabled={wizardStep === 0}
                    variant="outline"
                    className="border-border text-muted-foreground hover:bg-secondary/50"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => {
                      if (wizardStep < wizardSteps.length - 1) {
                        setWizardStep(wizardStep + 1);
                      } else {
                        setActiveTab("codesamples");
                      }
                    }}
                    className="bg-primary text-foreground hover:bg-primary/90"
                  >
                    {wizardStep < wizardSteps.length - 1 ? (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        View Code Samples
                        <Code2 className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Code Samples Tab */}
          {activeTab === "codesamples" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="glass rounded-2xl border border-border/50 p-8">
                <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Code2 className="w-8 h-8 text-primary" />
                  Code Samples
                </h2>
                <p className="text-muted-foreground mb-8">
                  Ready-to-use code samples for different platforms and use cases
                </p>

                {/* Test Mode Toggle */}
                <div className="flex items-center justify-between mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">Live Test Mode</h3>
                      <p className="text-sm text-muted-foreground">Test the code sample with your credentials</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setCodeTestMode(!codeTestMode)}
                    variant={codeTestMode ? "default" : "outline"}
                    className={codeTestMode ? "bg-primary text-foreground" : "border-primary/50 text-primary hover:bg-primary/10"}
                  >
                    {codeTestMode ? "Disable Test Mode" : "Enable Test Mode"}
                  </Button>
                </div>

                {/* Sample Selector */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {Object.entries(codeSamples).map(([key, sample]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCodeSample(key)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedCodeSample === key
                          ? "bg-primary text-foreground"
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>

                {/* Test Credentials Form */}
                {codeTestMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-6 p-6 bg-background rounded-xl border border-border"
                  >
                    <h4 className="text-lg font-semibold text-foreground mb-4">Enter Your Credentials</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          API Key
                        </label>
                        <Input
                          type="text"
                          placeholder="your-api-key"
                          value={codeTestCredentials.apiKey}
                          onChange={(e) => setCodeTestCredentials({ ...codeTestCredentials, apiKey: e.target.value })}
                          className="bg-secondary/50 border-border text-foreground"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Till ID
                        </label>
                        <Input
                          type="text"
                          placeholder="dbdedaea-11d8-4bbe-b94f-84bbe4206d3c"
                          value={codeTestCredentials.tillId}
                          onChange={(e) => setCodeTestCredentials({ ...codeTestCredentials, tillId: e.target.value })}
                          className="bg-secondary/50 border-border text-foreground"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Phone Number
                        </label>
                        <Input
                          type="tel"
                          placeholder="254712345678"
                          value={codeTestCredentials.phoneNumber}
                          onChange={(e) => setCodeTestCredentials({ ...codeTestCredentials, phoneNumber: normalizePhoneNumber(e.target.value) })}
                          className="bg-secondary/50 border-border text-foreground"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Amount (KES)
                        </label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={codeTestCredentials.amount}
                          onChange={(e) => setCodeTestCredentials({ ...codeTestCredentials, amount: e.target.value })}
                          className="bg-secondary/50 border-border text-foreground"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <Button
                        onClick={testCodeSample}
                        disabled={codeTestLoading || !codeTestCredentials.apiKey || !codeTestCredentials.tillId || !codeTestCredentials.phoneNumber}
                        className="bg-primary text-foreground hover:bg-primary/90"
                      >
                        {codeTestLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Test Payment
                          </>
                        )}
                      </Button>

                      {codeTestResult && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          codeTestResult.success || codeTestResult.status === 'success'
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {codeTestResult.success || codeTestResult.status === 'success' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm font-medium">Payment Initiated!</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Failed</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Test Result Details */}
                    {codeTestResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-secondary/50 rounded-lg border border-border"
                      >
                        <h5 className="text-sm font-semibold text-foreground mb-2">Response Details</h5>
                        <pre className="text-xs text-muted-foreground overflow-x-auto">
                          {JSON.stringify(codeTestResult, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Code Display */}
                <div className="bg-background rounded-xl overflow-hidden border border-border">
                  <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{codeSamples[selectedCodeSample].title}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-secondary text-muted-foreground">
                        {codeSamples[selectedCodeSample].language}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(codeSamples[selectedCodeSample].code, `sample-${selectedCodeSample}`)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                    >
                      {copiedCode === `sample-${selectedCodeSample}` ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-sm">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-sm">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 bg-background/50">
                    <p className="text-muted-foreground text-sm mb-4">
                      {codeSamples[selectedCodeSample].description}
                    </p>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm text-foreground font-mono max-h-[600px] overflow-y-auto">
                    {codeSamples[selectedCodeSample].code}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Status Tab */}
          {activeTab === "status" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="glass rounded-2xl border border-border/50 p-8">
                <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-primary" />
                  Payment Status
                </h2>
                <p className="text-muted-foreground mb-8">
                  Learn how to check the status of your payments
                </p>

                <div className="space-y-6">
                  {paymentStatusDocs.sections.map((section, index) => (
                    <div
                      key={index}
                      className="bg-background rounded-xl border border-border overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedSection(expandedSection === `status-${index}` ? null : `status-${index}`)}
                        className="w-full flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <span className="text-primary font-bold">{index + 1}</span>
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-foreground">{section.heading}</h3>
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                        {expandedSection === `status-${index}` ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedSection === `status-${index}` && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-border"
                          >
                            <div className="p-6">
                              <div className="bg-secondary/50 rounded-xl overflow-hidden border border-border">
                                <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
                                  <span className="text-sm text-muted-foreground">Code</span>
                                  <button
                                    onClick={() => copyToClipboard(section.code, `status-code-${index}`)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                                  >
                                    {copiedCode === `status-code-${index}` ? (
                                      <>
                                        <Check className="w-4 h-4" />
                                        <span className="text-sm">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-4 h-4" />
                                        <span className="text-sm">Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="p-4 overflow-x-auto text-sm text-foreground font-mono">
                                  {section.code}
                                </pre>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* API Reference Tab */}
          {activeTab === "docs" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="glass rounded-2xl border border-border/50 p-8">
                <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-primary" />
                  API Reference
                </h2>
                <p className="text-muted-foreground mb-8">
                  Complete API documentation for all endpoints
                </p>

                <div className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search endpoints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-4">
                  {apiEndpoints
                    .filter(endpoint =>
                      endpoint.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((endpoint, index) => (
                      <div
                        key={index}
                        className="bg-background rounded-xl border border-border overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                              endpoint.method === 'POST' ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'
                            }`}>
                              {endpoint.method}
                            </span>
                            <div className="flex-1">
                              <code className="text-lg text-foreground font-mono">{endpoint.endpoint}</code>
                              <p className="text-muted-foreground mt-1">{endpoint.description}</p>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Authentication</h4>
                              <code className="text-sm text-primary bg-secondary/50 px-2 py-1 rounded">
                                {endpoint.auth}
                              </code>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Request Body</h4>
                              <pre className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg overflow-x-auto">
                                {JSON.stringify(endpoint.body, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Additional Info */}
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  <div className="bg-background rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-success" />
                      Security
                    </h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>All requests use HTTPS encryption</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>API keys should be kept secret</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>Never expose keys in client-side code</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>Use environment variables for credentials</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-background rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Base URL
                    </h3>
                    <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                      <code className="text-primary font-mono">
                        https://swiftpay-backend-uvv9.onrender.com
                      </code>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      All API endpoints are relative to this base URL. For example, the full URL for the STK Push endpoint would be:
                    </p>
                    <code className="block mt-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                      https://swiftpay-backend-uvv9.onrender.com/api/mpesa/stk-push-api
                    </code>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-7xl mx-auto px-6 pb-20"
        >
          <div className="glass rounded-2xl border border-primary/20 p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Ready to integrate?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Start accepting M-Pesa payments in minutes. Our team is here to help if you need assistance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => setActiveTab("playground")}
                variant="glow"
              >
                <Terminal className="w-4 h-4 mr-2" />
                Try Playground
              </Button>
              <Button
                variant="glass"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
