import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Zap, CreditCard, Menu,
  Settings, Webhook, Download, Key, BarChart3, Link2, User, Shield
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const PRIMARY_TABS = [
  { icon: LayoutDashboard, label: 'Home',    path: '/dashboard' },
  { icon: ArrowLeftRight,  label: 'Pay',     path: '/dashboard/transactions' },
  { icon: Zap,             label: 'Tokens',  path: '/dashboard/tokens' },
  { icon: CreditCard,      label: 'Accounts',path: '/dashboard/accounts' },
];

const MORE_ITEMS = [
  { icon: BarChart3, label: 'Analytics',   path: '/dashboard/analytics' },
  { icon: Download,  label: 'Withdrawals', path: '/dashboard/withdrawals' },
  { icon: Link2,     label: 'Pay Links',   path: '/dashboard/payment-links' },
  { icon: Webhook,   label: 'Webhooks',    path: '/dashboard/webhooks' },
  { icon: Key,       label: 'API Keys',    path: '/dashboard/api-keys' },
  { icon: Shield,    label: 'KYC',         path: '/dashboard/kyc' },
  { icon: User,      label: 'Profile',     path: '/profile' },
  { icon: Settings,  label: 'Settings',    path: '/dashboard/settings' },
];

export function MobileBottomNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (p: string) =>
    p === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(p);

  const go = (p: string) => { navigate(p); setOpen(false); };

  return (
    <>
      {/* Fixed bottom nav — cream bg with navy text */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden mobile-nav-safe"
        style={{
          background: 'hsl(0 0% 100%)',
          borderTop: '1px solid hsl(220 20% 88%)',
          boxShadow: '0 -4px 24px hsl(222 60% 20% / 0.08)',
        }}
      >
        <div className="flex items-center justify-around h-16">
          {PRIMARY_TABS.map(({ icon: Icon, label, path }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => go(path)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-2 min-w-[60px] transition-all duration-200"
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-green-500" />
                )}
                <div className={cn(
                  'p-1.5 rounded-xl transition-all duration-200',
                  active ? 'bg-green-50 text-green-600' : 'text-slate-400'
                )}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className={cn(
                  'text-[10px] font-bold tracking-wide',
                  active ? 'text-green-600' : 'text-slate-400'
                )}>{label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[60px] text-slate-400"
          >
            <div className="p-1.5 rounded-xl">
              <Menu size={20} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-bold tracking-wide">More</span>
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl bg-white border-t border-border" style={{ maxHeight: '72vh' }}>
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="text-foreground text-xl font-bold">More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-3 pt-4 pb-6">
            {MORE_ITEMS.map(({ icon: Icon, label, path }) => {
              const active = isActive(path);
              return (
                <button
                  key={path}
                  onClick={() => go(path)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200',
                    active
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-muted border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon size={22} />
                  <span className="text-[11px] font-semibold text-center leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
