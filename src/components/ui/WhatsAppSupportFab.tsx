import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, HeadphonesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function WhatsAppSupportFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPulsed, setIsPulsed] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const pulse = setInterval(() => {
      setIsPulsed(true);
      setTimeout(() => setIsPulsed(false), 1000);
    }, 8000);
    return () => clearInterval(pulse);
  }, []);

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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-background border border-border rounded-lg px-4 py-2 shadow-lg max-w-[200px]"
          >
            <p className="text-sm text-foreground font-medium">Need help?</p>
            <p className="text-xs text-muted-foreground">Chat with us on WhatsApp</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-background border border-border rounded-2xl shadow-2xl w-80 max-h-[500px] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <HeadphonesIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">SwiftPay Support</p>
                  <p className="text-xs opacity-90">Typically replies instantly</p>
                </div>
              </div>
              <button onClick={handleClose} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Replies */}
            <div className="p-3 border-b border-border">
              <p className="text-xs text-muted-foreground mb-2">Quick replies</p>
              <div className="flex flex-wrap gap-2">
                {["I need help with payments", "API integration issue", "Account problem", "Other"].map((text) => (
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
                  placeholder="Type your message..."
                  className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    message.trim()
                      ? "bg-green-500 hover:bg-green-600 text-white shadow-lg"
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
                  Opening WhatsApp...
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={isOpen ? handleClose : handleOpen}
        className={cn(
          "relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all",
          isOpen
            ? "bg-muted hover:bg-muted/80 text-foreground"
            : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isPulsed && !isOpen ? { scale: [1, 1.1, 1] } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="whatsapp"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sparkle effects */}
        {!isOpen && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full bg-white opacity-0"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
            >
              <Sparkles className="w-3 h-3 text-yellow-300" />
            </motion.div>
          </>
        )}
      </motion.button>
    </div>
  );
}
