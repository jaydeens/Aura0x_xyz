import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Navigation from '@/components/Navigation';
import { 
  Coins, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  DollarSign,
  Wallet,
  Info
} from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SteezeTransaction {
  id: string;
  type: string;
  amount: number;
  usdtAmount: string;
  rate: string;
  status: string;
  createdAt: string;
}

function PurchaseForm({ onSuccess }: { onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const { toast } = useToast();

  const stripe = useStripe();
  const elements = useElements();

  const createPaymentIntent = useMutation({
    mutationFn: async (data: { amount: number }) => {
      const response = await apiRequest('POST', '/api/create-payment-intent', data);
      const result = await response.json();
      return result.clientSecret;
    },
    onSuccess: (secret) => {
      setClientSecret(secret);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create payment intent",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/steeze-stack",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Steeze tokens purchased successfully!",
      });
      onSuccess();
      setAmount('');
      setClientSecret('');
    }
  };

  const handlePurchase = () => {
    const purchaseAmount = parseFloat(amount);
    if (purchaseAmount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Minimum purchase is $1.00",
        variant: "destructive",
      });
      return;
    }
    createPaymentIntent.mutate({ amount: purchaseAmount });
  };

  if (clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <Button 
            type="submit" 
            disabled={!stripe}
            className="w-full bg-[#8000FF] hover:bg-[#6600CC]"
          >
            Complete Purchase
          </Button>
        </form>
      </Elements>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="amount" className="text-gray-300">Amount (USD)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount in USD"
          className="bg-[#2A2A2B] border-[#8000FF]/30 text-white"
        />
        <p className="text-sm text-gray-400 mt-1">
          You'll receive {amount ? Math.floor(parseFloat(amount) * 100) : 0} Steeze tokens
        </p>
      </div>
      <Button 
        onClick={handlePurchase}
        disabled={!amount || parseFloat(amount) < 1 || createPaymentIntent.isPending}
        className="w-full bg-[#8000FF] hover:bg-[#6600CC]"
      >
        {createPaymentIntent.isPending ? 'Processing...' : 'Purchase Steeze'}
      </Button>
    </div>
  );
}

function RedeemForm({ userBalance, onSuccess }: { userBalance: number; onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  const redeemMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      return apiRequest('POST', '/api/steeze/redeem', data);
    },
    onSuccess: () => {
      toast({
        title: "Redemption Successful",
        description: "Steeze tokens redeemed successfully!",
      });
      onSuccess();
      setAmount('');
    },
    onError: () => {
      toast({
        title: "Redemption Failed",
        description: "Failed to redeem tokens",
        variant: "destructive",
      });
    },
  });

  const handleRedeem = () => {
    const redeemAmount = parseInt(amount);
    if (redeemAmount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Minimum redemption is 1 Steeze token",
        variant: "destructive",
      });
      return;
    }
    if (redeemAmount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough Steeze tokens",
        variant: "destructive",
      });
      return;
    }
    redeemMutation.mutate({ amount: redeemAmount });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="redeem-amount" className="text-gray-300">Steeze Amount</Label>
        <Input
          id="redeem-amount"
          type="number"
          min="1"
          max={userBalance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter Steeze tokens to redeem"
          className="bg-[#2A2A2B] border-[#8000FF]/30 text-white"
        />
        <p className="text-sm text-gray-400 mt-1">
          You'll receive ${amount ? (parseInt(amount) * 0.007).toFixed(3) : '0.000'} USD
        </p>
      </div>
      <Button 
        onClick={handleRedeem}
        disabled={!amount || parseInt(amount) < 1 || parseInt(amount) > userBalance || redeemMutation.isPending}
        className="w-full bg-[#FF6B6B] hover:bg-[#FF5252]"
      >
        {redeemMutation.isPending ? 'Processing...' : 'Redeem Steeze'}
      </Button>
    </div>
  );
}

export default function SteezeStack() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'purchase' | 'redeem'>('purchase');

  // Fetch user data
  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  // Fetch transactions
  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['/api/steeze/transactions'],
  });

  const handleTransactionUpdate = () => {
    refetchUser();
    refetchTransactions();
  };

  const steezeBalance = user?.steezeBalance || 0;
  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B]">
      <Navigation />
      
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[#8000FF] to-[#9933FF] bg-clip-text text-transparent">
              Steeze Stack
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Purchase and trade Steeze tokens to support your friends in battles
            </p>
          </div>

          {/* Balance & Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Steeze Balance</CardTitle>
                <Wallet className="h-4 w-4 text-[#8000FF]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#8000FF]">{steezeBalance.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Steeze tokens</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Purchase Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-[#00FF88]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#00FF88]">$0.01</div>
                <p className="text-xs text-gray-500">per Steeze token</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Redeem Rate</CardTitle>
                <DollarSign className="h-4 w-4 text-[#FF6B6B]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#FF6B6B]">$0.007</div>
                <p className="text-xs text-gray-500">per Steeze token</p>
              </CardContent>
            </Card>
          </div>

          {/* Trading Interface */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Purchase/Redeem Form */}
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardHeader>
                <div className="flex space-x-1 bg-[#2A2A2B] p-1 rounded-lg">
                  <Button
                    variant={activeTab === 'purchase' ? 'default' : 'ghost'}
                    className={`flex-1 ${activeTab === 'purchase' ? 'bg-[#8000FF] text-white' : 'text-gray-400'}`}
                    onClick={() => setActiveTab('purchase')}
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Purchase
                  </Button>
                  <Button
                    variant={activeTab === 'redeem' ? 'default' : 'ghost'}
                    className={`flex-1 ${activeTab === 'redeem' ? 'bg-[#FF6B6B] text-white' : 'text-gray-400'}`}
                    onClick={() => setActiveTab('redeem')}
                  >
                    <ArrowDownLeft className="w-4 h-4 mr-2" />
                    Redeem
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === 'purchase' ? (
                  <PurchaseForm onSuccess={handleTransactionUpdate} />
                ) : (
                  <RedeemForm userBalance={steezeBalance} onSuccess={handleTransactionUpdate} />
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#8000FF]">
                  <Info className="w-5 h-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <div>
                  <h4 className="font-semibold text-[#00FF88] mb-2">Purchase Steeze</h4>
                  <p className="text-sm">Buy Steeze tokens at $0.01 each to support friends in battles or trade later.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#FF6B6B] mb-2">Redeem Steeze</h4>
                  <p className="text-sm">Convert your Steeze tokens back to USD at $0.007 each (30% platform fee).</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#8000FF] mb-2">Battle Support</h4>
                  <p className="text-sm">Use Steeze tokens to support friends in battles and help them win more Aura points.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction: SteezeTransaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-[#2A2A2B] rounded-lg border border-[#8000FF]/10">
                      <div className="flex items-center gap-3">
                        {transaction.type === 'purchase' ? (
                          <ArrowUpRight className="w-4 h-4 text-[#00FF88]" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 text-[#FF6B6B]" />
                        )}
                        <div>
                          <p className="font-medium text-white capitalize">{transaction.type}</p>
                          <p className="text-sm text-gray-400">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white">{transaction.amount} Steeze</p>
                        <p className="text-sm text-gray-400">${transaction.usdtAmount}</p>
                      </div>
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        className={transaction.status === 'completed' ? 'bg-[#00FF88]/20 text-[#00FF88]' : ''}
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    No transactions yet
                  </h3>
                  <p className="text-gray-500">
                    Start by purchasing your first Steeze tokens!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}