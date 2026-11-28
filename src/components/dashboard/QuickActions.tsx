import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, QrCode, Zap, ShieldCheck, Key, BookOpen, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIONS = [
  {
    icon: Send,
    label: 'Request Payment',
    desc:  'Send STK push',
    path:  '/dashboard/accounts',
    bg:    'from-green-500 to-emerald-600',
    light: 'bg-green-50 text-green-700 border-green-200',
    glow:  'hover:shadow-[0_8px_32px_hsl(150_100%_33%/0.25)]',
  },
  {
    icon: QrCode,
    label: 'Create Pay Link',
    desc:  'Share & get paid',
    path:  '/dashboard/payment-links',
    bg:    'from-blue-500 to-indigo-600',
    light: 'bg-blue-50 text-blue-700 border-blue-200',
    glow:  'hover:shadow-[0_8px_32px_hsl(217_91%_60%/0.25)]',
  },
  {
    icon: Zap,
    label: 'Top Up Tokens',
    desc:  'Add processing credits',
    path:  '/dashboard/tokens',
    bg:    'from-orange-400 to-amber-500',
    light: 'bg-orange-50 text-orange-700 border-orange-200',
    glow:  'hover:shadow-[0_8px_32px_hsl(36_97%_50%/0.25)]',
  },
  {
    icon: ShieldCheck,
    label: 'Verify KYC',
    desc:  'Unlock full limits',
    path:  '/dashboard/kyc',
    bg:    'from-purple-500 to-violet-600',
    light: 'bg-purple-50 text-purple-700 border-purple-200',
    glow:  'hover:shadow-[0_8px_32px_hsl(263_70%_60%/0.25)]',
  },
  {
    icon: Key,
    label: 'API Keys',
    desc:  'Developer access',
    path:  '/dashboard/api-keys',
    bg:    'from-slate-600 to-slate-800',
    light: 'bg-slate-100 text-slate-700 border-slate-200',
    glow:  'hover:shadow-[0_8px_32px_hsl(220_15%_46%/0.25)]',
  },
  {
    icon: BookOpen,
    label: 'API Docs',
    desc:  'Integration guide',
    path:  '/dashboard/api-keys',
    bg:    'from-teal-500 to-cyan-600',
    light: 'bg-teal-50 text-teal-700 border-teal-200',
    glow:  'hover:shadow-[0_8px_32px_hsl(173_80%_40%/0.25)]',
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground">Quick Actions</h3>
        <span className="text-[11px] font-medium text-muted-foreground">Shortcuts</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-3 flex-1">
        {ACTIONS.map(({ icon: Icon, label, desc, path, bg, light, glow }, i) => (
          <motion.button
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(path)}
            className={cn(
              'group relative min-w-0 overflow-hidden flex flex-col justify-between gap-2.5 p-3.5 rounded-xl border text-left',
              'bg-card transition-all duration-200',
              light, glow
            )}
          >
            <div className="flex items-start justify-between gap-2">
              {/* Icon with gradient bg */}
              <div className={cn('w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-sm', bg)}>
                <Icon size={17} />
              </div>
              <ArrowRight
                size={14}
                className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0 mt-1"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-foreground leading-tight truncate">{label}</p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
