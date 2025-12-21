import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Copy, Trash2, Plus, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface ApiKey {
  id: string;
  key_name: string;
  api_key: string;
  api_secret: string;
  is_active: boolean;
  till_id: string;
  created_at: string;
}

interface Till {
  id: string;
  till_name: string;
}

export default function DashboardApiKeys() {
  const [showModal, setShowModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [tills, setTills] = useState<Till[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");
  const [selectedTill, setSelectedTill] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [keysRes, tillsRes] = await Promise.all([
        axios.get("/api/keys", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/tills", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setApiKeys(keysRes.data.keys || []);
      setTills(tillsRes.data.tills || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!keyName || !selectedTill) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/keys",
        {
          keyName,
          tillId: selectedTill,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setApiKeys([...apiKeys, response.data.apiKey]);
      setKeyName("");
      setSelectedTill("");
      setShowModal(false);

      toast({
        title: "Success",
        description: "API key generated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate key",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const handleDeleteKey = async (keyId: string) => {
    setDeletingId(keyId);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/keys/${keyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setApiKeys(apiKeys.filter(k => k.id !== keyId));
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete API key",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader 
          title="API Keys" 
          breadcrumbs={["Dashboard", "API Keys"]} 
        />

        <div className="p-6 space-y-6">
          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 mesh-gradient opacity-30" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
                <p className="text-muted-foreground max-w-xl">
                  Use API keys to authenticate your requests to the SwiftPay API. Keep your secret keys secure and never share them publicly.
                </p>
              </div>
              <Button 
                variant="glow" 
                size="lg"
                onClick={() => setShowModal(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Generate New Key
              </Button>
            </div>
          </motion.div>

          {/* Keys List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No API keys generated yet</p>
              </div>
            ) : (
              apiKeys.map((key, index) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-xl p-6 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-lg gradient-primary">
                        <Key className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{key.key_name}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            key.is_active
                              ? "bg-success/20 text-success"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {key.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">API Key:</span>
                            <code className="text-sm font-mono text-foreground bg-secondary px-2 py-0.5 rounded truncate">
                              {key.api_key}
                            </code>
                            <button
                              onClick={() => handleCopy(key.api_key, `${key.id}-key`)}
                              className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                            >
                              {copiedKey === `${key.id}-key` ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      disabled={deletingId === key.id}
                      className="p-2 hover:bg-destructive/10 rounded transition flex-shrink-0"
                      title="Delete API key"
                    >
                      {deletingId === key.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                      )}
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-6 text-sm text-muted-foreground">
                    <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-2xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">Generate New API Key</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production API"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Select Till</Label>
                <select
                  value={selectedTill}
                  onChange={(e) => setSelectedTill(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-secondary text-foreground"
                >
                  <option value="">Choose a till...</option>
                  {tills.map((till) => (
                    <option key={till.id} value={till.id}>
                      {till.till_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="glow" 
                className="flex-1" 
                onClick={handleGenerateKey}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  "Generate Key"
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}