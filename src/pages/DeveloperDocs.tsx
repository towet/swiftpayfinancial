import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, Copy, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function DeveloperDocs() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("authentication");
  const [searchQuery, setSearchQuery] = useState("");
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
      id: "authentication",
      title: "Authentication",
      icon: "🔐",
      content: [
        {
          heading: "Overview",
          text: "SwiftPay uses JWT (JSON Web Tokens) for user authentication and API keys for third-party integrations."
        },
        {
          heading: "User Registration",
          code: `POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe",
  "companyName": "Acme Corp"
}

Response:
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "John Doe",
    "companyName": "Acme Corp"
  }
}`
        },
        {
          heading: "User Login",
          code: `POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}`
        },
        {
          heading: "Using JWT Token",
          text: "Include the JWT token in the Authorization header for all authenticated requests:",
          code: `Authorization: Bearer YOUR_JWT_TOKEN`
        }
      ]
    },
    {
      id: "tills",
      title: "Till Management",
      icon: "🏪",
      content: [
        {
          heading: "Create a Till",
          code: `POST /api/tills
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "tillName": "Main Store",
  "tillNumber": "123456",
  "description": "Primary payment till"
}

Response:
{
  "status": "success",
  "till": {
    "id": "till-id",
    "till_name": "Main Store",
    "till_number": "123456",
    "is_active": true,
    "created_at": "2024-12-13T10:00:00Z"
  }
}`
        },
        {
          heading: "Get All Tills",
          code: `GET /api/tills
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "status": "success",
  "tills": [
    {
      "id": "till-id",
      "till_name": "Main Store",
      "till_number": "123456",
      "is_active": true,
      "created_at": "2024-12-13T10:00:00Z"
    }
  ]
}`
        },
        {
          heading: "Update a Till",
          code: `PUT /api/tills/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "tillName": "Updated Store Name",
  "tillNumber": "654321",
  "description": "Updated description"
}

Response:
{
  "status": "success",
  "till": {
    "id": "till-id",
    "till_name": "Updated Store Name",
    "till_number": "654321",
    "is_active": true
  }
}`
        },
        {
          heading: "Delete a Till",
          code: `DELETE /api/tills/:id
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "status": "success",
  "message": "Till deleted successfully"
}`
        }
      ]
    },
    {
      id: "api-keys",
      title: "API Keys",
      icon: "🔑",
      content: [
        {
          heading: "Generate API Key",
          code: `POST /api/keys
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "keyName": "Production API",
  "tillId": "till-id"
}

Response:
{
  "status": "success",
  "apiKey": {
    "id": "key-id",
    "key_name": "Production API",
    "api_key": "sp_abc123def456...",
    "api_secret": "secret_xyz789...",
    "is_active": true,
    "till_id": "till-id",
    "created_at": "2024-12-13T10:00:00Z"
  }
}`
        },
        {
          heading: "Get All API Keys",
          code: `GET /api/keys
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "status": "success",
  "keys": [
    {
      "id": "key-id",
      "key_name": "Production API",
      "api_key": "sp_abc123def456...",
      "is_active": true,
      "created_at": "2024-12-13T10:00:00Z"
    }
  ]
}`
        },
        {
          heading: "Delete API Key",
          code: `DELETE /api/keys/:id
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "status": "success",
  "message": "API key deleted successfully"
}`
        }
      ]
    },
    {
      id: "payments",
      title: "Payment Integration",
      icon: "💳",
      content: [
        {
          heading: "Initiate STK Push",
          code: `POST /api/mpesa/stk-push-api
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "phone_number": "254712345678",
  "amount": 100,
  "till_id": "till-id",
  "reference": "ORDER123",
  "description": "Payment for order"
}

Response:
{
  "status": "success",
  "message": "STK Push sent successfully",
  "checkoutRequestId": "ws_CO_13012021095000000001",
  "responseCode": "0",
  "responseDescription": "Success. Request accepted for processing"
}`
        },
        {
          heading: "Phone Number Format",
          text: "Phone numbers must be in international format starting with country code (e.g., 254712345678 for Kenya)."
        },
        {
          heading: "Amount Validation",
          text: "Amount must be between 1 and 150000 KES. Amounts outside this range will be rejected."
        }
      ]
    },
    {
      id: "errors",
      title: "Error Handling",
      icon: "⚠️",
      content: [
        {
          heading: "Common Error Codes",
          code: `400 Bad Request
- Missing required fields
- Invalid data format
- Validation errors

401 Unauthorized
- Missing or invalid token
- Expired token
- Invalid API key

404 Not Found
- Resource not found
- Till or API key doesn't exist

500 Internal Server Error
- Server-side error
- Database error
- Payment gateway error`
        },
        {
          heading: "Error Response Format",
          code: `{
  "status": "error",
  "message": "Descriptive error message",
  "details": "Additional error details if available"
}`
        }
      ]
    },
    {
      id: "best-practices",
      title: "Best Practices",
      icon: "✨",
      content: [
        {
          heading: "Security",
          items: [
            "Never expose your API keys in client-side code",
            "Always use HTTPS in production",
            "Rotate API keys regularly",
            "Use environment variables for sensitive data",
            "Implement rate limiting on your endpoints"
          ]
        },
        {
          heading: "Error Handling",
          items: [
            "Always handle API errors gracefully",
            "Implement retry logic with exponential backoff",
            "Log all API errors for debugging",
            "Provide user-friendly error messages",
            "Monitor API response times"
          ]
        },
        {
          heading: "Performance",
          items: [
            "Cache API responses when appropriate",
            "Use pagination for large datasets",
            "Implement request timeouts",
            "Batch requests when possible",
            "Monitor API usage and quotas"
          ]
        }
      ]
    }
  ];

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.some(item =>
      item.heading.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border"
      >
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground mb-4">API Documentation</h1>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-6">
          {filteredSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => setExpandedSection(
                  expandedSection === section.id ? null : section.id
                )}
                className="w-full flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{section.icon}</span>
                  <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    expandedSection === section.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Section Content */}
              {expandedSection === section.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border p-6 space-y-8"
                >
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex} className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground">{item.heading}</h3>
                      
                      {item.text && (
                        <p className="text-muted-foreground">{item.text}</p>
                      )}

                      {item.code && (
                        <div className="bg-secondary rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between p-4 border-b border-border">
                            <span className="text-xs font-mono text-muted-foreground">Code</span>
                            <button
                              onClick={() => copyToClipboard(item.code, `${section.id}-${itemIndex}`)}
                              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                            >
                              {copiedCode === `${section.id}-${itemIndex}` ? (
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
                          <pre className="p-4 overflow-x-auto text-sm text-foreground font-mono">
                            {item.code}
                          </pre>
                        </div>
                      )}

                      {item.items && (
                        <ul className="space-y-2">
                          {item.items.map((listItem, listIndex) => (
                            <li key={listIndex} className="flex gap-3 text-muted-foreground">
                              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                              <span>{listItem}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 glass rounded-xl p-8 border-l-4 border-primary"
        >
          <div className="flex gap-4">
            <AlertCircle className="h-6 w-6 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Need Help?</h3>
              <p className="text-muted-foreground mb-4">
                If you encounter any issues or have questions about the API, please reach out to our support team.
              </p>
              <div className="flex gap-4">
                <a href="mailto:support@swiftpay.com" className="text-primary hover:underline text-sm font-medium">
                  Email Support
                </a>
                <a href="#" className="text-primary hover:underline text-sm font-medium">
                  Community Forum
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
