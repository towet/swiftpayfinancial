import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Twitter, Linkedin, ArrowUp, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import logo from "@/assets/swiftlogosss-Photoroom.png";

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "API"],
  Developers: ["Documentation", "SDKs", "Webhooks", "Status"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security", "Compliance"],
};

export function Footer() {
  const navigate = useNavigate();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminOtp, setAdminOtp] = useState("");
  const [adminChallengeToken, setAdminChallengeToken] = useState<string | null>(null);
  const [adminOtpExpiresAt, setAdminOtpExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!adminChallengeToken) {
        const response = await axios.post("/api/auth/login", {
          email: adminEmail,
          password: adminPassword,
          rememberMe: true
        });

        if (response.data.status === "otp_required") {
          setAdminChallengeToken(response.data.challengeToken);
          setAdminOtpExpiresAt(response.data.expiresAt || null);
          setAdminOtp("");
          alert("OTP sent to your email");
          return;
        }

        if (response.data.status === "success") {
          const { token, user } = response.data;
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("lastActivityAt", String(Date.now()));

          if (user?.role === "super_admin") {
            setShowAdminModal(false);
            navigate("/dashboard/super-admin");
          } else {
            alert("Access denied: not a super admin");
          }
        }

        return;
      }

      const verifyRes = await axios.post("/api/auth/login/verify-otp", {
        otp: adminOtp,
        challengeToken: adminChallengeToken,
        rememberMe: true
      });

      if (verifyRes.data.status === "success") {
        const { token, user } = verifyRes.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("lastActivityAt", String(Date.now()));

        if (user?.role === "super_admin") {
          setShowAdminModal(false);
          navigate("/dashboard/super-admin");
        } else {
          alert("Access denied: not a super admin");
        }
      }
    } catch (error) {
      alert("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminResendOtp = async () => {
    if (!adminChallengeToken) return;
    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/login/resend-otp", { challengeToken: adminChallengeToken });
      if (response.data.status === "success") {
        setAdminOtpExpiresAt(response.data.expiresAt || null);
        alert("OTP resent");
      }
    } catch (error) {
      alert("Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminBack = () => {
    setAdminChallengeToken(null);
    setAdminOtp("");
    setAdminOtpExpiresAt(null);
  };

  return (
    <footer className="relative pt-24 pb-12 border-t border-border">
      <div className="absolute inset-0 bg-gradient-to-t from-card/50 to-transparent" />
      
      <div className="container relative z-10 px-4">
        <div className="grid lg:grid-cols-6 gap-12 mb-16">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-12 w-12 overflow-hidden rounded-lg">
                <img src={logo} alt="SwiftPay" className="h-full w-full object-contain scale-[1.8]" />
              </div>
              <span className="text-2xl font-bold gradient-text">SwiftPay</span>
            </Link>
            <p className="text-muted-foreground">
              Modern payment infrastructure for African businesses. Accept M-Pesa payments with enterprise-grade APIs.
            </p>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-secondary border-border focus:border-primary/50"
                />
                <Button variant="gradient">Subscribe</Button>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h4 className="font-semibold text-foreground">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 SwiftPay. All rights reserved.
            <button
              onClick={() => setShowAdminModal(true)}
              className="ml-2 text-muted-foreground/60 hover:text-primary transition-colors"
              title="Admin Access"
            >
              <Lock className="h-3 w-3 inline" />
            </button>
          </p>
          
          <div className="flex items-center gap-4">
            {[Github, Twitter, Linkedin].map((Icon, index) => (
              <motion.a
                key={index}
                href="#"
                whileHover={{ scale: 1.1, y: -2 }}
                className="p-2 rounded-lg glass hover:border-primary/30 transition-colors"
              >
                <Icon className="h-5 w-5 text-muted-foreground hover:text-primary" />
              </motion.a>
            ))}
          </div>

          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 rounded-full gradient-primary glow-sm"
          >
            <ArrowUp className="h-5 w-5 text-primary-foreground" />
          </motion.button>
        </div>
      </div>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Admin Access</h2>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                <Input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-secondary border-border"
                  required
                  disabled={!!adminChallengeToken}
                />
              </div>
              {!adminChallengeToken && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
                  <Input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-secondary border-border"
                    required
                  />
                </div>
              )}

              {adminChallengeToken && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Email OTP</label>
                    <button
                      type="button"
                      onClick={handleAdminBack}
                      className="text-sm text-primary hover:underline"
                    >
                      Back
                    </button>
                  </div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={adminOtp}
                    onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="bg-secondary border-border text-center tracking-[0.35em]"
                    required
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {adminOtpExpiresAt ? `Expires: ${new Date(adminOtpExpiresAt).toLocaleTimeString()}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={handleAdminResendOtp}
                      className="text-primary hover:underline"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}
              <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                {isLoading ? (adminChallengeToken ? "Verifying..." : "Sending OTP...") : (adminChallengeToken ? "Verify OTP" : "Access Dashboard")}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </footer>
  );
}