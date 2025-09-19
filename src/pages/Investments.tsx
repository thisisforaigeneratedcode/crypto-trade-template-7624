import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  ArrowLeft,
  Clock,
  DollarSign,
  Calendar,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  end_date: string;
  profit_distributed: number;
  created_at: string;
  investment_packages: InvestmentPackage;
}

const Investments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchInvestments();
  }, [user, navigate]);

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          investment_packages (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error('Error fetching investments:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load investments",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filterInvestmentsByStatus = (status: string) => {
    switch (status) {
      case 'open':
        return investments.filter(inv => inv.status === 'active');
      case 'pending':
        return investments.filter(inv => inv.status === 'pending');
      case 'closed':
        return investments.filter(inv => inv.status === 'completed');
      default:
        return investments;
    }
  };

  const calculateProgress = (investment: Investment) => {
    const startDate = new Date(investment.start_date);
    const endDate = new Date(investment.end_date);
    const now = new Date();
    
    if (now >= endDate) return 100;
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  };

  const InvestmentCard = ({ investment }: { investment: Investment }) => {
    const progress = calculateProgress(investment);
    const daysRemaining = Math.max(0, Math.ceil((new Date(investment.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
    
    return (
      <Card className="glass">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{investment.investment_packages.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {investment.investment_packages.description}
              </p>
            </div>
            <Badge variant={getStatusColor(investment.status) as any}>
              {investment.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Investment Amount</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(investment.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Return</p>
                <p className="text-xl font-bold text-green-500">
                  {formatCurrency(investment.expected_return)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Profit Distributed</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(investment.profit_distributed)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Remaining</p>
                <p className="text-lg font-semibold">
                  {daysRemaining} days
                </p>
              </div>
            </div>

            {investment.status === 'active' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-sm font-medium">{progress.toFixed(1)}%</p>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Started: {new Date(investment.start_date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                Ends: {new Date(investment.end_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your investments...</p>
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
              <TrendingUp className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">My Investments</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Investment Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle>Investment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Investments</p>
                  <p className="text-2xl font-bold text-primary">
                    {investments.length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Active Investments</p>
                  <p className="text-xl font-semibold">
                    {investments.filter(inv => inv.status === 'active').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(investments.reduce((sum, inv) => sum + inv.amount, 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Expected Returns</p>
                  <p className="text-xl font-semibold text-green-500">
                    {formatCurrency(investments.reduce((sum, inv) => sum + inv.expected_return, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Investments Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="open" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="open" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Open Investments ({filterInvestmentsByStatus('open').length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pending ({filterInvestmentsByStatus('pending').length})
              </TabsTrigger>
              <TabsTrigger value="closed" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Closed ({filterInvestmentsByStatus('closed').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="mt-6">
              {filterInvestmentsByStatus('open').length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filterInvestmentsByStatus('open').map((investment) => (
                    <InvestmentCard key={investment.id} investment={investment} />
                  ))}
                </div>
              ) : (
                <Card className="glass">
                  <CardContent className="text-center py-12">
                    <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Open Investments</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any active investments at the moment.
                    </p>
                    <Button onClick={() => navigate('/dashboard')}>
                      Explore Investment Packages
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              {filterInvestmentsByStatus('pending').length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filterInvestmentsByStatus('pending').map((investment) => (
                    <InvestmentCard key={investment.id} investment={investment} />
                  ))}
                </div>
              ) : (
                <Card className="glass">
                  <CardContent className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Investments</h3>
                    <p className="text-muted-foreground">
                      You don't have any pending investments.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="closed" className="mt-6">
              {filterInvestmentsByStatus('closed').length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filterInvestmentsByStatus('closed').map((investment) => (
                    <InvestmentCard key={investment.id} investment={investment} />
                  ))}
                </div>
              ) : (
                <Card className="glass">
                  <CardContent className="text-center py-12">
                    <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Closed Investments</h3>
                    <p className="text-muted-foreground">
                      You don't have any completed investments yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Investments;