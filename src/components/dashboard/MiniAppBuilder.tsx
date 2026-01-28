import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Save, Smartphone, Layout, Palette, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

export function MiniAppBuilder() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [products, setProducts] = useState([{ name: '', price: '', stock: '' }]);
  const { toast } = useToast();

  const addProduct = () => setProducts([...products, { name: '', price: '', stock: '' }]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/mini-apps', {
        title,
        slug,
        theme_config: { primaryColor: '#2563eb' }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        toast({ title: "Success", description: "Mini-App created successfully!" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create Mini-App", variant: "destructive" });
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 p-6">
      {/* Builder Controls */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            Mini-App Builder
          </h2>
          <Button onClick={handleSave} variant="gradient">
            <Save className="h-4 w-4 mr-2" />
            Save App
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">App Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. My Instagram Shop" />
          </div>
          <div>
            <label className="text-sm font-medium">Custom URL Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">swiftpayfinancial.com/shop/</span>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-shop" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </h3>
            <Button onClick={addProduct} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          {products.map((p, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <Input placeholder="Name" />
              <Input placeholder="Price" type="number" />
              <Input placeholder="Stock" type="number" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Live Preview */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center">
        <div className="relative w-[320px] h-[640px] bg-black rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden">
          <div className="absolute top-0 w-full h-6 bg-black flex justify-center">
            <div className="w-20 h-4 bg-gray-800 rounded-b-xl" />
          </div>
          <div className="h-full bg-white p-4 pt-8 overflow-y-auto">
            <div className="text-center space-y-2 mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                <Palette className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">{title || 'Your Shop Name'}</h1>
              <p className="text-xs text-gray-500">Secure payments by SwiftPay</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {products.map((p, i) => (
                <div key={i} className="border rounded-lg p-2 space-y-1">
                  <div className="aspect-square bg-gray-100 rounded-md" />
                  <div className="h-3 w-3/4 bg-gray-200 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          Live Mobile Preview
        </p>
      </motion.div>
    </div>
  );
}
