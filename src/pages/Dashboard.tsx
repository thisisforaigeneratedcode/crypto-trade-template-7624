import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wallet, 
  TrendingUp, 
  Plus, 
  Eye, 
  History, 
  Users, 
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface WalletData {
  main_balance: number;
  referral_bonus_balance: number;
  total_invested: number;
  total_profits: number;
}

interface InvestmentPackage {
  id: string;
  name: string;
  package_type: string;
  minimum_amount: number;
  multiplier: number;
  description: string;
  features: string[];
}

interface Investment {
  id: string;
  amount: number;
  expected_return: number;
  status: string;
  start_date: string;
  investment_packages: InvestmentPackage;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch wallet data
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (wallet) {
        setWalletData(wallet);
      }

      // Fetch investment packages
      const { data: packagesData } = await supabase
        .from('investment_packages')
        .select('*')
        .eq('active', true)
        .order('minimum_amount');

      if (packagesData) {
        setPackages(packagesData);
      }

      // Fetch user investments
      const { data: investmentsData } = await supabase
        .from('investments')
        .select(`
          *,
          investment_packages (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (investmentsData) {
        setInvestments(investmentsData);
      }

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionsData) {
        setRecentTransactions(transactionsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data",
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'investment':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'profit':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'referral_commission':
        return <Users className="w-4 h-4 text-primary" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const canInvest = (packageData: InvestmentPackage) => {
    if (!walletData) return false;
    return walletData.main_balance >= packageData.minimum_amount;
  };

  const handleInvest = async (packageData: InvestmentPackage) => {
    if (!canInvest(packageData)) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You need at least ${formatCurrency(packageData.minimum_amount)} to invest in this package.`,
      });
      return;
    }

    try {
      setLoading(true);
      
      // Calculate expected return
      const expectedReturn = packageData.minimum_amount * packageData.multiplier;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 365); // 1 year investment period
      
      // Create investment record
      const { data: investment, error: investmentError } = await supabase
        .from('investments')
        .insert({
          user_id: user?.id,
          package_id: packageData.id,
          amount: packageData.minimum_amount,
          expected_return: expectedReturn,
          end_date: endDate.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (investmentError) throw investmentError;

      // Create transaction record for the investment
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'investment',
          amount: packageData.minimum_amount,
          description: `Investment in ${packageData.name} package`,
          reference_id: investment.id,
          balance_before: walletData?.main_balance || 0,
          balance_after: (walletData?.main_balance || 0) - packageData.minimum_amount
        });

      if (transactionError) throw transactionError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          main_balance: (walletData?.main_balance || 0) - packageData.minimum_amount,
          total_invested: (walletData?.total_invested || 0) + packageData.minimum_amount
        })
        .eq('user_id', user?.id);

      if (walletError) throw walletError;

      toast({
        title: "Investment Successful!",
        description: `You have successfully invested ${formatCurrency(packageData.minimum_amount)} in the ${packageData.name} package.`,
      });

      // Refresh dashboard data
      await fetchDashboardData();

    } catch (error) {
      console.error('Investment error:', error);
      toast({
        variant: "destructive",
        title: "Investment Failed",
        description: "There was an error processing your investment. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">NovAlgo Investments</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Wallet Balance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Your Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Main Balance</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(walletData?.main_balance || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Referral Bonus</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(walletData?.referral_bonus_balance || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(walletData?.total_invested || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Profits</p>
                  <p className="text-xl font-semibold text-green-500">
                    {formatCurrency(walletData?.total_profits || 0)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="button-gradient" onClick={() => navigate('/deposit')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Deposit Funds
                </Button>
                <Button variant="outline" onClick={() => navigate('/transactions')}>
                  <History className="w-4 h-4 mr-2" />
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Investment Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">Investment Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="glass">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    {pkg.package_type === 'pro' && (
                      <Badge variant="secondary">Most Popular</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Minimum Investment</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(pkg.minimum_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Return</p>
                      <p className="text-lg font-semibold">
                        {pkg.multiplier}x your investment
                      </p>
                    </div>
                    <div className="space-y-2">
                      {pkg.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      variant={canInvest(pkg) ? "default" : "secondary"}
                      onClick={() => handleInvest(pkg)}
                      disabled={!canInvest(pkg)}
                    >
                      {canInvest(pkg) ? 'Invest Now' : 'Insufficient Balance'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Investments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Active Investments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {investments.length > 0 ? (
                  <div className="space-y-4">
                    {investments.map((investment) => (
                      <div key={investment.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{investment.investment_packages.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Invested: {formatCurrency(investment.amount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                            {investment.status}
                          </Badge>
                          <p className="text-sm text-green-500 mt-1">
                            Expected: {formatCurrency(investment.expected_return)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active investments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        {getTransactionIcon(transaction.type)}
                        <div className="flex-1">
                          <p className="font-medium capitalize">{transaction.type.replace('_', ' ')}</p>
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {transaction.type === 'withdrawal' ? '-' : '+'}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/deposit')}>
                  <Plus className="w-6 h-6 mb-2" />
                  Deposit
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/withdraw')}>
                  <ArrowUpRight className="w-6 h-6 mb-2" />
                  Withdraw
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/referrals')}>
                  <Users className="w-6 h-6 mb-2" />
                  Referrals
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/profile')}>
                  <Settings className="w-6 h-6 mb-2" />
                  Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;