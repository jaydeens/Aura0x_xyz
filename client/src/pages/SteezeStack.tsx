import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { 
  Coins, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Wallet,
  Target,
  Info,
  Zap,
  ExternalLink,
  Loader2
} from "lucide-react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const BASE_SEPOLIA = {
  chainId: 84532,
  chainName: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
  blockExplorer: "https://sepolia-explorer.base.org/",
};

export default function SteezeStack() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ethAmount, setEthAmount] = useState("");
  const [steezeAmount, setSteezeAmount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const currentUser = user as any;
  const userWalletAddress = currentUser?.walletAddress;

  // Fetch user's Steeze balances
  const { data: balanceData } = useQuery({
    queryKey: ["/api/steeze/balance"],
    enabled: !!user,
  });

  // Fetch purchase information
  const { data: purchaseInfo } = useQuery({
    queryKey: ["/api/steeze/purchase"],
    enabled: !!user,
  });

  const purchasedSteeze = balanceData?.purchasedSteeze || 0;
  const earnedSteeze = balanceData?.battleEarnedSteeze || 0;
  const totalBalance = purchasedSteeze + earnedSteeze;

  // Fetch transaction history
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/steeze/transactions"],
    enabled: !!user,
  });

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to use this feature",
        variant: "destructive",
      });
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      setWalletAddress(accounts[0]);
      setCurrentChainId(parseInt(chainId, 16));
      setIsConnected(true);

      toast({
        title: "Wallet Connected",
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  // Switch to Base Sepolia network
  const switchToBaseSepolia = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${BASE_SEPOLIA.chainId.toString(16)}` }],
      });
      setCurrentChainId(BASE_SEPOLIA.chainId);
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: `0x${BASE_SEPOLIA.chainId.toString(16)}`,
              chainName: BASE_SEPOLIA.chainName,
              rpcUrls: [BASE_SEPOLIA.rpcUrl],
              blockExplorerUrls: [BASE_SEPOLIA.blockExplorer],
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
            }],
          });
          setCurrentChainId(BASE_SEPOLIA.chainId);
        } catch (addError: any) {
          toast({
            title: "Network Add Failed",
            description: addError.message || "Failed to add Base Sepolia network",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Network Switch Failed",
          description: error.message || "Failed to switch to Base Sepolia",
          variant: "destructive",
        });
      }
    }
  };

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async ({ ethValue, steezeAmount }: { ethValue: number; steezeAmount: number }) => {
      if (!window.ethereum || !isConnected || currentChainId !== BASE_SEPOLIA.chainId) {
        throw new Error("Please connect wallet and switch to Base Sepolia");
      }

      // Verify wallet matches user account
      if (userWalletAddress && walletAddress.toLowerCase() !== userWalletAddress.toLowerCase()) {
        throw new Error("Please connect the wallet associated with your account");
      }

      // Encode buySteeze(uint256 amount) function call
      const ABI = ["function buySteeze(uint256 amount)"];
      const iface = new ethers.Interface(ABI);
      const data = iface.encodeFunctionData("buySteeze", [steezeAmount]);
      
      const weiAmount = (ethValue * 1e18).toString();

      // Send transaction to smart contract
      const transactionParameters = {
        to: "0x52e660400626d8cfd85D1F88F189662b57b56962",
        from: walletAddress,
        value: '0x' + BigInt(weiAmount).toString(16),
        data: data,
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      return txHash;
    },
    onSuccess: (txHash) => {
      toast({
        title: "Purchase Initiated",
        description: "Transaction sent. Confirming...",
      });

      // Confirm purchase after delay
      setTimeout(() => {
        confirmPurchaseMutation.mutate(txHash);
      }, 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase Steeze",
        variant: "destructive",
      });
      setIsPurchasing(false);
    },
  });

  // Redeem mutation
  const redeemMutation = useMutation({
    mutationFn: async ({ steezeAmount }: { steezeAmount: number }) => {
      if (!window.ethereum || !isConnected || currentChainId !== BASE_SEPOLIA.chainId) {
        throw new Error("Please connect wallet and switch to Base Sepolia");
      }

      // Encode withdrawSteeze(uint256 amount) function call
      const ABI = ["function withdrawSteeze(uint256 amount)"];
      const iface = new ethers.Interface(ABI);
      const data = iface.encodeFunctionData("withdrawSteeze", [steezeAmount]);

      // Send transaction to smart contract
      const transactionParameters = {
        to: purchaseInfo?.contractAddress,
        from: walletAddress,
        value: '0x0',
        data: data,
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      return txHash;
    },
    onSuccess: (txHash) => {
      toast({
        title: "Redeem Initiated",
        description: "Transaction sent. Processing...",
      });

      // Confirm redeem after delay
      setTimeout(() => {
        confirmRedeemMutation.mutate(txHash);
      }, 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Redeem Failed",
        description: error.message || "Failed to redeem Steeze",
        variant: "destructive",
      });
      setIsRedeeming(false);
    },
  });

  // Confirm purchase mutation
  const confirmPurchaseMutation = useMutation({
    mutationFn: async (txHash: string) => {
      const response = await fetch('/api/steeze/confirm-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: txHash })
      });
      if (!response.ok) throw new Error('Failed to confirm purchase');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/steeze/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/steeze/transactions"] });
      toast({
        title: "Purchase Confirmed",
        description: "Steeze tokens added to your balance",
      });
      setIsPurchasing(false);
      setEthAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Confirmation Failed",
        description: error.message || "Failed to confirm purchase",
        variant: "destructive",
      });
      setIsPurchasing(false);
    },
  });

  // Confirm redeem mutation
  const confirmRedeemMutation = useMutation({
    mutationFn: async (txHash: string) => {
      const response = await fetch('/api/steeze/redeem-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: txHash })
      });
      if (!response.ok) throw new Error('Failed to confirm redeem');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/steeze/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/steeze/transactions"] });
      toast({
        title: "Redeem Confirmed",
        description: "ETH sent to your wallet",
      });
      setIsRedeeming(false);
      setSteezeAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Redeem Failed",
        description: error.message || "Failed to confirm redeem",
        variant: "destructive",
      });
      setIsRedeeming(false);
    },
  });

  // Handle purchase
  const handlePurchase = async () => {
    if (!ethAmount) return;

    const ethValue = parseFloat(ethAmount);
    if (ethValue <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid ETH amount",
        variant: "destructive",
      });
      return;
    }

    // Check if on correct network
    if (currentChainId !== BASE_SEPOLIA.chainId) {
      await switchToBaseSepolia();
      return;
    }

    const steezeAmount = Math.floor(ethValue * 10000); // Fixed rate: 10000 Steeze per ETH
    setIsPurchasing(true);
    purchaseMutation.mutate({ ethValue, steezeAmount });
  };

  // Handle redeem
  const handleRedeem = async () => {
    if (!steezeAmount) return;

    const steezeValue = parseFloat(steezeAmount);
    if (steezeValue <= 0 || steezeValue > earnedSteeze) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid Steeze amount. Only earned Steeze can be redeemed.",
        variant: "destructive",
      });
      return;
    }

    // Check if on correct network
    if (currentChainId !== BASE_SEPOLIA.chainId) {
      await switchToBaseSepolia();
      return;
    }

    setIsRedeeming(true);
    redeemMutation.mutate({ steezeAmount: Math.floor(steezeValue) });
  };

  const calculateSteezeAmount = () => {
    if (!ethAmount) return 0;
    return parseFloat(ethAmount) * 10000; // Fixed rate: 10000 Steeze per ETH
  };

  const calculateEthAmount = () => {
    if (!steezeAmount) return 0;
    return parseFloat(steezeAmount) / 10000; // Fixed rate: 10000 Steeze per ETH
  };

  const isOnCorrectNetwork = currentChainId === BASE_SEPOLIA.chainId;

  // Initialize wallet connection on page load
  useEffect(() => {
    if (window.ethereum) {
      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          
          // Get current chain ID
          window.ethereum.request({ method: 'eth_chainId' }).then((chainId: string) => {
            setCurrentChainId(parseInt(chainId, 16));
          });
        }
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setWalletAddress("");
          setIsConnected(false);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        setCurrentChainId(parseInt(chainId, 16));
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900">
      <Navigation />
      
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                  STEEZE RECHARGE
                </h1>
                <p className="text-white/60 text-lg">Buy and redeem Steeze tokens with ETH</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Total Balance</p>
                    <p className="text-2xl font-bold text-white">{totalBalance.toLocaleString()} STEEZE</p>
                    <p className="text-xs text-white/40">Purchased: {purchasedSteeze} | Earned: {earnedSteeze}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Fixed Rate</p>
                    <p className="text-2xl font-bold text-white">10,000 STEEZE/ETH</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Network</p>
                    <p className="text-2xl font-bold text-white">Base Sepolia</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Buy/Redeem Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Buy Section */}
            <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                    <ArrowUpRight className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Buy Steeze</CardTitle>
                    <CardDescription className="text-white/60">
                      Purchase Steeze tokens with ETH
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Wallet Connection */}
                {!isConnected ? (
                  <Button 
                    onClick={connectWallet}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                ) : !isOnCorrectNetwork ? (
                  <Button 
                    onClick={switchToBaseSepolia}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    Switch to Base Sepolia
                  </Button>
                ) : (
                  <div>
                    {/* ETH Input */}
                    <div className="space-y-2">
                      <Label htmlFor="eth-amount" className="text-white">ETH Amount</Label>
                      <Input
                        id="eth-amount"
                        type="number"
                        step="0.001"
                        placeholder="0.1"
                        value={ethAmount}
                        onChange={(e) => setEthAmount(e.target.value)}
                        className="bg-black/20 border-purple-500/30 text-white placeholder:text-white/40"
                      />
                    </div>

                    {/* Steeze Preview */}
                    {ethAmount && (
                      <div className="p-4 bg-black/20 rounded-xl mt-4">
                        <p className="text-sm text-white/60 mb-1">You will receive</p>
                        <p className="text-2xl font-bold text-white">
                          {calculateSteezeAmount().toLocaleString()} STEEZE
                        </p>
                      </div>
                    )}

                    {/* Buy Button */}
                    <Button
                      onClick={handlePurchase}
                      disabled={!ethAmount || isPurchasing}
                      className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4 mr-2" />
                          Buy Steeze
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Redeem Section */}
            <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center">
                    <ArrowDownLeft className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Redeem Steeze</CardTitle>
                    <CardDescription className="text-white/60">
                      Convert Steeze tokens back to ETH
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {!isConnected ? (
                  <Button 
                    onClick={connectWallet}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                ) : !isOnCorrectNetwork ? (
                  <Button 
                    onClick={switchToBaseSepolia}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    Switch to Base Sepolia
                  </Button>
                ) : (
                  <div>
                    {/* Steeze Input */}
                    <div className="space-y-2">
                      <Label htmlFor="steeze-amount" className="text-white">
                        Steeze Amount (Max: {userBalance.toLocaleString()})
                      </Label>
                      <Input
                        id="steeze-amount"
                        type="number"
                        step="1"
                        placeholder="1000"
                        value={steezeAmount}
                        onChange={(e) => setSteezeAmount(e.target.value)}
                        className="bg-black/20 border-purple-500/30 text-white placeholder:text-white/40"
                      />
                    </div>

                    {/* ETH Preview */}
                    {steezeAmount && (
                      <div className="p-4 bg-black/20 rounded-xl mt-4">
                        <p className="text-sm text-white/60 mb-1">You will receive</p>
                        <p className="text-2xl font-bold text-white">
                          {calculateEthAmount().toFixed(6)} ETH
                        </p>
                      </div>
                    )}

                    {/* Redeem Button */}
                    <Button
                      onClick={handleRedeem}
                      disabled={!steezeAmount || isRedeeming || parseFloat(steezeAmount) > userBalance}
                      className="w-full mt-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                    >
                      {isRedeeming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="w-4 h-4 mr-2" />
                          Redeem Steeze
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Clock className="w-5 h-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((tx: any) => (
                    <div
                      key={tx.id}
                      className="p-4 bg-black/20 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === 'purchase' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {tx.type === 'purchase' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {tx.type === 'purchase' ? 'Bought' : 'Redeemed'} {tx.amount.toLocaleString()} STEEZE
                          </p>
                          <p className="text-white/60 text-sm">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                          {tx.status}
                        </Badge>
                        {tx.txHash && (
                          <a
                            href={`${BASE_SEPOLIA.blockExplorer}/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 text-sm mt-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}