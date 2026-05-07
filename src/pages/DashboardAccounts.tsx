import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, CreditCard, Plus, Loader2, CheckCircle2, AlertCircle, Copy, Check, Edit2, Trash2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface Till {
  id: string;
  till_name: string;
  till_number: string;
  is_active: boolean;
  created_at: string;
}

export default function DashboardAccounts() {
  const [tills, setTills] = useState<Till[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tillName: "",
    tillNumber: "",
    description: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTills();
  }, []);

  const fetchTills = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/tills", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTills(response.data.tills || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tills",
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
        // Update till
        const response = await axios.put(
          `/api/tills/${editingId}`,
          {
            tillName: formData.tillName,
            tillNumber: formData.tillNumber,
            description: formData.description,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setTills(tills.map(t => t.id === editingId ? response.data.till : t));
        toast({
          title: "Success",
          description: "Till updated successfully",
        });
      } else {
        // Create new till
        const response = await axios.post(
          "/api/tills",
          {
            tillName: formData.tillName,
            tillNumber: formData.tillNumber,
            description: formData.description,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setTills([...tills, response.data.till]);
        toast({
          title: "Success",
          description: "Till created successfully",
        });
      }

      setFormData({ tillName: "", tillNumber: "", description: "" });
      setShowForm(false);
      setEditingId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save till",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (till: Till) => {
    setEditingId(till.id);
    setFormData({
      tillName: till.till_name,
      tillNumber: till.till_number,
      description: "",
    });
    setShowForm(true);
  };

  const handleDelete = async (tillId: string) => {
    setDeletingId(tillId);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/tills/${tillId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTills(tills.filter(t => t.id !== tillId));
      toast({
        title: "Success",
        description: "Till deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete till",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
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
          title="Payment Accounts (Tills)" 
          breadcrumbs={["Dashboard", "Accounts"]} 
        />

        <div className="p-6 space-y-6">
          {/* Create/Edit Till Form */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-foreground mb-6">
                {editingId ? "Edit Till" : "Create New Till"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tillName">Till Name</Label>
                    <Input
                      id="tillName"
                      placeholder="e.g., Main Store"
                      value={formData.tillName}
                      onChange={(e) => setFormData({ ...formData, tillName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tillNumber">Till Number</Label>
                    <Input
                      id="tillNumber"
                      placeholder="e.g., 123456"
                      value={formData.tillNumber}
                      onChange={(e) => setFormData({ ...formData, tillNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="glow" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Till"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Tills Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tills.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No tills created yet</p>
              </div>
            ) : (
              tills.map((till, index) => (
                <motion.div
                  key={till.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg gradient-primary group-hover:scale-110 transition-transform">
                      <CreditCard className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(till)}
                        className="p-2 hover:bg-secondary rounded transition"
                        title="Edit till"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </button>
                      <button
                        onClick={() => handleDelete(till.id)}
                        disabled={deletingId === till.id}
                        className="p-2 hover:bg-destructive/10 rounded transition"
                        title="Delete till"
                      >
                        {deletingId === till.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{till.till_name}</h3>
                      <p className="text-sm text-muted-foreground">Till: {till.till_number}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {till.is_active ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="text-sm text-success font-medium">Active</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-warning" />
                          <span className="text-sm text-warning font-medium">Inactive</span>
                        </>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Till ID</p>
                      <div className="flex items-center justify-between bg-secondary rounded p-2">
                        <code className="text-xs text-foreground font-mono truncate">{till.id}</code>
                        <button
                          onClick={() => copyToClipboard(till.id, till.id)}
                          className="ml-2 p-1 hover:bg-primary/20 rounded transition"
                        >
                          {copiedId === till.id ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}

            {/* Add New Till Card */}
            {!showForm && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
                onClick={() => setShowForm(true)}
                className="glass rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary/30 transition-all duration-300 min-h-[250px] border-dashed border-2"
              >
                <div className="p-4 rounded-full bg-secondary">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-foreground">Add New Till</h3>
                  <p className="text-sm text-muted-foreground">Create a new payment till</p>
                </div>
              </motion.button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}