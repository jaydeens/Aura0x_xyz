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
  Loader2,
  Trophy,
  RotateCcw
} from "lucide-react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const BASE_MAINNET = {
  chainId: 8453,
  chainName: "Base Mainnet",
  rpcUrl: "https://mainnet.base.org",
  blockExplorer: "https://basescan.org/",
};

export default function SteezeStack() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [usdcAmount, setUsdcAmount] = useState("");
  const [steezeAmount, setSteezeAmount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);

  const currentUser = user as any;
  const userWalletAddress = currentUser?.walletAddress;
  const isOnCorrectNetwork = currentChainId === BASE_MAINNET.chainId;

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

  // Fetch transaction history
  const { data: transactionsData = [] } = useQuery({
    queryKey: ["/api/steeze/transactions"],
    enabled: !!user,
  });

  // Fetch USDC balance when wallet is connected
  const { data: usdcBalanceData, refetch: refetchUsdcBalance, isRefetching } = useQuery({
    queryKey: [`/api/wallet/usdc-balance/${walletAddress}`],
    enabled: !!walletAddress && isConnected && isOnCorrectNetwork,
    refetchOnWindowFocus: true, // Refetch when window gets focus
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const purchasedSteeze = (balanceData as any)?.purchasedSteeze || 0;
  const earnedSteeze = (balanceData as any)?.battleEarnedSteeze || 0;
  const totalBalance = purchasedSteeze + earnedSteeze;
  const currentUsdcBalance = (usdcBalanceData as any)?.balance || 0;

  const transactions = (transactionsData as any[]) || [];

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

  // Switch to Base Mainnet network
  const switchToBaseMainnet = async () => {
    if (!window.ethereum) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log(`Switching to Base Mainnet (Chain ID: ${BASE_MAINNET.chainId})`);
      
      // First ensure wallet is connected
      if (!isConnected) {
        await connectWallet();
      }
      
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${BASE_MAINNET.chainId.toString(16)}` }],
      });
      
      // Wait a moment for the switch to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update chain ID after successful switch
      const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const parsedChainId = parseInt(newChainId, 16);
      setCurrentChainId(parsedChainId);
      
      if (parsedChainId === BASE_MAINNET.chainId) {
        toast({
          title: "Network Switched",
          description: "Successfully switched to Base Mainnet",
        });
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("Network switch error:", error);
      
      if (error.code === 4902) {
        // Network not added yet, try to add it
        try {
          console.log("Adding Base Mainnet network...");
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: `0x${BASE_MAINNET.chainId.toString(16)}`,
              chainName: BASE_MAINNET.chainName,
              rpcUrls: [BASE_MAINNET.rpcUrl],
              blockExplorerUrls: [BASE_MAINNET.blockExplorer],
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
            }],
          });
          
          // Wait a moment for the add to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update chain ID after successful add
          const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
          const parsedChainId = parseInt(newChainId, 16);
          setCurrentChainId(parsedChainId);
          
          if (parsedChainId === BASE_MAINNET.chainId) {
            toast({
              title: "Network Added",
              description: "Base Mainnet network added and switched successfully",
            });
            return true;
          }
          
          return false;
        } catch (addError: any) {
          console.error("Network add error:", addError);
          toast({
            title: "Network Add Failed",
            description: addError.message || "Failed to add Base Mainnet network",
            variant: "destructive",
          });
          return false;
        }
      } else if (error.code === 4001) {
        // User rejected the request
        toast({
          title: "Network Switch Cancelled",
          description: "Please switch to Base Mainnet to continue",
          variant: "destructive",
        });
        return false;
      } else {
        toast({
          title: "Network Switch Failed",
          description: error.message || "Failed to switch to Base Mainnet",
          variant: "destructive",
        });
        return false;
      }
    }
  };

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async ({ usdcValue, steezeAmount }: { usdcValue: number; steezeAmount: number }) => {
      if (!window.ethereum) {
        throw new Error("MetaMask not detected. Please install MetaMask.");
      }
      
      if (!isConnected) {
        throw new Error("Please connect your wallet first");
      }
      
      if (currentChainId !== BASE_MAINNET.chainId) {
        throw new Error(`Please switch to Base Mainnet network. Current network: ${currentChainId}`);
      }

      // Verify wallet matches user account
      if (userWalletAddress && walletAddress.toLowerCase() !== userWalletAddress.toLowerCase()) {
        throw new Error("Please connect the wallet associated with your account");
      }

      // Encode buySteeze(uint256 amount) function call
      const ABI = ["function buySteeze(uint256 amount)"];
      const iface = new ethers.Interface(ABI);
      const data = iface.encodeFunctionData("buySteeze", [steezeAmount]);
      
      const usdcAmount = (usdcValue * 1e6).toString(); // USDC has 6 decimals

      // Send USDC transaction to smart contract
      const transactionParameters = {
        to: "0xf209E955Ad3711EE983627fb52A32615455d8cC3", // Updated mainnet contract
        from: walletAddress,
        value: '0x' + BigInt(usdcAmount).toString(16),
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
      if (!window.ethereum || !isConnected || currentChainId !== BASE_MAINNET.chainId) {
        throw new Error("Please connect wallet and switch to Base Mainnet");
      }

      // Encode withdrawSteeze(uint256 amount) function call
      const ABI = ["function withdrawSteeze(uint256 amount)"];
      const iface = new ethers.Interface(ABI);
      const data = iface.encodeFunctionData("withdrawSteeze", [steezeAmount]);

      // Send transaction to smart contract
      const transactionParameters = {
        to: "0xf209E955Ad3711EE983627fb52A32615455d8cC3", // Updated mainnet contract
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
      setUsdcAmount("");
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
        description: "USDC sent to your wallet",
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
    if (!usdcAmount) return;

    const usdcValue = parseFloat(usdcAmount);
    if (usdcValue <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid USDC amount",
        variant: "destructive",
      });
      return;
    }

    // Check USDC balance
    if (usdcValue > currentUsdcBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${usdcValue} USDC but only have ${currentUsdcBalance.toFixed(2)} USDC in your wallet`,
        variant: "destructive",
      });
      return;
    }

    // Ensure wallet is connected
    if (!isConnected) {
      await connectWallet();
      return;
    }

    // Check if on correct network and switch if needed
    if (currentChainId !== BASE_MAINNET.chainId) {
      const switchSuccessful = await switchToBaseMainnet();
      if (!switchSuccessful) {
        toast({
          title: "Network Required",
          description: "Please switch to Base Mainnet to continue",
          variant: "destructive",
        });
        return;
      }
    }

    const steezeAmount = Math.floor(usdcValue * 10); // Purchase rate: 1 USDC = 10 Steeze
    setIsPurchasing(true);
    purchaseMutation.mutate({ usdcValue, steezeAmount });
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
    if (currentChainId !== BASE_MAINNET.chainId) {
      await switchToBaseMainnet();
      return;
    }

    setIsRedeeming(true);
    redeemMutation.mutate({ steezeAmount: Math.floor(steezeValue) });
  };

  const calculateSteezeAmount = () => {
    if (!usdcAmount) return 0;
    return parseFloat(usdcAmount) * 10; // Purchase rate: 1 USDC = 10 Steeze (or 1 Steeze = 0.1 USDC)
  };

  const calculateUsdcAmount = () => {
    if (!steezeAmount) return 0;
    return parseFloat(steezeAmount) * 0.07; // Redeem rate: 1 Steeze = 0.07 USDC
  };
  
  // Debug logging (remove in production)
  useEffect(() => {
    console.log("Wallet State:", { 
      isConnected, 
      walletAddress, 
      currentChainId, 
      expectedChainId: BASE_MAINNET.chainId,
      isOnCorrectNetwork 
    });
  }, [isConnected, walletAddress, currentChainId]);

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
                <p className="text-white/60 text-lg">Buy and redeem Steeze tokens with USDC</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
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
                        <ArrowUpRight className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Purchased</p>
                        <p className="text-2xl font-bold text-white">{purchasedSteeze.toLocaleString()} STEEZE</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Earned</p>
                        <p className="text-2xl font-bold text-white">{earnedSteeze.toLocaleString()} STEEZE</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Small Network Card - Top Right */}
              <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20 ml-6 w-48">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Network</p>
                      <p className="text-sm font-bold text-white">Base Mainnet</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                      Purchase Steeze tokens with USDC
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
                    onClick={switchToBaseMainnet}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    Switch to Base Mainnet
                  </Button>
                ) : (
                  <div>
                    {/* USDC Balance Display */}
                    <div className="p-4 bg-black/20 rounded-xl border border-purple-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white/60">Your USDC Balance</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-white">
                            {currentUsdcBalance.toFixed(2)} USDC
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => refetchUsdcBalance()}
                            disabled={isRefetching}
                            className="text-white/60 hover:text-white p-1 h-auto"
                            title={isRefetching ? "Refreshing..." : "Refresh balance"}
                          >
                            <RotateCcw className={`w-3 h-3 ${isRefetching ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                      
                    </div>

                    {/* USDC Input */}
                    <div className="space-y-2">
                      <Label htmlFor="usdc-amount" className="text-white">USDC Amount</Label>
                      <Input
                        id="usdc-amount"
                        type="number"
                        step="0.01"
                        placeholder="1.0"
                        value={usdcAmount}
                        onChange={(e) => setUsdcAmount(e.target.value)}
                        className="bg-black/20 border-purple-500/30 text-white placeholder:text-white/40"
                      />
                      <div className="flex justify-between text-sm text-white/60">
                        <span>Available: {currentUsdcBalance.toFixed(2)} USDC</span>
                        <button 
                          onClick={() => setUsdcAmount(currentUsdcBalance.toString())}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          Use Max
                        </button>
                      </div>
                    </div>

                    {/* Steeze Preview */}
                    {usdcAmount && (
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
                      disabled={!usdcAmount || isPurchasing || parseFloat(usdcAmount || "0") > currentUsdcBalance}
                      className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : parseFloat(usdcAmount || "0") > currentUsdcBalance ? (
                        <>
                          <Info className="w-4 h-4 mr-2" />
                          Insufficient Balance
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
                      Convert Steeze tokens back to USDC
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
                    onClick={switchToBaseMainnet}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    Switch to Base Mainnet
                  </Button>
                ) : (
                  <div>
                    {/* Steeze Input */}
                    <div className="space-y-2">
                      <Label htmlFor="steeze-amount" className="text-white">
                        Steeze Amount (Max: {earnedSteeze.toLocaleString()} earned)
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

                    {/* USDC Preview */}
                    {steezeAmount && (
                      <div className="p-4 bg-black/20 rounded-xl mt-4">
                        <p className="text-sm text-white/60 mb-1">You will receive</p>
                        <p className="text-2xl font-bold text-white">
                          {calculateUsdcAmount().toFixed(4)} USDC
                        </p>
                      </div>
                    )}

                    {/* Redeem Button */}
                    <Button
                      onClick={handleRedeem}
                      disabled={!steezeAmount || isRedeeming || parseFloat(steezeAmount) > earnedSteeze}
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
                          {tx.transactionHash && (
                            <p className="text-white/40 text-xs mt-1 font-mono">
                              {tx.transactionHash.slice(0, 10)}...{tx.transactionHash.slice(-8)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                          {tx.status}
                        </Badge>
                        {tx.transactionHash && (
                          <div className="mt-1">
                            <a
                              href={`${BASE_MAINNET.blockExplorer}tx/${tx.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 text-sm underline"
                            >
                              View on Explorer <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
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