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
  const [amount, setAmount] = useState<number>(1000);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();
  
  const stripe = useStripe();
  const elements = useElements();

  const usdtCost = amount * 0.01;

  const createPaymentMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/steeze/purchase', { amount }),
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create payment. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/steeze-stack?success=true'
      }
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      onSuccess();
      setShowPayment(false);
      setClientSecret('');
    }
  };

  if (showPayment && clientSecret) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-white">
            Purchase {amount.toLocaleString()} Steeze
          </h3>
          <p className="text-gray-400">
            Total: ${usdtCost.toFixed(2)} USD
          </p>
        </div>
        
        <PaymentElement />
        
        <div className="flex space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setShowPayment(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!stripe}
            className="flex-1 bg-gradient-to-r from-[#00FF88] to-[#8000FF] hover:from-[#00FF88]/80 hover:to-[#8000FF]/80"
          >
            Complete Purchase
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="amount" className="text-white">Steeze Amount</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
          min="1"
          className="mt-2 bg-[#0A0A0B] border-[#8000FF]/20 text-white"
          placeholder="Enter amount to purchase"
        />
        <p className="text-sm text-gray-400 mt-1">
          Cost: ${usdtCost.toFixed(2)} USD (1 Steeze = $0.01)
        </p>
      </div>

      <Button 
        onClick={() => createPaymentMutation.mutate()}
        disabled={amount <= 0 || createPaymentMutation.isPending}
        className="w-full bg-gradient-to-r from-[#00FF88] to-[#8000FF] hover:from-[#00FF88]/80 hover:to-[#8000FF]/80 text-white font-semibold"
      >
        {createPaymentMutation.isPending ? "Creating Payment..." : "Purchase Steeze"}
      </Button>
    </div>
  );
}

function RedeemForm({ userBalance, onSuccess }: { userBalance: number; onSuccess: () => void }) {
  const [amount, setAmount] = useState<number>(100);
  const { toast } = useToast();

  const usdtValue = amount * 0.007;

  const redeemMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/steeze/redeem', { amount }),
    onSuccess: () => {
      toast({
        title: "Redemption Successful",
        description: `Redeemed ${amount} Steeze for $${usdtValue.toFixed(3)} USD`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Redemption Failed",
        description: error.message || "Failed to redeem Steeze",
        variant: "destructive"
      });
    }
  });

  const handleRedeem = () => {
    if (amount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough Steeze to redeem",
        variant: "destructive"
      });
      return;
    }
    redeemMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="redeem-amount" className="text-white">Steeze Amount to Redeem</Label>
        <Input
          id="redeem-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
          min="1"
          max={userBalance}
          className="mt-2 bg-[#0A0A0B] border-[#8000FF]/20 text-white"
          placeholder="Enter amount to redeem"
        />
        <p className="text-sm text-gray-400 mt-1">
          You'll receive: ${usdtValue.toFixed(3)} USD (1 Steeze = $0.007)
        </p>
        <p className="text-xs text-gray-500">
          Available balance: {userBalance.toLocaleString()} Steeze
        </p>
      </div>

      <Button 
        onClick={handleRedeem}
        disabled={amount <= 0 || amount > userBalance || redeemMutation.isPending}
        className="w-full bg-gradient-to-r from-[#FF8800] to-[#FFD700] hover:from-[#FF8800]/80 hover:to-[#FFD700]/80 text-black font-semibold"
      >
        {redeemMutation.isPending ? "Processing..." : "Redeem Steeze"}
      </Button>
    </div>
  );
}

export default function SteezeStack() {
  const { toast } = useToast();

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
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#00FF88] to-[#8000FF] bg-clip-text text-transparent">
            Steeze Stack
          </h1>
          <p className="text-gray-400 text-lg">
            Purchase and trade Steeze tokens to support your friends in battles
          </p>
        </div>

        {/* Balance & Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1A1A1B] border-[#00FF88]/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Steeze Balance</CardTitle>
              <Wallet className="h-4 w-4 text-[#00FF88]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#00FF88]">
                {steezeBalance.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400">
                ≈ ${(steezeBalance * 0.007).toFixed(2)} USD value
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Purchase Rate</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-[#8000FF]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#8000FF]">$0.01</div>
              <p className="text-xs text-gray-400">per Steeze token</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1B] border-[#FF8800]/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Redeem Rate</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-[#FF8800]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#FF8800]">$0.007</div>
              <p className="text-xs text-gray-400">per Steeze token</p>
            </CardContent>
          </Card>
        </div>

        {/* Trading Interface */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Purchase Section */}
          <Card className="bg-[#1A1A1B] border-[#00FF88]/20">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center">
                <Coins className="w-5 h-5 mr-2 text-[#00FF88]" />
                Purchase Steeze
              </CardTitle>
              <p className="text-gray-400">
                Buy Steeze tokens to support friends in battles
              </p>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise}>
                <PurchaseForm onSuccess={handleTransactionUpdate} />
              </Elements>
            </CardContent>
          </Card>

          {/* Redeem Section */}
          <Card className="bg-[#1A1A1B] border-[#FF8800]/20">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-[#FF8800]" />
                Redeem Steeze
              </CardTitle>
              <p className="text-gray-400">
                Convert your Steeze tokens back to USD
              </p>
            </CardHeader>
            <CardContent>
              <RedeemForm userBalance={steezeBalance} onSuccess={handleTransactionUpdate} />
            </CardContent>
          </Card>
        </div>

        {/* Rate Information */}
        <Card className="bg-[#1A1A1B] border-[#8000FF]/20 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center text-sm text-gray-300 mb-3">
              <Info className="w-4 h-4 mr-2 text-[#8000FF]" />
              <span className="font-semibold">Trading Rates & Platform Economics</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div>
                <strong className="text-[#00FF88]">Purchase:</strong> 1 Steeze = $0.01 USD
              </div>
              <div>
                <strong className="text-[#FF8800]">Redeem:</strong> 1 Steeze = $0.007 USD
              </div>
              <div>
                <strong className="text-[#8000FF]">Platform Fee:</strong> 30% on redemption
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-[#8000FF]" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction: SteezeTransaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-[#0A0A0B] rounded-lg">
                    <div className="flex items-center space-x-3">
                      {transaction.type === 'purchase' ? (
                        <ArrowUpRight className="w-4 h-4 text-[#00FF88]" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-[#FF8800]" />
                      )}
                      <div>
                        <div className="font-medium text-white capitalize">
                          {transaction.type}
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">
                        {transaction.amount.toLocaleString()} Steeze
                      </div>
                      <div className="text-sm text-gray-400">
                        ${parseFloat(transaction.usdtAmount).toFixed(3)} USD
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      {transaction.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  No transactions yet
                </h3>
                <p className="text-gray-500">
                  Start by purchasing your first Steeze tokens!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}