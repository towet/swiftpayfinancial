import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, CreditCard, Store, Link as LinkIcon, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface SearchResult {
  type: 'transaction' | 'till' | 'link';
  label: string;
  sub: string;
  url: string;
  id: string;
}

const typeIcon = (type: string) => {
  if (type === 'transaction') return <CreditCard className="w-4 h-4 text-primary" />;
  if (type === 'till')        return <Store className="w-4 h-4 text-safaricom" />;
  return <LinkIcon className="w-4 h-4 text-purple-400" />;
};

const typeLabel = (type: string) => {
  if (type === 'transaction') return 'Transaction';
  if (type === 'till')        return 'Till';
  return 'Payment Link';
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const token = localStorage.getItem('token');

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(data.results || []);
      setOpen(true);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative hidden md:block" ref={ref}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder="Search… (Ctrl+K)"
        className="w-64 pl-9 pr-8 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
      />
      {query && (
        <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {loading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            className="absolute top-11 left-0 w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {results.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {loading ? 'Searching…' : `No results for "${query}"`}
              </div>
            ) : (
              <div className="py-2">
                {results.map((r, i) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      {typeIcon(r.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{typeLabel(r.type)} · {r.sub}</p>
                    </div>
                  </button>
                ))}
                <div className="px-4 py-2 border-t border-border mt-1">
                  <p className="text-[10px] text-muted-foreground/60">{results.length} result{results.length !== 1 ? 's' : ''} — press Esc to close</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
