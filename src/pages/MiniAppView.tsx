import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Store, 
  MessageCircle, 
  Share2, 
  Instagram, 
  ArrowLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MiniAppView = () => {
  const { slug } = useParams();
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [orderResultDesc, setOrderResultDesc] = useState<string | null>(null);
  const [checkoutView, setCheckoutView] = useState<'form' | 'pending' | 'success' | 'failed'>('form');

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const response = await axios.get(`/api/public/mini-apps/${slug}`);
        setAppData(response.data.mini_app);
      } catch (error) {
        console.error("Failed to fetch mini-app");
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [slug]);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const res = await axios.get(`/api/public/mini-app-orders/${orderId}`);
        const nextStatus = String(res.data?.order?.status || '').toLowerCase();
        const nextDesc = res.data?.order?.result_desc || null;
        if (cancelled) return;

        setOrderStatus(nextStatus || null);
        setOrderResultDesc(nextDesc);

        if (nextStatus === 'paid') {
          window.clearInterval(interval);
          setIsCheckingOut(false);
          setCheckoutView('success');
          toast({ title: 'Payment Successful', description: 'Your order has been confirmed.' });
          try {
            const response = await axios.get(`/api/public/mini-apps/${slug}`);
            setAppData(response.data.mini_app);
          } catch (e) {
          }
        }

        if (nextStatus === 'failed') {
          window.clearInterval(interval);
          setIsCheckingOut(false);
          setCheckoutView('failed');
          toast({ title: 'Payment Failed', description: nextDesc || 'Payment was not completed.', variant: 'destructive' });
        }
      } catch (e) {
      }
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [orderId, slug, toast]);

  const openCheckout = (product: any) => {
    setSelectedProduct(product);
    setIsCheckoutOpen(true);
    setOrderId(null);
    setOrderStatus(null);
    setOrderResultDesc(null);
    setCheckoutView('form');
  };

  const closeCheckout = (open: boolean) => {
    setIsCheckoutOpen(open);
    if (!open) {
      setSelectedProduct(null);
      setIsCheckingOut(false);
      setOrderId(null);
      setOrderStatus(null);
      setOrderResultDesc(null);
      setPhoneNumber('');
      setCheckoutView('form');
    }
  };

  const startCheckout = async () => {
    try {
      if (!slug) return;
      if (!selectedProduct?.id) return;
      if (!phoneNumber || String(phoneNumber).trim().length < 9) {
        toast({ title: 'Phone number required', description: 'Enter a valid M-Pesa phone number.', variant: 'destructive' });
        return;
      }

      setIsCheckingOut(true);
      setOrderStatus('pending');
      setOrderResultDesc(null);
      setCheckoutView('pending');

      const res = await axios.post(`/api/public/mini-apps/${slug}/checkout`, {
        phone_number: phoneNumber,
        product_id: selectedProduct.id,
        quantity: 1
      });

      const nextOrderId = res.data?.order_id || null;
      if (!nextOrderId) {
        throw new Error('Order not created');
      }

      setOrderId(String(nextOrderId));
      toast({ title: 'STK Push sent', description: 'Check your phone to complete payment.' });
    } catch (error: any) {
      setIsCheckingOut(false);
      toast({ title: 'Checkout failed', description: error?.response?.data?.message || error?.message || 'Unable to start checkout.', variant: 'destructive' });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied!", description: "Share it with your customers." });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-muted-foreground">Opening Store...</p>
    </div>
  );

  if (!appData) return (
    <div className="min-h-screen flex items-center justify-center text-center p-6 bg-gray-50">
      <div className="glass p-8 rounded-3xl max-w-sm space-y-4">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full mx-auto flex items-center justify-center">
          <Store className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold">Shop Not Found</h1>
        <p className="text-muted-foreground">The link you followed might be broken or the shop has been removed.</p>
        <Button variant="outline" className="rounded-full" onClick={() => window.location.href = '/'}>
          Go to SwiftPay
        </Button>
      </div>
    </div>
  );

  const theme = appData.theme_config || { primaryColor: '#6366f1', borderRadius: '1rem' };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-black text-lg tracking-tight truncate px-4">{appData.title}</h1>
          <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {/* Hero Section */}
        <div className="p-8 text-center space-y-4 bg-white border-b border-gray-100">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-primary/20"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <Store className="h-10 w-10 text-white" />
          </motion.div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-gray-900">{appData.title}</h2>
            <p className="text-sm text-muted-foreground font-medium">{appData.description || 'Welcome to our official store'}</p>
          </div>
          <div className="flex items-center justify-center gap-4 pt-2">
            <button className="p-2 bg-green-50 rounded-full text-green-600 hover:scale-110 transition-transform">
              <MessageCircle className="h-5 w-5" />
            </button>
            <button className="p-2 bg-pink-50 rounded-full text-pink-600 hover:scale-110 transition-transform">
              <Instagram className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="p-4 grid grid-cols-1 gap-4">
          {appData.products?.length > 0 ? (
            appData.products.map((product: any, idx: number) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-gray-100 overflow-hidden shadow-sm group"
                style={{ borderRadius: theme.borderRadius }}
              >
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-200" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                    <span className="text-xs font-bold text-gray-900">{product.stock > 0 ? 'In Stock' : 'Sold Out'}</span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description || 'No description available.'}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Price</span>
                      <span className="text-2xl font-black" style={{ color: theme.primaryColor }}>KES {product.price}</span>
                    </div>
                    <Button 
                      className="rounded-full px-8 h-12 shadow-lg hover:scale-105 transition-transform"
                      style={{ backgroundColor: theme.primaryColor }}
                      disabled={Number(product.stock || 0) <= 0}
                      onClick={() => openCheckout(product)}
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center space-y-4">
              <Package className="h-12 w-12 text-gray-200 mx-auto" />
              <p className="text-muted-foreground font-medium">No products available yet.</p>
            </div>
          )}
        </div>
      </main>

      {/* Trust Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">SwiftPay Protected</p>
              <p className="text-[8px] text-muted-foreground font-bold uppercase">Secure M-Pesa Checkout</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Report Shop
          </Button>
        </div>
      </div>

      <Dialog open={isCheckoutOpen} onOpenChange={closeCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {checkoutView === 'success'
                ? 'Payment Successful'
                : checkoutView === 'failed'
                  ? 'Payment Failed'
                  : 'Pay with M-Pesa'}
            </DialogTitle>
            <DialogDescription>
              {checkoutView === 'success'
                ? 'Thank you! Your payment has been received.'
                : checkoutView === 'failed'
                  ? 'Your payment was not completed.'
                  : selectedProduct
                    ? `${selectedProduct.name} • KES ${selectedProduct.price}`
                    : 'Enter your phone number to receive an STK Push.'}
            </DialogDescription>
          </DialogHeader>

          {checkoutView === 'success' ? (
            <div className="space-y-2 text-sm">
              {selectedProduct ? (
                <div className="font-medium">{selectedProduct.name} • KES {selectedProduct.price}</div>
              ) : null}
              <div className="text-muted-foreground">You can now close this window and continue shopping.</div>
            </div>
          ) : checkoutView === 'failed' ? (
            <div className="space-y-2 text-sm">
              {orderResultDesc ? <div className="text-muted-foreground">{orderResultDesc}</div> : null}
              <div className="text-muted-foreground">You can try again, or use a different phone number.</div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 07XXXXXXXX or 2547XXXXXXXX"
                disabled={isCheckingOut}
              />
            </div>
          )}

          {orderStatus && (
            <div className="text-sm">
              <div className="font-medium">Status: {orderStatus}</div>
              {orderResultDesc ? <div className="text-muted-foreground mt-1">{orderResultDesc}</div> : null}
            </div>
          )}

          <DialogFooter>
            {checkoutView === 'success' ? (
              <Button
                className="rounded-full"
                style={{ backgroundColor: theme.primaryColor }}
                onClick={() => closeCheckout(false)}
              >
                Continue Shopping
              </Button>
            ) : checkoutView === 'failed' ? (
              <Button
                className="rounded-full"
                style={{ backgroundColor: theme.primaryColor }}
                onClick={() => {
                  setOrderId(null);
                  setOrderStatus(null);
                  setOrderResultDesc(null);
                  setCheckoutView('form');
                  setIsCheckingOut(false);
                }}
              >
                Try Again
              </Button>
            ) : (
              <Button
                className="rounded-full"
                style={{ backgroundColor: theme.primaryColor }}
                onClick={startCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? 'Waiting...' : 'Send STK Push'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MiniAppView;
