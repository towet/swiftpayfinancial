import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { User, Mail, Building, Calendar, Save, Lock, Camera } from "lucide-react";
import axios from "axios";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  createdAt: string;
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === "success") {
        setUser(response.data.user);
        setFormData({
          fullName: response.data.user.fullName,
          companyName: response.data.user.companyName,
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "/api/user",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === "success") {
        setUser(response.data.user);
        setEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        companyName: user.companyName,
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-20 lg:ml-64 transition-all duration-300">
          <DashboardHeader 
            title="Profile" 
            breadcrumbs={["Dashboard", "Profile"]} 
          />
          <div className="p-6 flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-20 lg:ml-64 transition-all duration-300">
        <DashboardHeader 
          title="Profile" 
          breadcrumbs={["Dashboard", "Profile"]} 
        />

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl border border-border/50 overflow-hidden"
            >
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 border-b border-border/50">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground">
                      {user?.fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U"}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{user?.fullName}</h2>
                    <p className="text-muted-foreground">{user?.companyName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Member since {new Date(user?.createdAt || "").toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
                  {!editing ? (
                    <Button
                      onClick={() => setEditing(true)}
                      className="bg-primary text-foreground hover:bg-primary/90"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="border-border text-muted-foreground hover:bg-secondary/50"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary text-foreground hover:bg-primary/90"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="w-4 h-4" />
                      Full Name
                    </label>
                    {editing ? (
                      <Input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="bg-secondary/50 border-border text-foreground"
                      />
                    ) : (
                      <div className="p-3 rounded-lg bg-secondary/30 text-foreground">
                        {user?.fullName}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </label>
                    <div className="p-3 rounded-lg bg-secondary/30 text-foreground">
                      {user?.email}
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Building className="w-4 h-4" />
                      Company Name
                    </label>
                    {editing ? (
                      <Input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="bg-secondary/50 border-border text-foreground"
                      />
                    ) : (
                      <div className="p-3 rounded-lg bg-secondary/30 text-foreground">
                        {user?.companyName || "Not specified"}
                      </div>
                    )}
                  </div>

                  {/* Member Since */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Member Since
                    </label>
                    <div className="p-3 rounded-lg bg-secondary/30 text-foreground">
                      {new Date(user?.createdAt || "").toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="pt-6 border-t border-border/50">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Security
                  </h3>
                  <Button
                    variant="outline"
                    className="border-border text-muted-foreground hover:bg-secondary/50"
                  >
                    Change Password
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
