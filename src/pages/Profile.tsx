import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  Key,
  Users,
  TrendingUp,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  referral_code: string;
  created_at: string;
}

interface WalletData {
  total_invested: number;
  total_profits: number;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfileData();
  }, [user, navigate]);

  const fetchProfileData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      
      // Set form values
      profileForm.reset({
        full_name: profileData.full_name,
        phone: profileData.phone,
        email: profileData.email,
      });

      // Fetch wallet data
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('total_invested, total_profits')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;
      setWalletData(wallet);

      // Fetch referral count
      const { count, error: referralError } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user?.id);

      if (referralError) throw referralError;
      setReferralCount(count || 0);

    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleUpdateProfile = async (data: ProfileFormData) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          email: data.email,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      setIsEditing(false);
      await fetchProfileData();

    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (data: PasswordFormData) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });

      setIsChangingPassword(false);
      passwordForm.reset();

    } catch (error) {
      console.error('Password change error:', error);
      toast({
        variant: "destructive",
        title: "Password Change Failed",
        description: "There was an error changing your password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">My Profile</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="text-lg font-semibold">
                    {profile ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatCurrency(walletData?.total_invested || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Profits</p>
                  <p className="text-lg font-semibold text-green-500">
                    {formatCurrency(walletData?.total_profits || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Referrals</p>
                  <p className="text-lg font-semibold">
                    {referralCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={loading}
                  >
                    {isEditing ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        {...profileForm.register('full_name')}
                        placeholder="Enter your full name"
                      />
                      {profileForm.formState.errors.full_name && (
                        <p className="text-sm text-destructive mt-1">
                          {profileForm.formState.errors.full_name.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        {...profileForm.register('phone')}
                        placeholder="Enter your phone number"
                      />
                      {profileForm.formState.errors.phone && (
                        <p className="text-sm text-destructive mt-1">
                          {profileForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        {...profileForm.register('email')}
                        placeholder="Enter your email"
                        type="email"
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-destructive mt-1">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <p className="text-lg font-medium">{profile?.full_name}</p>
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <p className="text-lg font-medium">{profile?.phone}</p>
                    </div>
                    <div>
                      <Label>Email Address</Label>
                      <p className="text-lg font-medium">{profile?.email}</p>
                    </div>
                    <div>
                      <Label>Referral Code</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {profile?.referral_code}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/referrals')}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Manage Referrals
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    disabled={loading}
                  >
                    {isChangingPassword ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isChangingPassword ? (
                  <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        {...passwordForm.register('currentPassword')}
                        type="password"
                        placeholder="Enter current password"
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        {...passwordForm.register('newPassword')}
                        type="password"
                        placeholder="Enter new password"
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        {...passwordForm.register('confirmPassword')}
                        type="password"
                        placeholder="Confirm new password"
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                      <Key className="w-4 h-4 mr-2" />
                      {loading ? "Changing..." : "Change Password"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Password</Label>
                      <p className="text-muted-foreground">••••••••••••</p>
                    </div>
                    <div>
                      <Label>Account Status</Label>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Security Tips:
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Use a strong, unique password</li>
                        <li>• Never share your login credentials</li>
                        <li>• Log out when using public computers</li>
                        <li>• Keep your contact information updated</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Account Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/investments')}>
                  <TrendingUp className="w-6 h-6 mb-2" />
                  My Investments
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/referrals')}>
                  <Users className="w-6 h-6 mb-2" />
                  Referrals
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/transactions')}>
                  <TrendingUp className="w-6 h-6 mb-2" />
                  Transaction History
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/dashboard')}>
                  <TrendingUp className="w-6 h-6 mb-2" />
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;