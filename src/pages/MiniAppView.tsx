import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, ShieldCheck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const MiniAppView = () => {
  const { slug } = useParams();
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        // In a real app, this would be a public endpoint
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!appData) return <div className="min-h-screen flex items-center justify-center text-center p-6">
    <div>
      <h1 className="text-2xl font-bold">Shop Not Found</h1>
      <p className="text-muted-foreground">The link you followed might be broken or the shop has been removed.</p>
    </div>
  </div>;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="p-6 text-center border-b sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-bold">{appData.title}</h1>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="h-3 w-3 text-primary" />
          Secure Payments by SwiftPay
        </p>
      </header>

      {/* Products */}
      <main className="p-4 max-w-md mx-auto space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {appData.products?.map((product: any) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-12 w-12 text-gray-300" />
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xl font-black text-primary">KES {product.price}</span>
                  <Button size="sm" className="rounded-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy Now
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="fixed bottom-0 w-full p-4 bg-gray-50 border-t text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
          Powered by SwiftPay Financial
        </p>
      </footer>
    </div>
  );
};

export default MiniAppView;
