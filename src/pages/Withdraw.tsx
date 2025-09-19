import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowUpRight, Clock, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const withdrawSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 1000;
  }, {
    message: "Minimum withdrawal amount is KSH 1,000",
  }),
  phone_number: z.string().min(10, 'Please enter a valid phone number'),
});

type WithdrawFormData = z.infer<typeof withdrawSchema>;

interface WalletData {
  main_balance: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  phone_number: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

const Withdraw = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawSchema),
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch wallet data
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('main_balance')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;
      setWalletData(wallet);

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;
      setWithdrawals(withdrawalsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load withdrawal data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (data: WithdrawFormData) => {
    const amount = parseFloat(data.amount);
    
    if (!walletData || amount > walletData.main_balance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user?.id,
          amount: amount,
          phone_number: data.phone_number,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted and is pending admin approval.",
      });

      form.reset();
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
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
            <h1 className="text-2xl font-bold">Withdraw Funds</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Available Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(walletData?.main_balance || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Available for withdrawal
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal Form */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5" />
                  Request Withdrawal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6 border-primary/20 bg-primary/10">
                  <AlertDescription>
                    <strong>Minimum withdrawal: KSH 1,000</strong><br />
                    Withdrawals are processed within 24-48 hours after admin approval.
                  </AlertDescription>
                </Alert>

                <form onSubmit={form.handleSubmit(handleWithdraw)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Withdrawal Amount (KSH)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1000"
                      max={walletData?.main_balance || 0}
                      step="1"
                      placeholder="Enter amount to withdraw"
                      {...form.register('amount')}
                    />
                    {form.formState.errors.amount && (
                      <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number">M-Pesa Phone Number</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      placeholder="e.g., 0712345678"
                      {...form.register('phone_number')}
                    />
                    {form.formState.errors.phone_number && (
                      <p className="text-sm text-destructive">{form.formState.errors.phone_number.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Funds will be sent to this M-Pesa number
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full button-gradient"
                    disabled={isSubmitting || !walletData || walletData.main_balance < 1000}
                  >
                    {isSubmitting ? 'Submitting...' : 'Request Withdrawal'}
                  </Button>

                  {walletData && walletData.main_balance < 1000 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Insufficient balance. Minimum withdrawal is KSH 1,000.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Withdrawal History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle>Withdrawal History</CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawals.length > 0 ? (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(withdrawal.status)}
                          <div>
                            <p className="font-semibold">{formatCurrency(withdrawal.amount)}</p>
                            <p className="text-sm text-muted-foreground">
                              To: {withdrawal.phone_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(withdrawal.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(withdrawal.status)}
                          {withdrawal.admin_notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Note: {withdrawal.admin_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ArrowUpRight className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No withdrawals yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;