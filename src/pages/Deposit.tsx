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
import { ArrowLeft, DollarSign, Clock, CheckCircle, XCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const depositSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 1000;
  }, {
    message: "Minimum deposit amount is KSH 1,000",
  }),
  transaction_reference: z.string().min(5, 'Transaction reference must be at least 5 characters'),
});

type DepositFormData = z.infer<typeof depositSchema>;

interface Deposit {
  id: string;
  amount: number;
  transaction_reference: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

const Deposit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchDeposits();
  }, [user, navigate]);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeposits(data || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load deposit history",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (data: DepositFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('deposits')
        .insert({
          user_id: user?.id,
          amount: parseFloat(data.amount),
          transaction_reference: data.transaction_reference,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Deposit Request Submitted",
        description: "Your deposit request has been submitted and is pending admin approval.",
      });

      form.reset();
      fetchDeposits();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deposit Failed",
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
      case 'confirmed':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/20">Confirmed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Payment details copied to clipboard",
    });
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
            <h1 className="text-2xl font-bold">Deposit Funds</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deposit Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Make a Deposit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6 border-primary/20 bg-primary/10">
                  <AlertDescription>
                    <strong>Minimum deposit: KSH 1,000</strong><br />
                    All deposits are manually verified by our admin team for security.
                  </AlertDescription>
                </Alert>

                <form onSubmit={form.handleSubmit(handleDeposit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Deposit Amount (KSH)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1000"
                      step="1"
                      placeholder="Enter amount (minimum 1,000)"
                      {...form.register('amount')}
                    />
                    {form.formState.errors.amount && (
                      <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transaction_reference">Transaction Reference</Label>
                    <Input
                      id="transaction_reference"
                      placeholder="Enter your transaction reference/receipt number"
                      {...form.register('transaction_reference')}
                    />
                    {form.formState.errors.transaction_reference && (
                      <p className="text-sm text-destructive">{form.formState.errors.transaction_reference.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full button-gradient"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Deposit Request'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle>Payment Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-2">M-Pesa Payment</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Paybill Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">522522</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard('522522')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Account Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">NOVALGO001</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard('NOVALGO001')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-2">Bank Transfer</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Bank:</span>
                      <span>Equity Bank</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Account Name:</span>
                      <span>NovAlgo Investments</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Account Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">1234567890</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard('1234567890')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Important:</strong> After making payment, please submit the form above with the transaction reference for verification.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Deposit History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle>Deposit History</CardTitle>
            </CardHeader>
            <CardContent>
              {deposits.length > 0 ? (
                <div className="space-y-4">
                  {deposits.map((deposit) => (
                    <div key={deposit.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(deposit.status)}
                        <div>
                          <p className="font-semibold">{formatCurrency(deposit.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            Ref: {deposit.transaction_reference}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(deposit.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(deposit.status)}
                        {deposit.admin_notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Note: {deposit.admin_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No deposits yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Deposit;