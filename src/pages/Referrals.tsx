import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  ArrowLeft,
  Copy,
  Share2,
  DollarSign,
  Gift,
  UserPlus,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  referral_code: string;
  full_name: string;
}

interface WalletData {
  referral_bonus_balance: number;
  main_balance: number;
}

interface Referral {
  id: string;
  referred_id: string;
  total_deposits: number;
  commission_amount: number;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

const Referrals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchReferralData();
  }, [user, navigate]);

  const fetchReferralData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, referral_code, full_name')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch wallet data
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('referral_bonus_balance, main_balance')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;
      setWalletData(wallet);

      // Fetch referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          *,
          profiles!referrals_referred_id_fkey (full_name)
        `)
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;
      setReferrals(referralsData || []);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load referral data",
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

  const copyReferralCode = async () => {
    if (!profile?.referral_code) return;
    
    try {
      await navigator.clipboard.writeText(profile.referral_code);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy referral code",
      });
    }
  };

  const shareReferralLink = async () => {
    if (!profile?.referral_code) return;
    
    const referralUrl = `${window.location.origin}/auth?ref=${profile.referral_code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join NovAlgo Investments',
          text: 'Start your investment journey with NovAlgo Investments!',
          url: referralUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const copyReferralLink = async () => {
    if (!profile?.referral_code) return;
    
    const referralUrl = `${window.location.origin}/auth?ref=${profile.referral_code}`;
    
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy referral link",
      });
    }
  };

  const transferReferralBonus = async () => {
    if (!walletData?.referral_bonus_balance || walletData.referral_bonus_balance <= 0) {
      toast({
        variant: "destructive",
        title: "No Bonus Available",
        description: "You don't have any referral bonus to transfer",
      });
      return;
    }

    try {
      setIsTransferring(true);

      // Create transaction for referral bonus transfer
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'referral_bonus_transfer',
          amount: walletData.referral_bonus_balance,
          description: 'Referral bonus transfer to main balance',
          balance_before: walletData.main_balance,
          balance_after: walletData.main_balance + walletData.referral_bonus_balance
        });

      if (transactionError) throw transactionError;

      // Update wallet balances
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          main_balance: walletData.main_balance + walletData.referral_bonus_balance,
          referral_bonus_balance: 0
        })
        .eq('user_id', user?.id);

      if (walletError) throw walletError;

      toast({
        title: "Transfer Successful!",
        description: `${formatCurrency(walletData.referral_bonus_balance)} has been transferred to your main balance.`,
      });

      // Refresh data
      await fetchReferralData();

    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: "There was an error transferring your referral bonus. Please try again.",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading referral data...</p>
        </div>
      </div>
    );
  }

  const totalCommissions = referrals.reduce((sum, ref) => sum + ref.commission_amount, 0);
  const totalReferrals = referrals.length;

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
              <Users className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Referral Program</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Referral Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle>Referral Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold text-primary">
                    {totalReferrals}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Commissions</p>
                  <p className="text-xl font-semibold text-green-500">
                    {formatCurrency(totalCommissions)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Available Bonus</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(walletData?.referral_bonus_balance || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <Button 
                    className="w-full"
                    onClick={transferReferralBonus}
                    disabled={!walletData?.referral_bonus_balance || walletData.referral_bonus_balance <= 0 || isTransferring}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    {isTransferring ? "Transferring..." : "Invest Referral Bonus"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Your Referral Code
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Share your referral code and earn 5% commission on every confirmed deposit!
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={profile?.referral_code || ''}
                    readOnly
                    className="font-mono text-lg text-center"
                  />
                  <Button variant="outline" onClick={copyReferralCode}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={shareReferralLink} className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Referral Link
                  </Button>
                  <Button variant="outline" onClick={copyReferralLink} className="w-full">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Referral Link
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    How it works:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Share your referral code with friends and family</li>
                    <li>• They sign up using your code</li>
                    <li>• You earn 5% commission on their confirmed deposits</li>
                    <li>• Commission is credited to your Referral Bonus Balance</li>
                    <li>• Transfer bonus to main balance to invest</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Referral History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length > 0 ? (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{referral.profiles.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined: {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total Deposits: {formatCurrency(referral.total_deposits)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-500">
                          {formatCurrency(referral.commission_amount)}
                        </p>
                        <Badge variant="outline">
                          Commission Earned
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserPlus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Referrals Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start sharing your referral code to earn commissions!
                  </p>
                  <Button onClick={shareReferralLink}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Your Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Referrals;