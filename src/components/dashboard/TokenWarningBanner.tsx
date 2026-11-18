import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, X, Info, Sparkles } from "lucide-react";
import axios from "axios";

// Low balance threshold — warn when balance falls at or below this (20 KES)
const LOW_BALANCE_THRESHOLD = 20;

export function TokenWarningBanner() {
  const [balance, setBalance] = useState<number | null>(null);
  const [totalToppedUp, setTotalToppedUp] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data } = await axios.get('/api/tokens');
        if (data.status === 'success') {
          setBalance(Number(data.account?.balance ?? 0));
          setTotalToppedUp(Number(data.account?.total_topped_up ?? 0));
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

  // Show if balance is loaded, <= 20 KES, and not dismissed
  const showBanner = balance !== null && balance <= LOW_BALANCE_THRESHOLD && !dismissed;
  const isNewMerchant = (totalToppedUp === 0 || totalToppedUp === null) && balance === 0;
  const isCritical = balance !== null && balance <= 0 && !isNewMerchant;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className={[
            "border-b px-6 py-3.5",
            isNewMerchant
              ? "bg-primary/10 border-primary/25 text-primary"
              : isCritical
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-warning/10 border-warning/30 text-warning",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4 max-w-screen-xl mx-auto">
            <div className="flex items-start gap-3">
              {isNewMerchant ? (
                <div className="p-1.5 rounded-lg bg-primary/20 text-primary mt-0.5 flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
              ) : isCritical ? (
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 animate-pulse text-destructive" />
              ) : (
                <Zap className="w-5 h-5 mt-0.5 flex-shrink-0 text-warning" />
              )}

              <div>
                <p className="font-semibold text-sm">
                  {isNewMerchant
                    ? "👋 Welcome to SwiftPay! Top up your Token Wallet for live M-Pesa STK Push"
                    : isCritical
                    ? "⚠️ Your token balance is empty — live transactions are paused"
                    : `⚡ Low token balance: KES ${balance} remaining`}
                </p>
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed text-foreground/80">
                  {isNewMerchant
                    ? "SwiftPay uses a prepaid token wallet to process live M-Pesa STK Push transactions. Your initial test STK transactions are 100% complimentary & free so you can test integration! Top up tokens (from KES 10) to ensure live customer payments process smoothly."
                    : isCritical
                    ? "SwiftPay works on a pay-as-you-go model. Your token wallet pays the small platform fee on each transaction. This is NOT an issue with M-Pesa or your payment accounts — simply top up your tokens to resume accepting payments."
                    : "Your token balance is running low (≤ KES 20). Platform fees are deducted automatically per transaction. Top up now to avoid payment interruptions."}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2.5">
                  <Link
                    to="/dashboard/tokens"
                    className={[
                      "inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all hover:scale-105 shadow-sm",
                      isNewMerchant
                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                        : isCritical
                        ? "bg-destructive text-white border-destructive hover:bg-destructive/90"
                        : "bg-warning text-black border-warning hover:bg-warning/90",
                    ].join(" ")}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Top Up Tokens Now
                  </Link>

                  {isNewMerchant ? (
                    <span className="text-xs opacity-75 font-medium flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      Initial test STK push requests are completely free
                    </span>
                  ) : (
                    <span className="text-xs opacity-60 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      Your M-Pesa & payment accounts are working fine
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex-shrink-0 mt-0.5"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
