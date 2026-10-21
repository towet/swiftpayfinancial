import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Check,
} from "lucide-react";

interface Till {
  id: string;
  till_name: string;
  till_number: string;
  business_short_code?: string;
  description?: string;
  created_at: string;
  is_suspended?: boolean;
}

interface TillFormState {
  tillName: string;
  tillNumber: string;
  businessShortCode: string;
  description: string;
}

const EMPTY_FORM: TillFormState = {
  tillName: "",
  tillNumber: "",
  businessShortCode: "",
  description: "",
};

export default function DashboardTills() {
  const { toast } = useToast();

  const [tills, setTills] = useState<Till[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state: null = closed, "add" = adding, string id = editing that till
  const [modalMode, setModalMode] = useState<null | "add" | string>(null);
  const [form, setForm] = useState<TillFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const token = () => localStorage.getItem("token");

  // ─── Fetch tills ─────────────────────────────────────────────────────────
  const fetchTills = async () => {
    try {
      const res = await axios.get("/api/tills", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setTills(res.data.tills || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load tills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Open modals ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModalMode("add");
  };

  const openEdit = (till: Till) => {
    setForm({
      tillName: till.till_name,
      tillNumber: till.till_number,
      businessShortCode: till.business_short_code || "",
      description: till.description || "",
    });
    setModalMode(till.id);
  };

  const closeModal = () => {
    setModalMode(null);
    setForm(EMPTY_FORM);
  };

  // ─── Submit (add or edit) ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.tillName.trim() || !form.tillNumber.trim()) {
      toast({
        title: "Validation error",
        description: "Till name and till number are required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === "add") {
        const res = await axios.post(
          "/api/tills",
          {
            tillName: form.tillName.trim(),
            tillNumber: form.tillNumber.trim(),
            businessShortCode: form.businessShortCode.trim() || undefined,
            description: form.description.trim(),
          },
          { headers: { Authorization: `Bearer ${token()}` } }
        );
        setTills((prev) => [res.data.till, ...prev]);
        toast({ title: "Success", description: "Till created successfully" });
      } else {
        // editing – modalMode is the till id
        const res = await axios.put(
          `/api/tills/${modalMode}`,
          {
            tillName: form.tillName.trim(),
            tillNumber: form.tillNumber.trim(),
            description: form.description.trim(),
          },
          { headers: { Authorization: `Bearer ${token()}` } }
        );
        setTills((prev) =>
          prev.map((t) => (t.id === modalMode ? res.data.till : t))
        );
        toast({ title: "Saved", description: "Till updated successfully" });
      }
      closeModal();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message ||
          (modalMode === "add" ? "Failed to create till" : "Failed to update till"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this till? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/tills/${id}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setTills((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Deleted", description: "Till deleted successfully" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete till",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const isEditing = modalMode !== null && modalMode !== "add";
  const editingTill = isEditing ? tills.find((t) => t.id === modalMode) : null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader title="Tills" breadcrumbs={["Dashboard", "Tills"]} />

        <div className="p-6 space-y-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 mesh-gradient opacity-30" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Manage Tills</h2>
                <p className="text-muted-foreground max-w-xl">
                  Add and edit your M-Pesa tills. You can update a till's name,
                  number and description at any time — till IDs and API keys are
                  never changed when you edit.
                </p>
              </div>
              <Button variant="glow" size="lg" onClick={openAdd}>
                <Plus className="h-5 w-5 mr-2" />
                Add Till
              </Button>
            </div>
          </motion.div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tills.length === 0 ? (
            <Card className="glass border-border">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No tills yet. Click <strong>Add Till</strong> to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tills.map((till, index) => (
                <motion.div
                  key={till.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className="glass rounded-xl p-6 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-lg gradient-primary">
                        <CreditCard className="h-5 w-5 text-primary-foreground" />
                      </div>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{till.till_name}</h3>
                          {till.is_suspended && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                              Suspended
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <span>
                            <span className="font-medium text-foreground/70">Till #:</span>{" "}
                            {till.till_number}
                          </span>
                          {till.business_short_code && (
                            <span>
                              <span className="font-medium text-foreground/70">Short Code:</span>{" "}
                              {till.business_short_code}
                            </span>
                          )}
                        </div>

                        {till.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-lg">
                            {till.description}
                          </p>
                        )}

                        {/* Till ID – read-only, clearly labelled */}
                        <p className="text-xs text-muted-foreground/60 font-mono mt-1 truncate">
                          ID: {till.id}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(till)}
                        title="Edit till"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(till.id)}
                        disabled={deletingId === till.id}
                        className="hover:bg-destructive/10 hover:text-destructive"
                        title="Delete till"
                      >
                        {deletingId === till.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                    Created: {new Date(till.created_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Add / Edit Modal ── */}
      <AnimatePresence>
        {modalMode !== null && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-strong rounded-2xl p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {modalMode === "add" ? "Add New Till" : "Edit Till"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Read-only till ID banner (edit mode only) */}
              {isEditing && editingTill && (
                <div className="mb-4 rounded-lg bg-secondary/50 border border-border px-4 py-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground/70">Till ID (unchanged):</span>{" "}
                  <code className="font-mono break-all">{editingTill.id}</code>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tillName">
                    Till Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tillName"
                    placeholder="e.g. Main Counter"
                    value={form.tillName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tillName: e.target.value }))
                    }
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tillNumber">
                    Till Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tillNumber"
                    placeholder="e.g. 5001234"
                    value={form.tillNumber}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tillNumber: e.target.value }))
                    }
                    className="bg-secondary border-border"
                  />
                </div>

                {/* Business short code only shown when adding */}
                {modalMode === "add" && (
                  <div className="space-y-2">
                    <Label htmlFor="businessShortCode">
                      Business Short Code{" "}
                      <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="businessShortCode"
                      placeholder="e.g. 174379"
                      value={form.businessShortCode}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          businessShortCode: e.target.value,
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description{" "}
                    <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="description"
                    placeholder="e.g. Nairobi branch main till"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="glow"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {modalMode === "add" ? "Creating..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {modalMode === "add" ? "Create Till" : "Save Changes"}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
