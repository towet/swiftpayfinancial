import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Webhook, Plus, Loader2, CheckCircle2, AlertCircle, Copy, Check, Trash2, Edit2, Zap, Eye } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface WebhookData {
  id: string;
  url: string;
  events: string[];
  description: string;
  is_active: boolean;
  created_at: string;
}

const WEBHOOK_EVENTS = [
  { id: "payment.success", label: "Payment Success", description: "When a payment is completed successfully" },
  { id: "payment.failed", label: "Payment Failed", description: "When a payment fails" },
  { id: "payment.pending", label: "Payment Pending", description: "When a payment is pending" },
  { id: "till.created", label: "Till Created", description: "When a new till is created" },
  { id: "till.updated", label: "Till Updated", description: "When a till is updated" },
  { id: "till.deleted", label: "Till Deleted", description: "When a till is deleted" },
  { id: "api_key.created", label: "API Key Created", description: "When a new API key is generated" },
  { id: "api_key.deleted", label: "API Key Deleted", description: "When an API key is deleted" },
  { id: "transaction.created", label: "Transaction Created", description: "When a new transaction is recorded" }
];

export default function DashboardWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    url: "",
    description: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/webhooks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWebhooks(response.data.webhooks || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load webhooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      if (editingId) {
        // Update webhook
        const response = await axios.put(
          `/api/webhooks/${editingId}`,
          {
            url: formData.url,
            events: selectedEvents,
            description: formData.description,
            is_active: true,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setWebhooks(webhooks.map(w => w.id === editingId ? response.data.webhook : w));
        toast({
          title: "Success",
          description: "Webhook updated successfully",
        });
      } else {
        // Create new webhook
        const response = await axios.post(
          "/api/webhooks",
          {
            url: formData.url,
            events: selectedEvents,
            description: formData.description,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setWebhooks([...webhooks, response.data.webhook]);
        toast({
          title: "Success",
          description: "Webhook created successfully",
        });
      }

      setFormData({ url: "", description: "" });
      setSelectedEvents([]);
      setShowForm(false);
      setEditingId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save webhook",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (webhook: WebhookData) => {
    setEditingId(webhook.id);
    setFormData({
      url: webhook.url,
      description: webhook.description,
    });
    setSelectedEvents(webhook.events);
    setShowForm(true);
  };

  const handleDelete = async (webhookId: string) => {
    setDeletingId(webhookId);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/webhooks/${webhookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setWebhooks(webhooks.filter(w => w.id !== webhookId));
      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete webhook",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTestingId(webhookId);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `/api/webhooks/${webhookId}/test`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "Success",
        description: `Webhook test successful (${response.data.response.statusCode})`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Webhook test failed",
        variant: "destructive",
      });
    } finally {
      setTestingId(null);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader 
          title="Webhooks" 
          breadcrumbs={["Dashboard", "Webhooks"]} 
        />

        <div className="p-6 space-y-6">
          {/* Create/Edit Webhook Form */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-foreground mb-6">
                {editingId ? "Edit Webhook" : "Create New Webhook"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="url">Webhook URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://your-app.com/webhooks/swiftpay"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The URL where we'll send webhook events
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Payment notifications webhook"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Events Selection */}
                <div className="space-y-3">
                  <Label>Subscribe to Events</Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {WEBHOOK_EVENTS.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => toggleEvent(event.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedEvents.includes(event.id)
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`h-5 w-5 rounded border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${
                            selectedEvents.includes(event.id)
                              ? "bg-primary border-primary"
                              : "border-border"
                          }`}>
                            {selectedEvents.includes(event.id) && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{event.label}</p>
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button type="submit" variant="glow" disabled={submitting || selectedEvents.length === 0}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      editingId ? "Update Webhook" : "Create Webhook"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ url: "", description: "" });
                      setSelectedEvents([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Webhooks List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : webhooks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-12 text-center"
              >
                <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-6">No webhooks created yet</p>
                <Button
                  variant="glow"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Webhook
                </Button>
              </motion.div>
            ) : (
              <>
                {!showForm && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setShowForm(true)}
                    className="w-full glass rounded-xl p-6 flex items-center justify-center gap-2 hover:border-primary/30 transition-all border-dashed border-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Add New Webhook</span>
                  </motion.button>
                )}

                {webhooks.map((webhook, index) => (
                  <motion.div
                    key={webhook.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass rounded-xl p-6 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-lg gradient-primary">
                          <Webhook className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground">{webhook.description || "Webhook"}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              webhook.is_active
                                ? "bg-success/20 text-success"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {webhook.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <code className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded truncate">
                              {webhook.url}
                            </code>
                            <button
                              onClick={() => copyToClipboard(webhook.url, webhook.id)}
                              className="p-1 hover:bg-secondary rounded transition"
                            >
                              {copiedId === webhook.id ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {webhook.events.map((event) => (
                              <span
                                key={event}
                                className="px-2 py-1 rounded text-xs bg-secondary text-foreground"
                              >
                                {WEBHOOK_EVENTS.find(e => e.id === event)?.label || event}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleTestWebhook(webhook.id)}
                          disabled={testingId === webhook.id}
                          className="p-2 hover:bg-secondary rounded transition"
                          title="Test webhook"
                        >
                          {testingId === webhook.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Zap className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(webhook)}
                          className="p-2 hover:bg-secondary rounded transition"
                          title="Edit webhook"
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </button>
                        <button
                          onClick={() => handleDelete(webhook.id)}
                          disabled={deletingId === webhook.id}
                          className="p-2 hover:bg-destructive/10 rounded transition"
                          title="Delete webhook"
                        >
                          {deletingId === webhook.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(webhook.created_at).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>

          {/* Info Section */}
          {webhooks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6 border-l-4 border-primary"
            >
              <h4 className="font-semibold text-foreground mb-3">Webhook Payload Format</h4>
              <div className="bg-secondary rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-foreground font-mono">{`{
  "event": "payment.success",
  "timestamp": "2024-12-13T10:00:00Z",
  "data": {
    "transactionId": "txn_123",
    "amount": 100,
    "phone": "254712345678",
    "status": "success"
  }
}`}</pre>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
