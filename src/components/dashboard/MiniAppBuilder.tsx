import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Save, Smartphone, Layout, Palette, Package, 
  Sparkles, Trash2, Image as ImageIcon, ExternalLink, 
  CheckCircle2, MousePointer2, Zap, Globe, Share2, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import axios from 'axios';

// --- Types ---
interface Product {
  id: string;
  name: string;
  price: string;
  stock: string;
  image_url?: string;
}

interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
  glassEffect: boolean;
}

export function MiniAppBuilder() {
  // --- State ---
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: '', price: '', stock: '' }
  ]);
  const [theme, setTheme] = useState<ThemeConfig>({
    primaryColor: '#6366f1',
    accentColor: '#f43f5e',
    fontFamily: 'Inter',
    borderRadius: '1rem',
    glassEffect: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'settings'>('content');
  
  const { toast } = useToast();

  // --- Logic ---
  const addProduct = () => {
    setProducts([...products, { id: Math.random().toString(36).substr(2, 9), name: '', price: '', stock: '' }]);
  };

  const removeProduct = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof Product, value: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/mini-apps', {
        title,
        slug,
        description,
        theme_config: theme,
        products: products.filter(p => p.name !== '')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        toast({ 
          title: "Masterpiece Saved!", 
          description: "Your storefront is now live and ready to win customers.",
          className: "bg-green-500 text-white border-none shadow-lg shadow-green-500/20"
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save your creation.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- UI Components ---
  const TabButton = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium",
        activeTab === id 
          ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105" 
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-2 lg:p-6 min-h-[800px]">
      {/* --- Left Panel: Controls --- */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 space-y-6"
      >
        {/* Header Controls */}
        <div className="glass-strong p-4 rounded-3xl flex items-center justify-between border border-white/20 shadow-xl">
          <div className="flex gap-2">
            <TabButton id="content" icon={Package} label="Content" />
            <TabButton id="design" icon={Palette} label="Design" />
            <TabButton id="settings" icon={Globe} label="Publish" />
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="rounded-full px-6 bg-gradient-to-r from-indigo-600 to-rose-500 hover:scale-105 transition-transform shadow-lg"
          >
            {isSaving ? <Zap className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {isSaving ? 'Publishing...' : 'Go Live'}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="glass p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Layout className="h-5 w-5 text-indigo-500" />
                  Store Identity
                </h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Store Name</label>
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="e.g. The Artisan Collective"
                      className="bg-white/5 border-white/10 focus:border-indigo-500/50 rounded-xl h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tagline</label>
                    <Input 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="e.g. Handcrafted with love in Nairobi"
                      className="bg-white/5 border-white/10 focus:border-indigo-500/50 rounded-xl h-12"
                    />
                  </div>
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Package className="h-5 w-5 text-rose-500" />
                    Product Catalog
                  </h3>
                  <Button onClick={addProduct} variant="outline" size="sm" className="rounded-full border-dashed">
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {products.map((p, i) => (
                    <motion.div 
                      layout
                      key={p.id}
                      className="flex gap-3 items-start group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-indigo-500/30 transition-colors">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 grid grid-cols-12 gap-2">
                        <div className="col-span-6">
                          <Input 
                            placeholder="Product Name" 
                            value={p.name}
                            onChange={(e) => updateProduct(p.id, 'name', e.target.value)}
                            className="bg-white/5 border-white/10 rounded-xl"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input 
                            placeholder="Price" 
                            type="number"
                            value={p.price}
                            onChange={(e) => updateProduct(p.id, 'price', e.target.value)}
                            className="bg-white/5 border-white/10 rounded-xl"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input 
                            placeholder="Qty" 
                            type="number"
                            value={p.stock}
                            onChange={(e) => updateProduct(p.id, 'stock', e.target.value)}
                            className="bg-white/5 border-white/10 rounded-xl"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <button 
                            onClick={() => removeProduct(p.id)}
                            className="text-muted-foreground hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'design' && (
            <motion.div
              key="design"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="glass p-6 rounded-3xl border border-white/10 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Palette className="h-5 w-5 text-indigo-500" />
                  Visual Aesthetics
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'].map(color => (
                        <button
                          key={color}
                          onClick={() => setTheme({ ...theme, primaryColor: color })}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                            theme.primaryColor === color ? "border-white scale-110 shadow-lg" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Corner Radius</label>
                    <div className="flex gap-2">
                      {['0', '0.5rem', '1rem', '2rem'].map(radius => (
                        <button
                          key={radius}
                          onClick={() => setTheme({ ...theme, borderRadius: radius })}
                          className={cn(
                            "px-3 py-1 rounded-md border text-xs transition-all",
                            theme.borderRadius === radius ? "bg-primary border-primary text-white" : "border-white/10 hover:bg-white/5"
                          )}
                        >
                          {radius === '0' ? 'Sharp' : radius === '2rem' ? 'Round' : 'Soft'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Glassmorphism Effect</p>
                    <p className="text-xs text-muted-foreground">Enable frosted glass transparency</p>
                  </div>
                  <button 
                    onClick={() => setTheme({ ...theme, glassEffect: !theme.glassEffect })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      theme.glassEffect ? "bg-indigo-500" : "bg-white/10"
                    )}
                  >
                    <motion.div 
                      animate={{ x: theme.glassEffect ? 26 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="glass p-6 rounded-3xl border border-white/10 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-500" />
                  Publishing Settings
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Public URL</label>
                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-muted-foreground text-sm">swiftpayfinancial.com/shop/</span>
                      <input 
                        value={slug} 
                        onChange={(e) => setSlug(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm font-bold flex-1 p-0"
                        placeholder="your-unique-slug"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex gap-3">
                    <Zap className="h-5 w-5 text-indigo-500 shrink-0" />
                    <p className="text-xs text-indigo-300 leading-relaxed">
                      Your shop will be instantly indexed and optimized for WhatsApp and Instagram sharing. 
                      SEO meta tags will be automatically generated from your store title.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* --- Right Panel: Live Simulator --- */}
      <div className="lg:w-[400px] flex flex-col items-center sticky top-6">
        <div className="relative group">
          {/* Phone Frame */}
          <div className="relative w-[320px] h-[640px] bg-[#0a0a0a] rounded-[3.5rem] border-[12px] border-[#1a1a1a] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 w-full h-7 bg-[#1a1a1a] flex justify-center z-50">
              <div className="w-24 h-5 bg-black rounded-b-2xl flex items-center justify-center gap-1.5">
                <div className="w-1 h-1 bg-white/20 rounded-full" />
                <div className="w-8 h-1 bg-white/20 rounded-full" />
              </div>
            </div>

            {/* Content Simulator */}
            <div className="h-full bg-white overflow-y-auto scrollbar-hide pt-10 pb-20">
              {/* Shop Header */}
              <div className="px-6 py-8 text-center space-y-4">
                <motion.div 
                  animate={{ backgroundColor: theme.primaryColor + '15' }}
                  className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-inner"
                >
                  <StoreIcon color={theme.primaryColor} />
                </motion.div>
                <div className="space-y-1">
                  <h1 className="text-xl font-black text-gray-900 tracking-tight">{title || 'Your Shop Name'}</h1>
                  <p className="text-xs text-gray-500 font-medium">{description || 'Your store tagline goes here'}</p>
                </div>
              </div>

              {/* Product Grid */}
              <div className="px-4 grid grid-cols-2 gap-3">
                {products.map((p, i) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-2 border border-gray-100 shadow-sm space-y-2",
                      theme.glassEffect && "bg-white/50 backdrop-blur-sm"
                    )}
                    style={{ borderRadius: theme.borderRadius }}
                  >
                    <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                      <ImageIcon className="h-8 w-8 text-gray-200" />
                    </div>
                    <div className="space-y-1 px-1">
                      <p className="text-[10px] font-bold text-gray-800 truncate">{p.name || 'Product Name'}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black" style={{ color: theme.primaryColor }}>
                          KES {p.price || '0'}
                        </p>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-900">
                          <Plus className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Trust Badge */}
              <div className="mt-12 px-6 text-center space-y-2">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <ShieldCheck className="h-3 w-3" />
                  Verified by SwiftPay
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex items-center justify-between z-50">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
                <span className="text-lg font-black text-gray-900">KES 0.00</span>
              </div>
              <Button 
                className="rounded-full px-6 shadow-lg"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Checkout
              </Button>
            </div>
          </div>

          {/* Floating Labels */}
          <div className="absolute -right-12 top-20 glass p-3 rounded-2xl shadow-2xl border border-white/20 hidden lg:block">
            <MousePointer2 className="h-5 w-5 text-indigo-500 animate-bounce" />
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <Smartphone className="h-3 w-3" />
            Mobile Optimized
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <Zap className="h-3 w-3 text-yellow-500" />
            Instant Preview
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreIcon({ color }: { color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9L4.5 4H19.5L21 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 9V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 21V12H15V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 9H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
