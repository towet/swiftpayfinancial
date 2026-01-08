import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Lock, Mail, Shield } from "lucide-react";

export function SuperAdminLoginModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!challengeToken) {
        const response = await axios.post("/api/auth/login", { email, password, rememberMe: true });

        if (response.data.status === "otp_required") {
          setChallengeToken(response.data.challengeToken);
          setOtpExpiresAt(response.data.expiresAt || null);
          setOtp("");
          toast({
            title: "OTP sent",
            description: "Check your email for the 6-digit code.",
          });
          return;
        }

        if (response.data.status === "success") {
          const { token, user } = response.data;
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("lastActivityAt", String(Date.now()));

          if (user.role === "super_admin") {
            toast({
              title: "Welcome, Super Admin",
              description: "Access granted to Super Admin Dashboard",
            });
            onOpenChange(false);
            navigate("/dashboard/super-admin");
          } else {
            toast({
              title: "Access Denied",
              description: "This account does not have super admin privileges",
              variant: "destructive",
            });
          }
        }

        return;
      }

      const verifyRes = await axios.post("/api/auth/login/verify-otp", {
        otp,
        challengeToken,
        rememberMe: true
      });

      if (verifyRes.data.status === "success") {
        const { token, user } = verifyRes.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("lastActivityAt", String(Date.now()));

        if (user.role === "super_admin") {
          toast({
            title: "Welcome, Super Admin",
            description: "Access granted to Super Admin Dashboard",
          });
          onOpenChange(false);
          navigate("/dashboard/super-admin");
        } else {
          toast({
            title: "Access Denied",
            description: "This account does not have super admin privileges",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!challengeToken) return;
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/login/resend-otp", { challengeToken });
      if (response.data.status === "success") {
        setOtpExpiresAt(response.data.expiresAt || null);
        toast({ title: "OTP resent", description: "Check your email for the new code." });
      }
    } catch (error: any) {
      toast({
        title: "Resend Failed",
        description: error.response?.data?.message || "Could not resend OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setChallengeToken(null);
    setOtp("");
    setOtpExpiresAt(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Super Admin Access
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={!!challengeToken}
              />
            </div>
          </div>
          {!challengeToken && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}

          {challengeToken && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="otp">Email OTP</Label>
                <button type="button" onClick={handleBack} className="text-sm text-primary hover:underline">
                  Back
                </button>
              </div>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center tracking-[0.35em]"
                required
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{otpExpiresAt ? `Expires: ${new Date(otpExpiresAt).toLocaleTimeString()}` : ""}</span>
                <button type="button" onClick={handleResendOtp} className="text-primary hover:underline">
                  Resend OTP
                </button>
              </div>
            </div>
          )}
          <Button type="submit" className="w-full gradient-primary" disabled={loading}>
            {loading ? (challengeToken ? "Verifying..." : "Sending OTP...") : (challengeToken ? "Verify OTP" : "Access Dashboard")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
