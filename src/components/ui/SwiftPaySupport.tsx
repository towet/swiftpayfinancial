import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, HeadphonesIcon, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom SwiftPay Support Icon Component
const SwiftPaySupportIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <motion.path
      d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.15L12 24L16.38 23.15C19.77 20.68 22 16.5 22 12V7L12 2Z"
      fill="url(#gradient)"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    />
    <motion.path
      d="M9 11L11 13L15 9"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeInOut" }}
    />
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
  </svg>
);

interface SwiftPaySupportProps {
  collapsed?: boolean;
  className?: string;
}

export function SwiftPaySupport({ collapsed = false, className }: SwiftPaySupportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!collapsed) {
      const timer = setTimeout(() => setShowTooltip(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
    }
  }, [collapsed]);

  const handleOpen = () => {
    setIsOpen(true);
    setShowTooltip(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage("");
    setIsTyping(false);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const encoded = encodeURIComponent(message.trim());
    window.open(`https://wa.me/254738167512?text=${encoded}`, "_blank");
    handleClose();
  };

  const handleQuickReply = (text: string) => {
    setMessage(text);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 400);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Support Button */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
          isOpen
            ? "gradient-primary text-primary-foreground glow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <div className="relative">
          <SwiftPaySupportIcon className="w-5 h-5" />
          <motion.div
            className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-medium"
          >
            Support
          </motion.span>
        )}
        
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && !isOpen && !collapsed && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-background border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap z-50"
            >
              <p className="text-xs text-foreground font-medium">Need help?</p>
              <p className="text-xs text-muted-foreground">Chat with support</p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Expanded Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={cn(
              "absolute bottom-full mb-2 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col",
              collapsed ? "left-0 w-80" : "left-0 w-80"
            )}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <HeadphonesIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">SwiftPay Support</p>
                  <p className="text-xs opacity-90">We're here to help 24/7</p>
                </div>
              </div>
              <button onClick={handleClose} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Replies */}
            <div className="p-3 border-b border-border">
              <p className="text-xs text-muted-foreground mb-2">How can we help?</p>
              <div className="flex flex-wrap gap-2">
                {["Payment issues", "API help", "Account support", "Technical question"].map((text) => (
                  <button
                    key={text}
                    onClick={() => handleQuickReply(text)}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-border bg-muted/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Describe your issue..."
                  className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    message.trim()
                      ? "bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {isTyping && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground mt-2"
                >
                  Connecting to support team...
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
