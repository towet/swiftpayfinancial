import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, CheckCheck, Zap, Shield, ShieldCheck, CreditCard, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

const typeIcon = (type: string) => {
  switch (type) {
    case 'payment_received': return <CreditCard className="w-4 h-4 text-green-400" />;
    case 'kyc_verified':     return <ShieldCheck className="w-4 h-4 text-green-400" />;
    case 'kyc_rejected':     return <Shield className="w-4 h-4 text-destructive" />;
    case 'token_topup':      return <Zap className="w-4 h-4 text-yellow-400" />;
    case 'security':         return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    default:                 return <Info className="w-4 h-4 text-primary" />;
  }
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const { data } = await axios.get('/api/notifications?limit=20', { headers });
      if (data.status === 'success') {
        setNotifications(data.notifications || []);
        setUnread(data.unread_count || 0);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60s for new notifications
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await axios.post('/api/notifications/mark-read', {}, { headers });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const clearAll = async () => {
    try {
      await axios.delete('/api/notifications', { headers });
      setNotifications([]);
      setUnread(0);
    } catch { /* silent */ }
  };

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && unread > 0) {
      // Mark all read when opening
      setTimeout(markAllRead, 1500);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg bg-secondary hover:bg-secondary/70 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1 animate-bounce">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-96 bg-card border border-border shadow-2xl rounded-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4" /> Notifications
                {unread > 0 && (
                  <span className="ml-1 text-xs bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium">
                    {unread} new
                  </span>
                )}
              </h3>
              <div className="flex gap-1">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Mark all read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex gap-3 p-4 border-b border-border/50 hover:bg-secondary/40 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                      {typeIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-tight ${!n.read ? 'text-foreground' : 'text-foreground/80'}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-border bg-secondary/20 text-center">
                <p className="text-xs text-muted-foreground">Last 20 notifications shown</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
