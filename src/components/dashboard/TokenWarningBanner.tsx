import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, X, Info } from "lucide-react";
import axios from "axios";

// Low balance threshold — warn when balance falls below this
const LOW_BALANCE_THRESHOLD = 50;

export function TokenWarningBanner() {
  const [balance, setBalance] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data } = await axios.get('/api/tokens');
        if (data.status === 'success') {
          setBalance(Number(data.account?.balance ?? 0));
        }
      } catch { /* silent — don't block UI */ }
    };
    fetchBalance();
    // Re-check every 60 seconds in case they top up in another tab
    const id = window.setInterval(fetchBalance, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Check if user dismissed this session
  useEffect(() => {
    if (sessionStorage.getItem('token-banner-dismissed') === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('token-banner-dismissed', 'true');
  };

  // Don't show if balance is fine or not loaded or dismissed
  const showBanner = balance !== null && balance < LOW_BALANCE_THRESHOLD && !dismissed;
  const isCritical = balance !== null && balance <= 0;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className={[
            "border-b px-6 py-3",
            isCritical
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-warning/10 border-warning/30 text-warning",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4 max-w-screen-xl mx-auto">
            <div className="flex items-start gap-3">
              {isCritical
                ? <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 animate-pulse" />
                : <Zap className="w-5 h-5 mt-0.5 flex-shrink-0" />}

              <div>
                <p className="font-semibold text-sm">
                  {isCritical
                    ? "⚠️ Your token balance is empty — transactions are paused"
                    : `⚡ Low token balance: KES ${balance} remaining`}
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  {isCritical
                    ? "SwiftPay works on a pay-as-you-go model. Your token wallet pays the small platform fee on each transaction. This is NOT an issue with M-Pesa or your payment accounts — simply top up your tokens to resume accepting payments."
                    : "Your token balance is running low. Platform fees are deducted automatically per transaction. Top up now to avoid interruptions."}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Link
                    to="/dashboard/tokens"
                    className={[
                      "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all hover:scale-105",
                      isCritical
                        ? "bg-destructive text-white border-destructive hover:bg-destructive/90"
                        : "bg-warning text-black border-warning hover:bg-warning/90",
                    ].join(" ")}
                  >
                    <Zap className="w-3 h-3" />
                    Top Up Tokens Now
                  </Link>
                  <span className="text-xs opacity-60 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Your M-Pesa & payment accounts are working fine
                  </span>
                </div>
              </div>
            </div>

            {/* Dismiss — only for low balance warning, not critical */}
            {!isCritical && (
              <button
                onClick={handleDismiss}
                className="p-1 rounded hover:bg-warning/20 transition-colors flex-shrink-0 mt-0.5"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
