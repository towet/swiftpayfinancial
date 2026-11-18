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
    <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5">
      <h3 className="text-base font-bold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACTIONS.map(({ icon: Icon, label, desc, path, bg, light, glow }, i) => (
          <motion.button
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(path)}
            className={cn(
              'group relative flex flex-col gap-2.5 p-4 rounded-2xl border text-left',
              'bg-card transition-all duration-250',
              light, glow
            )}
          >
            {/* Icon with gradient bg */}
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-md', bg)}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-snug">{label}</p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
            </div>
            <ArrowRight
              size={14}
              className="absolute top-3 right-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200"
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
