import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  History, 
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  Users,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  balance_before: number;
  balance_after: number;
  reference_id?: string;
}

interface Deposit {
  id: string;
  amount: number;
  transaction_reference: string;
  status: string;
  created_at: string;
  processed_at?: string;
  admin_notes?: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  phone_number: string;
  status: string;
  created_at: string;
  processed_at?: string;
  admin_notes?: string;
}

const Transactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAllTransactions();
  }, [user, navigate]);

  const fetchAllTransactions = async () => {
    try {
      // Fetch general transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Fetch deposits
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (depositsError) throw depositsError;
      setDeposits(depositsData || []);

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;
      setWithdrawals(withdrawalsData || []);

    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transaction history",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = deposit.transaction_reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || deposit.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.phone_number.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || withdrawal.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transaction history...</p>
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
              <History className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Transaction History</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    <SelectItem value="investment">Investments</SelectItem>
                    <SelectItem value="profit">Profits</SelectItem>
                    <SelectItem value="referral_commission">Referral Commission</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction History Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Transactions ({filteredTransactions.length})</TabsTrigger>
              <TabsTrigger value="deposits">Deposits ({filteredDeposits.length})</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals ({filteredWithdrawals.length})</TabsTrigger>
              <TabsTrigger value="investments">Investments</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    All Transactions
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredTransactions.length > 0 ? (
                    <div className="space-y-4">
                      {filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                          {getTransactionIcon(transaction.type)}
                          <div className="flex-1">
                            <p className="font-medium capitalize">{transaction.type.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {transaction.type === 'withdrawal' ? '-' : '+'}
                              {formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Balance: {formatCurrency(transaction.balance_after)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                      <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deposits" className="mt-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Deposit History</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredDeposits.length > 0 ? (
                    <div className="space-y-4">
                      {filteredDeposits.map((deposit) => (
                        <div key={deposit.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium">{formatCurrency(deposit.amount)}</p>
                            <p className="text-sm text-muted-foreground">Ref: {deposit.transaction_reference}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(deposit.created_at).toLocaleString()}
                            </p>
                            {deposit.admin_notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Note: {deposit.admin_notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {getStatusBadge(deposit.status)}
                            {deposit.processed_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Processed: {new Date(deposit.processed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ArrowDownRight className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Deposits Found</h3>
                      <p className="text-muted-foreground">No deposits match your current filters.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Withdrawal History</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredWithdrawals.length > 0 ? (
                    <div className="space-y-4">
                      {filteredWithdrawals.map((withdrawal) => (
                        <div key={withdrawal.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium">{formatCurrency(withdrawal.amount)}</p>
                            <p className="text-sm text-muted-foreground">To: {withdrawal.phone_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(withdrawal.created_at).toLocaleString()}
                            </p>
                            {withdrawal.admin_notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Note: {withdrawal.admin_notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {getStatusBadge(withdrawal.status)}
                            {withdrawal.processed_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Processed: {new Date(withdrawal.processed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ArrowUpRight className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Withdrawals Found</h3>
                      <p className="text-muted-foreground">No withdrawals match your current filters.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="investments" className="mt-6">
              <Card className="glass">
                <CardContent className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Investment History</h3>
                  <p className="text-muted-foreground mb-4">
                    View detailed investment history on the investments page.
                  </p>
                  <Button onClick={() => navigate('/investments')}>
                    View All Investments
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Transactions;