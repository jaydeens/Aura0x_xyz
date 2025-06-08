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
  Target,
  Info
} from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Stripe Payment Form Component
function StripePaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

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
    }
  };

  return (
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
  );
}

interface SteezeTransaction {
  id: string;
  type: string;
  amount: number;
  usdtAmount: string;
  ethAmount?: string;
  rate: string;
  status: string;
  createdAt: string;
}

function PurchaseForm({ onSuccess }: { onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  const purchaseMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      return apiRequest('POST', '/api/steeze/purchase', data);
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful",
        description: "Steeze tokens purchased successfully!",
      });
      onSuccess();
      setAmount('');
    },
    onError: () => {
      toast({
        title: "Purchase Failed",
        description: "Failed to purchase tokens",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    const purchaseAmount = parseFloat(amount);
    if (purchaseAmount < 0.001) {
      toast({
        title: "Invalid Amount",
        description: "Minimum purchase is 0.001 ETH",
        variant: "destructive",
      });
      return;
    }
    purchaseMutation.mutate({ amount: purchaseAmount });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="amount" className="text-gray-300">Amount (ETH)</Label>
        <Input
          id="amount"
          type="number"
          step="0.001"
          min="0.001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount in ETH"
          className="bg-[#2A2A2B] border-[#8000FF]/30 text-white"
        />
        <p className="text-sm text-gray-400 mt-1">
          You'll receive {amount ? Math.floor(parseFloat(amount) / 0.0001) : 0} Steeze tokens
        </p>
      </div>
      <Button 
        onClick={handlePurchase}
        disabled={!amount || parseFloat(amount) < 1 || purchaseMutation.isPending}
        className="w-full bg-[#8000FF] hover:bg-[#6600CC]"
      >
        {purchaseMutation.isPending ? 'Processing...' : 'Purchase Steeze'}
      </Button>
      <div className="text-xs text-gray-500 text-center">
        Demo purchase system - integrates with Stripe for secure payments
      </div>
    </div>
  );
}

function RedeemForm({ battleEarnedSteeze, onSuccess }: { battleEarnedSteeze: number; onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  const redeemMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      return apiRequest('POST', '/api/steeze/redeem', data);
    },
    onSuccess: () => {
      toast({
        title: "Redemption Successful",
        description: "Battle-earned Steeze redeemed successfully!",
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
    if (redeemAmount > battleEarnedSteeze) {
      toast({
        title: "Insufficient Balance",
        description: "You can only redeem Steeze earned from battles",
        variant: "destructive",
      });
      return;
    }
    redeemMutation.mutate({ amount: redeemAmount });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="redeem-amount" className="text-gray-300">Battle-Earned Steeze Amount</Label>
        <Input
          id="redeem-amount"
          type="number"
          min="1"
          max={battleEarnedSteeze}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter battle-earned Steeze to redeem"
          className="bg-[#2A2A2B] border-[#8000FF]/30 text-white"
        />
        <p className="text-sm text-gray-400 mt-1">
          Available to redeem: {battleEarnedSteeze} Steeze from battles
        </p>
        {amount && (
          <p className="text-sm text-green-400 mt-1">
            You'll receive: {(parseInt(amount) * 0.00007).toFixed(6)} ETH
          </p>
        )}
      </div>
      <Button 
        onClick={handleRedeem}
        disabled={!amount || parseInt(amount) < 1 || parseInt(amount) > battleEarnedSteeze || redeemMutation.isPending}
        className="w-full bg-[#FF6B6B] hover:bg-[#FF5252]"
      >
        {redeemMutation.isPending ? 'Processing...' : 'Redeem Battle Steeze'}
      </Button>
      {battleEarnedSteeze === 0 && (
        <div className="text-center text-gray-500 text-sm">
          Win battles in the Arena to earn redeemable Steeze
        </div>
      )}
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
    retry: false,
    enabled: !!user,
  });

  const handleTransactionUpdate = () => {
    refetchUser();
    refetchTransactions();
  };

  const steezeBalance = (user?.battleEarnedSteeze || 0) + (user?.purchasedSteeze || 0);
  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-gradient-to-br from-pink-600/25 to-orange-600/25 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>

      <Navigation />
      
      <main className="relative pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-black bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-4">
              💎 STEEZE RECHARGE 💎
            </h1>
            <p className="text-2xl text-white/80 font-semibold">
              Power up your battles with premium Steeze tokens
            </p>
          </div>

          {/* Balance Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Balance */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 text-white group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider">💎 Total</h3>
                <Wallet className="w-6 h-6 text-white/80" />
              </div>
              <div className="text-3xl font-black mb-1">{steezeBalance.toLocaleString()}</div>
              <div className="text-white/80 text-sm">Steeze tokens</div>
            </div>

            {/* Battle Earned */}
            <div className="bg-gradient-to-br from-green-500 to-cyan-500 rounded-3xl p-6 text-white group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider">⚔️ Battle</h3>
                <TrendingUp className="w-6 h-6 text-white/80" />
              </div>
              <div className="text-3xl font-black mb-1">{(user?.battleEarnedSteeze || 0).toLocaleString()}</div>
              <div className="text-white/80 text-sm">redeemable</div>
            </div>

            {/* Purchased */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl p-6 text-white group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider">💳 Bought</h3>
                <DollarSign className="w-6 h-6 text-white/80" />
              </div>
              <div className="text-3xl font-black mb-1">{(user?.purchasedSteeze || 0).toLocaleString()}</div>
              <div className="text-white/80 text-sm">non-redeemable</div>
            </div>


          </div>

          {/* Trading Interface */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Purchase/Redeem Form */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="flex space-x-2 bg-black/30 p-2 rounded-2xl mb-6">
                <Button
                  variant={activeTab === 'purchase' ? 'default' : 'ghost'}
                  className={`flex-1 rounded-xl font-bold transition-all duration-300 ${
                    activeTab === 'purchase' 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setActiveTab('purchase')}
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  BUY STEEZE
                </Button>
                <Button
                  variant={activeTab === 'redeem' ? 'default' : 'ghost'}
                  className={`flex-1 rounded-xl font-bold transition-all duration-300 ${
                    activeTab === 'redeem' 
                      ? 'bg-gradient-to-r from-green-500 to-cyan-500 text-white shadow-lg' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setActiveTab('redeem')}
                >
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  CASH OUT
                </Button>
              </div>
              
              <div className="min-h-[200px]">
                {activeTab === 'purchase' ? (
                  <PurchaseForm onSuccess={handleTransactionUpdate} />
                ) : (
                  <RedeemForm battleEarnedSteeze={user?.battleEarnedSteeze || 0} onSuccess={handleTransactionUpdate} />
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-800/30 to-purple-900/30 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white">How It Works</h3>
              </div>
              
              <div className="space-y-6">
                <div className="bg-black/20 rounded-2xl p-4 border border-green-500/20">
                  <h4 className="font-black text-green-400 mb-2 text-lg">💎 Purchase Steeze</h4>
                  <p className="text-white/80 text-sm leading-relaxed">Buy Steeze tokens to support friends in battles (purchased tokens are non-redeemable).</p>
                </div>
                
                <div className="bg-black/20 rounded-2xl p-4 border border-purple-500/20">
                  <h4 className="font-black text-purple-400 mb-2 text-lg">⚔️ Earn Battle Steeze</h4>
                  <p className="text-white/80 text-sm leading-relaxed">Fight in Aura Challenges to earn redeemable Steeze that can be converted to ETH.</p>
                </div>
                
                <div className="bg-black/20 rounded-2xl p-4 border border-cyan-500/20">
                  <h4 className="font-black text-cyan-400 mb-2 text-lg">💰 Redeem Policy</h4>
                  <p className="text-white/80 text-sm leading-relaxed">Only Steeze earned from battles can be redeemed - purchased Steeze supports friends only.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-black text-white">Transaction History</h3>
            </div>
            
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction: SteezeTransaction) => (
                  <div key={transaction.id} className="bg-black/30 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          transaction.type === 'purchase' 
                            ? 'bg-gradient-to-br from-green-500 to-cyan-500' 
                            : 'bg-gradient-to-br from-pink-500 to-rose-500'
                        }`}>
                          {transaction.type === 'purchase' ? (
                            <ArrowUpRight className="w-6 h-6 text-white" />
                          ) : (
                            <ArrowDownLeft className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-xl font-bold text-white capitalize">{transaction.type}</p>
                          <p className="text-white/60">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-black text-white">{transaction.amount} Steeze</p>
                        <p className="text-white/60">{Number(transaction.usdtAmount).toFixed(4)} ETH</p>
                      </div>
                      
                      <Badge 
                        className={`px-4 py-2 font-bold text-sm ${
                          transaction.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }`}
                      >
                        {transaction.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Coins className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4">
                  No Transactions Yet
                </h3>
                <p className="text-white/60 text-lg">
                  Start by purchasing your first Steeze tokens!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}