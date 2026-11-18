import { useEffect, useMemo, useState } from "react";
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import axios from "axios";
import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Mail, Plus, Trash2, Lock, Eye, EyeOff } from "lucide-react";

type EmailSettings = {
  enabled: boolean;
  emails: string[];
};

export default function DashboardSettings() {
  const { toast } = useToast();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");

  // Password change state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const normalizedEmails = useMemo(() => emails.map((e) => e.trim().toLowerCase()).filter(Boolean), [emails]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get("/api/notifications/email-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const settings: EmailSettings = res.data?.settings;
      setEnabled(Boolean(settings?.enabled));
      setEmails(Array.isArray(settings?.emails) ? settings.emails : []);
    } catch (error: any) {
      toast({
        title: "Settings",
        description: error?.response?.data?.message || "Failed to load notification settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isValidEmail = (value: string) => {
    const s = value.trim().toLowerCase();
    if (!s) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  };

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();

    if (!isValidEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (normalizedEmails.includes(email)) {
      toast({
        title: "Already added",
        description: "This email is already in the list",
      });
      return;
    }

    if (normalizedEmails.length >= 5) {
      toast({
        title: "Limit reached",
        description: "You can add a maximum of 5 emails",
        variant: "destructive",
      });
      return;
    }

    setEmails((prev) => [...prev, email]);
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
  };

  const saveSettings = async () => {
    const payload: EmailSettings = {
      enabled,
      emails: normalizedEmails.slice(0, 5),
    };

    setSaving(true);
    try {
      await axios.put("/api/notifications/email-settings", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "Saved",
        description: "Email notification settings updated",
      });

      await fetchSettings();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.response?.data?.message || "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) return toast({ title: "Error", description: "All password fields required", variant: "destructive" });
    if (newPwd.length < 8) return toast({ title: "Error", description: "New password must be at least 8 characters", variant: "destructive" });
    if (newPwd !== confirmPwd) return toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
    try {
      setPwdLoading(true);
      await axios.put("/api/auth/change-password", { currentPassword: currentPwd, newPassword: newPwd }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to change password", variant: "destructive" });
    } finally { setPwdLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-0 md:ml-0 md:ml-20 lg:ml-64 pb-20 md:pb-0 transition-all duration-300 pb-20 md:pb-0">
        <DashboardHeader title="Settings" breadcrumbs={["Dashboard", "Settings"]} />

        <div className="p-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Card className="glass-strong border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Add up to 5 emails to receive successful payment notifications with full payment details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Enable email notifications</p>
                    <p className="text-sm text-muted-foreground">Send an email when a payment is successful.</p>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Notification emails ({normalizedEmails.length}/5)</p>

                  <div className="flex gap-2">
                    <Input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. finance@company.com"
                      type="email"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addEmail}
                      disabled={loading || normalizedEmails.length >= 5}
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {normalizedEmails.length === 0 ? (
                      <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                        No emails added yet.
                      </div>
                    ) : (
                      normalizedEmails.map((email) => (
                        <div key={email} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{email}</span>
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeEmail(email)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Button type="button" variant="glow" onClick={saveSettings} disabled={loading || saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Password Change Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="w-5 h-5 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your account password. Minimum 8 characters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Current Password</label>
                  <div className="relative">
                    <Input type={showPwd ? "text" : "password"} placeholder="Enter current password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">New Password</label>
                  <Input type={showPwd ? "text" : "password"} placeholder="At least 8 characters" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Confirm New Password</label>
                  <Input type={showPwd ? "text" : "password"} placeholder="Repeat new password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
                </div>
                {newPwd && confirmPwd && newPwd !== confirmPwd && (
                  <p className="text-xs text-destructive">⚠ Passwords do not match</p>
                )}
                <Button onClick={handleChangePassword} disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd || newPwd !== confirmPwd} variant="glow">
                  {pwdLoading ? "Updating…" : "Update Password"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </main>
          <MobileBottomNav />
    </div>
  );
}
