import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link as LinkIcon, 
  Copy, 
  Share2, 
  QrCode, 
  Trash2, 
  Edit, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Send,
  MessageCircle,
  Mail,
  Plus,
  Code2,
  Zap,
  Calendar,
  Tag,
  MoreVertical,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  description: string;
  link: string;
  status: 'active' | 'expired' | 'completed';
  created_at: string;
  expires_at: string | null;
  clicks: number;
  conversions: number;
  revenue: number;
  qrCode?: string;
}

const templates = [
  { name: "Invoice Payment", amount: 0, description: "Payment for invoice #INV-001" },
  { name: "Service Booking", amount: 500, description: "Service booking deposit" },
  { name: "Product Sale", amount: 1000, description: "Product purchase" },
  { name: "Donation", amount: 0, description: "Support our cause" },
];

export default function PaymentLinks() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    description: '',
    expiryDays: '30',
    requireContact: false,
    requireEmail: false,
    customFields: '',
  });

  useEffect(() => {
    fetchPaymentLinks();
  }, []);

  const fetchPaymentLinks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/payment-links", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const normalized = (response.data.links || []).map((row: any) => ({
        ...row,
        amount: Number(row?.amount || 0),
        clicks: Number(row?.clicks || 0),
        conversions: Number(row?.conversions || 0),
        revenue: Number(row?.revenue || 0),
      }));
      setLinks(normalized);
    } catch (error) {
      console.error("Error fetching payment links:", error);
    } finally {
      setLoading(false);
    }
  };

  const createPaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/payment-links",
        {
          title: formData.title,
          amount: parseFloat(formData.amount) || 0,
          description: formData.description,
          expiryDays: parseInt(formData.expiryDays),
          requireContact: formData.requireContact,
          requireEmail: formData.requireEmail,
          customFields: formData.customFields,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: "Success",
        description: "Payment link created successfully!",
      });

      setShowCreateForm(false);
      setFormData({
        title: '',
        amount: '',
        description: '',
        expiryDays: '30',
        requireContact: false,
        requireEmail: false,
        customFields: '',
      });
      fetchPaymentLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create payment link",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const getEmbedHtml = (link: PaymentLink) => {
    const url = link.link;
    const label = link.amount > 0 ? `Pay KES ${Number(link.amount).toLocaleString()}` : "Pay Now";

    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border-radius:12px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-weight:700;text-decoration:none;background:linear-gradient(135deg,#00C853,#2563EB);color:#ffffff;box-shadow:0 10px 20px rgba(0,0,0,0.18)">${label}</a>`;
  };

  const getEmbedReact = (link: PaymentLink) => {
    const url = link.link;
    return `<a
  href="${url}"
  target="_blank"
  rel="noreferrer"
  style={{
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 700,
    textDecoration: "none",
    background: "linear-gradient(135deg, #00C853, #2563EB)",
    color: "#fff",
    boxShadow: "0 10px 20px rgba(0,0,0,0.18)",
  }}
>
  Pay with SwiftPay
</a>`;
  };

  const shareViaWhatsApp = (link: PaymentLink) => {
    const message = `Pay KES ${link.amount} for ${link.title}. Click here: ${link.link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaSMS = (link: PaymentLink) => {
    const message = `Pay KES ${link.amount} for ${link.title}. Click here: ${link.link}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaEmail = (link: PaymentLink) => {
    const subject = `Payment Request: ${link.title}`;
    const body = `Pay KES ${link.amount} for ${link.title}.\n\n${link.description}\n\nClick here to pay: ${link.link}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const deleteLink = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/payment-links/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "Success",
        description: "Payment link deleted",
      });
      fetchPaymentLinks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete payment link",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/20 text-success border-success/30';
      case 'expired':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'completed':
        return 'bg-primary/20 text-primary border-primary/30';
      default:
        return 'bg-secondary/20 text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader 
          title="Payment Links" 
          breadcrumbs={["Dashboard", "Payment Links"]} 
        />

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg gradient-safaricom">
                  <LinkIcon className="w-6 h-6 text-safaricom-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Active Links</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {links.filter(l => l.status === 'active').length}
              </h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg gradient-safaricom">
                  <Users className="w-6 h-6 text-safaricom-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Total Clicks</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {links.reduce((sum, l) => sum + Number(l.clicks || 0), 0)}
              </h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg gradient-safaricom">
                  <DollarSign className="w-6 h-6 text-safaricom-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Revenue</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                KES {links.reduce((sum, l) => sum + Number(l.revenue || 0), 0).toLocaleString()}
              </h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg gradient-safaricom">
                  <TrendingUp className="w-6 h-6 text-safaricom-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Conversion Rate</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {links.length > 0 && links.reduce((sum, l) => sum + Number(l.clicks || 0), 0) > 0
                  ? ((links.reduce((sum, l) => sum + Number(l.conversions || 0), 0) / links.reduce((sum, l) => sum + Number(l.clicks || 0), 0)) * 100).toFixed(1)
                  : '0'}%
              </h3>
            </motion.div>
          </div>

          {/* Quick Templates */}
          <div className="glass rounded-xl p-6 border border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Quick Templates
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {templates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      title: template.name,
                      amount: template.amount.toString(),
                      description: template.description,
                    });
                    setShowCreateForm(true);
                  }}
                  className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary border border-border hover:border-primary/50 transition-all text-left"
                >
                  <div className="font-medium text-foreground mb-1">{template.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {template.amount > 0 ? `KES ${template.amount}` : 'Custom Amount'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary text-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Payment Link
            </Button>
          </div>

          {/* Create Form Modal */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowCreateForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="glass rounded-2xl border border-border/50 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-2xl font-bold text-foreground mb-6">Create Payment Link</h2>
                  
                  <form onSubmit={createPaymentLink} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Link Title
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., Invoice Payment"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-secondary/50 border-border text-foreground"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Amount (KES)
                        </label>
                        <Input
                          type="number"
                          placeholder="0 for custom amount"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="bg-secondary/50 border-border text-foreground"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Expiry (Days)
                        </label>
                        <Input
                          type="number"
                          value={formData.expiryDays}
                          onChange={(e) => setFormData({ ...formData, expiryDays: e.target.value })}
                          className="bg-secondary/50 border-border text-foreground"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Description
                      </label>
                      <Textarea
                        placeholder="What is this payment for?"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="bg-secondary/50 border-border text-foreground resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Requirements
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.requireContact}
                          onChange={(e) => setFormData({ ...formData, requireContact: e.target.checked })}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-sm text-foreground">Require Contact Information</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.requireEmail}
                          onChange={(e) => setFormData({ ...formData, requireEmail: e.target.checked })}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-sm text-foreground">Require Email Address</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Custom Fields (Optional)
                      </label>
                      <Textarea
                        placeholder="Enter custom fields (one per line): Name, Address, Notes"
                        value={formData.customFields}
                        onChange={(e) => setFormData({ ...formData, customFields: e.target.value })}
                        className="bg-secondary/50 border-border text-foreground resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                        className="border-border text-muted-foreground hover:bg-secondary/50"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-primary text-foreground hover:bg-primary/90"
                      >
                        Create Link
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Payment Links List */}
          <div className="glass rounded-xl border border-border/50 overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Your Payment Links</h3>
            </div>
            
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Loading...</div>
            ) : links.length === 0 ? (
              <div className="p-12 text-center">
                <LinkIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No payment links yet</h3>
                <p className="text-muted-foreground mb-4">Create your first payment link to start collecting payments</p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-primary text-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Link
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {links.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-foreground">{link.title}</h4>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1",
                            getStatusColor(link.status)
                          )}>
                            {getStatusIcon(link.status)}
                            {link.status.charAt(0).toUpperCase() + link.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{link.description}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground font-medium">
                              {link.amount > 0 ? `KES ${link.amount.toLocaleString()}` : 'Custom Amount'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{Number(link.clicks || 0)} clicks</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{Number(link.conversions || 0)} conversions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">
                              Expires {link.expires_at ? new Date(link.expires_at).toLocaleDateString() : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(link.link)}
                          className="border-border text-muted-foreground hover:bg-secondary/50"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLink(link);
                            setShowShareModal(true);
                          }}
                          className="border-border text-muted-foreground hover:bg-secondary/50"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLink(link);
                            setShowQrModal(true);
                          }}
                          className="border-border text-muted-foreground hover:bg-secondary/50"
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          QR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLink(link);
                            setShowEmbedModal(true);
                          }}
                          className="border-border text-muted-foreground hover:bg-secondary/50"
                        >
                          <Code2 className="w-4 h-4 mr-2" />
                          Embed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(link.link, '_blank')}
                          className="border-border text-muted-foreground hover:bg-secondary/50"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteLink(link.id)}
                          className="border-destructive/50 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && selectedLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl border border-border/50 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-foreground mb-4">Share Payment Link</h3>
              <p className="text-muted-foreground mb-6">Share this payment link via your preferred channel</p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => shareViaWhatsApp(selectedLink)}
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Share via WhatsApp
                </Button>
                <Button
                  onClick={() => shareViaSMS(selectedLink)}
                  className="w-full bg-primary text-foreground hover:bg-primary/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Share via SMS
                </Button>
                <Button
                  onClick={() => shareViaEmail(selectedLink)}
                  className="w-full bg-primary text-foreground hover:bg-primary/90"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Share via Email
                </Button>
                <Button
                  onClick={() => {
                    copyToClipboard(selectedLink.link);
                    setShowShareModal(false);
                  }}
                  variant="outline"
                  className="w-full border-border text-muted-foreground hover:bg-secondary/50"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQrModal && selectedLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQrModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl border border-border/50 p-6 w-full max-w-md text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-foreground mb-4">QR Code</h3>
              <div className="bg-white p-4 rounded-lg mb-4 inline-block">
                <QrCode className="w-48 h-48 text-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">Scan this QR code to pay</p>
              <Button
                onClick={() => {
                  copyToClipboard(selectedLink.link);
                  setShowQrModal(false);
                }}
                className="w-full bg-primary text-foreground hover:bg-primary/90"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link Instead
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmbedModal && selectedLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEmbedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl border border-border/50 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-foreground mb-2">Embed Payment Button</h3>
              <p className="text-muted-foreground mb-6">
                Copy/paste a button into your website. This opens a secure SwiftPay checkout page (no API keys exposed).
              </p>

              <div className="space-y-4">
                <div className="glass rounded-xl border border-border/50 p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm font-semibold text-foreground">HTML</div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getEmbedHtml(selectedLink))}
                      className="border-border text-muted-foreground hover:bg-secondary/50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap break-words rounded-md bg-secondary/50 border border-border p-3 text-xs text-foreground font-mono">
{getEmbedHtml(selectedLink)}
                  </pre>
                </div>

                <div className="glass rounded-xl border border-border/50 p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm font-semibold text-foreground">React</div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getEmbedReact(selectedLink))}
                      className="border-border text-muted-foreground hover:bg-secondary/50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap break-words rounded-md bg-secondary/50 border border-border p-3 text-xs text-foreground font-mono">
{getEmbedReact(selectedLink)}
                  </pre>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowEmbedModal(false)}
                    className="border-border text-muted-foreground hover:bg-secondary/50"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
