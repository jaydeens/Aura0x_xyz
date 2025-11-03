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
import { useCelebration } from "@/components/CelebrationAnimation";
import { 
  Brain,
  Cpu, 
  Network, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Wallet,
  Layers,
  Binary,
  Zap,
  ExternalLink,
  Loader2,
  Sparkles,
  RotateCcw,
  Database,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { buySLP, sellSLP, getUSDTBalance as getSolanaUSDTBalance, checkPoolStatus, initializePool } from "@/lib/carvSVMSimple";
import { PublicKey } from "@solana/web3.js";

declare global {
  interface Window {
    phantom?: {
      solana?: any;
    };
    solana?: any;
    backpack?: any;
  }
}

export default function Potions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerSteezeCelebration } = useCelebration();
  const [usdtAmount, setUsdtAmount] = useState("");
  const [potionsAmount, setPotionsAmount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [isInitializingPool, setIsInitializingPool] = useState(false);

  const currentUser = user as any;
  const userWalletAddress = currentUser?.walletAddress;
  
  // Detect wallet type from address format
  const isSolanaWallet = (address: string | undefined) => {
    if (!address) return false;
    // Solana addresses are base58, typically 32-44 chars, no 0x prefix
    // Ethereum addresses are 0x-prefixed, 42 chars
    return !address.startsWith('0x') && address.length >= 32 && address.length <= 44;
  };
  
  // Check both runtime walletAddress (from connect button) and stored userWalletAddress
  const effectiveAddress = walletAddress || userWalletAddress;
  const connectedWithSolana = isSolanaWallet(effectiveAddress);
  const isOnCorrectNetwork = connectedWithSolana;
  
  // Get Solana wallet object
  const getSolanaWallet = () => {
    // Check for Backpack first (has priority if both are installed)
    if (window.backpack?.isBackpack) {
      return window.backpack;
    }
    // Then check for Phantom
    if (window.phantom?.solana?.isPhantom) {
      return window.phantom.solana;
    }
    if (window.solana?.isPhantom) {
      return window.solana;
    }
    // Fallback to any Solana provider
    if (window.solana) {
      return window.solana;
    }
    return null;
  };

  const refreshNetworkStatus = async () => {
    const wallet = getSolanaWallet();
    
    if (!wallet) {
      toast({
        title: "No Solana Wallet Found",
        description: "Please install Phantom or Backpack wallet",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const isConnected = wallet.isConnected || wallet.connected;
      
      if (isConnected) {
        toast({
          title: "CARV SVM Chain",
          description: "✓ Solana wallet connected and ready",
        });
      } else {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your Solana wallet",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to check wallet status:", error);
      toast({
        title: "Status Check Failed",
        description: "Please check your wallet connection",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (userWalletAddress && !isConnected) {
      setWalletAddress(userWalletAddress);
      setIsConnected(true);
    }
  }, [userWalletAddress, isConnected]);

  useEffect(() => {
    const effectiveAddress = userWalletAddress || walletAddress;
    if (effectiveAddress && connectedWithSolana) {
      console.log(`Wallet changed to: ${effectiveAddress} (Solana wallet)`);
      // Refetch USDT balance when wallet changes
      refetchUsdtBalance();
    }
  }, [userWalletAddress, walletAddress, connectedWithSolana]);

  const { data: balanceData } = useQuery({
    queryKey: ["/api/potions/balance"],
    enabled: !!user,
  });

  const { data: purchaseInfo } = useQuery({
    queryKey: ["/api/steeze/purchase"],
    enabled: !!user,
  });

  const { data: transactionsData = [] } = useQuery({
    queryKey: ["/api/potions/transactions"],
    enabled: !!user,
  });

  const effectiveWalletAddress = userWalletAddress || walletAddress;
  
  // Fetch USDT balance directly from CARV SVM Chain for Solana wallets
  const { data: usdtBalanceData, refetch: refetchUsdtBalance, isRefetching } = useQuery({
    queryKey: [`carv-svm-usdt-balance`, effectiveWalletAddress],
    queryFn: async () => {
      if (!effectiveWalletAddress || !connectedWithSolana) {
        return { balance: 0 };
      }
      try {
        const balance = await getSolanaUSDTBalance(effectiveWalletAddress);
        return { balance };
      } catch (error) {
        console.error("Error fetching Solana USDT balance:", error);
        return { balance: 0 };
      }
    },
    enabled: !!effectiveWalletAddress && connectedWithSolana,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Check pool initialization status
  const { data: poolStatus, refetch: refetchPoolStatus } = useQuery({
    queryKey: ['pool-status'],
    queryFn: checkPoolStatus,
    enabled: connectedWithSolana,
    refetchInterval: false, // Only check once on load
    staleTime: Infinity,
  });
  
  const isPoolInitialized = poolStatus?.initialized || false;

  const purchasedPotions = (balanceData as any)?.purchasedSteeze || 0;
  const earnedPotions = (balanceData as any)?.battleEarnedSteeze || 0;
  const totalBalance = purchasedPotions + earnedPotions;
  const currentUsdtBalance = (usdtBalanceData as any)?.balance || 0;

  const transactions = (transactionsData as any[]) || [];

  const connectWallet = async () => {
    // User already has wallet connected from Landing page
    // Just verify the wallet extension is available
    const wallet = getSolanaWallet();
    
    if (!wallet) {
      toast({
        title: "Solana Wallet Required",
        description: "Please install Phantom or Backpack wallet for CARV SVM Chain",
        variant: "destructive",
      });
      return;
    }

    if (!userWalletAddress) {
      toast({
        title: "Not Authenticated",
        description: "Please connect your wallet from the landing page first",
        variant: "destructive",
      });
      return;
    }

    // Use the already-authenticated wallet address
    setWalletAddress(userWalletAddress);
    setIsConnected(true);

    toast({
      title: "Wallet Ready",
      description: `Using ${userWalletAddress.slice(0, 6)}...${userWalletAddress.slice(-4)} on CARV SVM`,
    });
  };

  const initializePoolMutation = useMutation({
    mutationFn: async () => {
      if (!isConnected) {
        throw new Error("Please connect your wallet first");
      }
      
      if (!connectedWithSolana) {
        throw new Error("Please connect a Solana wallet (Phantom or Backpack)");
      }
      
      const wallet = getSolanaWallet();
      if (!wallet) {
        throw new Error("Solana wallet not found. Please install Phantom or Backpack wallet.");
      }
      
      setIsInitializingPool(true);
      
      toast({
        title: "Initializing Pool",
        description: "Preparing initialization transaction...",
      });
      
      const userPublicKey = new PublicKey(effectiveAddress);
      const signature = await initializePool(wallet, userPublicKey);
      
      console.log("✓ Pool initialized successfully! Transaction:", signature);
      
      return signature;
    },
    onSuccess: () => {
      toast({
        title: "Pool Initialized!",
        description: "Liquidity pool is now ready for trading",
      });
      setIsInitializingPool(false);
      // Refetch pool status to update UI
      refetchPoolStatus();
    },
    onError: (error: Error) => {
      toast({
        title: "Initialization Failed",
        description: error.message || "Failed to initialize pool",
        variant: "destructive",
      });
      setIsInitializingPool(false);
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ usdtValue, potionsAmount }: { usdtValue: number; potionsAmount: number }) => {
      if (!isConnected) {
        throw new Error("Please connect your wallet first");
      }
      
      if (!connectedWithSolana) {
        throw new Error("Please connect a Solana wallet (Phantom or Backpack) to purchase SLP on CARV SVM Chain");
      }
      
      const wallet = getSolanaWallet();
      if (!wallet) {
        throw new Error("Solana wallet not found. Please install Phantom or Backpack wallet.");
      }
      
      toast({
        title: "Preparing Transaction",
        description: "Building transaction for CARV SVM Chain...",
      });
      
      const userPublicKey = new PublicKey(effectiveAddress);
      const signature = await buySLP(wallet, userPublicKey, usdtValue);
      
      console.log("✓ SLP purchase successful! Transaction:", signature);
      
      // Record transaction in backend
      const response = await apiRequest('POST', '/api/potions/purchase', {
        usdtAmount: usdtValue,
        potionsAmount,
        txHash: signature,
        walletAddress: effectiveAddress,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "SLP Acquired!",
        description: "Neural tokens successfully added to your vault",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/potions/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/potions/transactions"] });
      setUsdtAmount("");
      refetchUsdtBalance();
      setIsPurchasing(false);
      triggerSteezeCelebration();
    },
    onError: (error: Error) => {
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to purchase SLP",
        variant: "destructive",
      });
      setIsPurchasing(false);
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async ({ potionsAmount, usdtValue }: { potionsAmount: number; usdtValue: number }) => {
      if (!isConnected) {
        throw new Error("Please connect your wallet first");
      }
      
      if (!connectedWithSolana) {
        throw new Error("Please connect a Solana wallet (Phantom or Backpack) to liquidate SLP on CARV SVM Chain");
      }
      
      const wallet = getSolanaWallet();
      if (!wallet) {
        throw new Error("Solana wallet not found. Please install Phantom or Backpack wallet.");
      }
      
      toast({
        title: "Processing Liquidation",
        description: "Preparing transaction...",
      });
      
      console.log("Selling SLP on CARV SVM Chain:");
      console.log("- SLP Amount:", potionsAmount);
      console.log("- USDT Value:", usdtValue);
      console.log("- Wallet Address:", effectiveAddress);
      
      toast({
        title: "Confirm Transaction",
        description: "Please approve the transaction in your wallet...",
      });
      
      const userPublicKey = new PublicKey(effectiveAddress);
      const signature = await sellSLP(wallet, userPublicKey, potionsAmount);
      
      console.log("✓ SLP liquidation successful! Transaction:", signature);
      
      // Record transaction in backend
      const response = await apiRequest('POST', '/api/potions/redeem', {
        potionsAmount,
        txHash: signature,
        walletAddress: effectiveAddress,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "SLP Liquidated!",
        description: "USDT transfer initiated to your wallet",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/potions/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/potions/transactions"] });
      setPotionsAmount("");
      setIsRedeeming(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Liquidation Failed",
        description: error.message || "Failed to redeem SLP",
        variant: "destructive",
      });
      setIsRedeeming(false);
    },
  });

  const calculatePotionsAmount = () => {
    const usdtValue = parseFloat(usdtAmount || "0");
    // Buy rate: 1 USDT = 100 SLP (or 1 SLP = 0.01 USDT)
    return Math.floor(usdtValue * 100);
  };

  const calculateUsdtAmount = () => {
    const potions = parseFloat(potionsAmount || "0");
    // Sell rate: 1 SLP = 0.007 USDT (or 100 SLP = 0.7 USDT)
    return potions * 0.007;
  };

  const handlePurchase = async () => {
    if (!usdtAmount || parseFloat(usdtAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid USDT amount",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    purchaseMutation.mutate({
      usdtValue: parseFloat(usdtAmount),
      potionsAmount: calculatePotionsAmount(),
    });
  };

  const handleRedeem = async () => {
    if (!potionsAmount || parseFloat(potionsAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid SLP amount",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(potionsAmount) > earnedPotions) {
      toast({
        title: "Insufficient Balance",
        description: "You can only liquidate earned SLP",
        variant: "destructive",
      });
      return;
    }

    setIsRedeeming(true);
    redeemMutation.mutate({
      potionsAmount: parseFloat(potionsAmount),
      usdtValue: calculateUsdtAmount(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-cyan-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
        <div className="absolute top-40 left-20 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>
      
      <Navigation />
      
      {/* REDESIGNED LAYOUT: Add sidebar spacing + new asymmetric structure */}
      <div className="relative z-10 pt-24 md:pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/50 border border-cyan-400/30">
              <Brain className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent tracking-tight" data-testid="heading-elixirs-treasury">
                DREAM ELIXIRS TREASURY
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Network className="w-4 h-4 text-cyan-400" />
                <p className="text-cyan-300/80 text-sm font-medium" data-testid="text-treasury-description">Acquire & Liquidate Dream Elixirs via USDT</p>
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Dreamchain Status Bar */}
        <Card className="bg-gradient-to-r from-blue-900/40 via-blue-950/40 to-black/60 backdrop-blur-xl border border-cyan-500/30 shadow-lg shadow-cyan-500/10 mb-6" data-testid="card-dreamchain-status">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isOnCorrectNetwork ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' : 'bg-red-500 shadow-lg shadow-red-500/50'} animate-pulse`} data-testid="indicator-beacon-status" />
                <div>
                  <p className="text-xs text-cyan-300/60 font-medium">Dreamchain Beacon</p>
                  <p className="text-sm font-bold text-white flex items-center gap-2" data-testid="text-current-network">
                    {connectedWithSolana
                      ? <><Network className="w-3 h-3" /> CARV SVM Chain ✓</>
                      : "Not Connected"}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refreshNetworkStatus}
                className="text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 p-2 h-auto"
                title="Refresh beacon status"
                data-testid="button-refresh-dreamchain"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            {!isOnCorrectNetwork && !connectedWithSolana && (
              <div className="mt-3 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-xs text-orange-400" data-testid="text-network-warning">Solana wallet required for CARV SVM Chain</p>
                <p className="text-xs text-cyan-400 mt-1">
                  Please connect Phantom or Backpack wallet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* REDESIGNED: Side-by-Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Balance Stats + Transaction History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Balance Cards - Vertical Stack */}
            <Card className="bg-gradient-to-br from-blue-900/60 to-black border border-cyan-500/30 shadow-xl shadow-cyan-500/10" data-testid="card-treasury-balance">
              <CardHeader className="border-b border-cyan-500/20">
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  Total Treasury
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-black text-white mb-2" data-testid="text-total-treasury">{totalBalance.toLocaleString()}</div>
                  <div className="text-cyan-400 text-sm font-mono uppercase tracking-wider">SLP</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-300 text-sm font-medium">Acquired</span>
                    </div>
                    <span className="text-white font-bold" data-testid="text-treasury-acquired">{purchasedPotions.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-300 text-sm font-medium">Earned</span>
                    </div>
                    <span className="text-white font-bold" data-testid="text-treasury-earned">{earnedPotions.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* USDT Balance Card */}
            {isConnected && (
              <Card className="bg-gradient-to-br from-blue-900/60 to-black border border-blue-500/30 shadow-xl" data-testid="card-usdt-reserves">
                <CardHeader className="border-b border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-blue-400" />
                      USDT Wallet Balance
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => refetchUsdtBalance()}
                      disabled={isRefetching}
                      className="text-blue-400/60 hover:text-blue-300 hover:bg-blue-500/10 p-1 h-auto"
                      data-testid="button-refresh-reserves"
                    >
                      <RotateCcw className={`w-3 h-3 ${isRefetching ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-black text-white mb-1" data-testid="text-usdt-reserves">{currentUsdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-blue-400 text-sm font-mono uppercase">USDT</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction History - Compact */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-black border border-cyan-500/30 shadow-xl" data-testid="card-ledger">
              <CardHeader className="border-b border-cyan-500/20">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Recent Ledger
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-6">
                    <Binary className="w-8 h-8 text-cyan-400/40 mx-auto mb-2" />
                    <p className="text-cyan-300/60 text-xs" data-testid="text-no-transactions">No transactions</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {transactions.slice(0, 5).map((tx: any) => (
                      <div
                        key={tx.id}
                        className="p-3 bg-black/30 rounded-lg border border-cyan-500/10 hover:border-cyan-500/30 transition-colors"
                        data-testid={`ledger-tx-${tx.id}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                            (tx.type === 'purchase' || tx.type === 'buy') ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-white text-xs font-bold uppercase">
                            {tx.type === 'purchase' || tx.type === 'buy' ? 'Acquire' : 'Liquidate'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-cyan-400" data-testid={`text-ledger-amount-${tx.id}`}>
                            {(tx.type === 'purchase' || tx.type === 'buy') 
                              ? `+${tx.potionsAmount?.toLocaleString() || 0} SLP`
                              : `-${tx.potionsAmount?.toLocaleString() || 0} SLP`
                            }
                          </span>
                          <span className="text-gray-400">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Trading Interface - 2 columns */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ACQUIRE Section - Green Theme */}
            <Card className="bg-gradient-to-br from-green-900/40 to-black border border-green-500/40 shadow-2xl shadow-green-500/20 h-full" data-testid="card-acquire-panel">
              <CardHeader className="border-b border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl flex items-center gap-2">
                      ACQUIRE
                    </CardTitle>
                    <CardDescription className="text-green-300/60 text-sm">
                      Purchase with USDT
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                {!isConnected ? (
                  <div className="py-12 text-center">
                    <Wallet className="w-16 h-16 text-green-400/40 mx-auto mb-4" />
                    <p className="text-green-300/60 mb-6">Connect wallet to acquire SLP</p>
                    <Button 
                      onClick={connectWallet}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30"
                      data-testid="button-connect-acquire"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Sync Wallet
                    </Button>
                  </div>
                ) : (
                  <>
                    {!isOnCorrectNetwork && !connectedWithSolana && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <h4 className="text-orange-300 font-medium text-sm" data-testid="text-wrong-network-acquire">Solana Wallet Required</h4>
                        </div>
                        <p className="text-orange-200 text-xs">
                          CARV SVM Chain requires Phantom or Backpack wallet.
                        </p>
                      </div>
                    )}

                    {/* Pool Initialization Section */}
                    {connectedWithSolana && !isPoolInitialized && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Database className="w-5 h-5 text-blue-400" />
                          <h4 className="text-blue-300 font-medium">Pool Initialization Required</h4>
                        </div>
                        <p className="text-blue-200 text-sm mb-4">
                          The liquidity pool needs to be initialized before trading can begin. This is a one-time setup.
                        </p>
                        <Button
                          onClick={() => initializePoolMutation.mutate()}
                          disabled={isInitializingPool}
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30"
                          data-testid="button-initialize-pool"
                        >
                          {isInitializingPool ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Initializing Pool...
                            </>
                          ) : (
                            <>
                              <Database className="w-4 h-4 mr-2" />
                              Initialize Pool
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="usdt-acquire" className="text-green-300 font-medium flex items-center gap-2">
                        <Binary className="w-4 h-4" />
                        USDT Amount
                      </Label>
                      <Input
                        id="usdt-acquire"
                        type="number"
                        step="0.01"
                        placeholder="1.0"
                        value={usdtAmount}
                        onChange={(e) => setUsdtAmount(e.target.value)}
                        className="bg-black/30 border-green-500/30 text-white placeholder:text-green-400/30 focus:border-green-400"
                        data-testid="input-acquire-usdt"
                      />
                      <div className="flex justify-between text-sm text-green-300/60">
                        <span data-testid="text-available-usdt">Available: {currentUsdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <button 
                          onClick={() => setUsdtAmount(currentUsdtBalance.toString())}
                          className="text-green-400 hover:text-green-300 font-medium"
                          data-testid="button-max-usdt"
                        >
                          Use Max
                        </button>
                      </div>
                    </div>

                    {usdtAmount && (
                      <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                        <p className="text-sm text-green-300/60 mb-1">You will receive</p>
                        <p className="text-2xl font-bold text-white flex items-center gap-2" data-testid="text-acquire-preview">
                          <Sparkles className="w-5 h-5 text-green-400" />
                          {calculatePotionsAmount().toLocaleString()} SLP
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handlePurchase}
                      disabled={!usdtAmount || isPurchasing || parseFloat(usdtAmount || "0") > currentUsdtBalance || !isPoolInitialized}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 shadow-lg shadow-green-500/30"
                      data-testid="button-execute-acquire"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : parseFloat(usdtAmount || "0") > currentUsdtBalance ? (
                        <>Insufficient USDT</>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Acquire SLP
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* LIQUIDATE Section - Red Theme */}
            <Card className="bg-gradient-to-br from-red-900/40 to-black border border-red-500/40 shadow-2xl shadow-red-500/20 h-full" data-testid="card-liquidate-panel">
              <CardHeader className="border-b border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/50">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl flex items-center gap-2">
                      LIQUIDATE
                    </CardTitle>
                    <CardDescription className="text-red-300/60 text-sm">
                      Convert to USDT
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                {!isConnected ? (
                  <div className="py-12 text-center">
                    <Wallet className="w-16 h-16 text-red-400/40 mx-auto mb-4" />
                    <p className="text-red-300/60 mb-6">Connect wallet to liquidate SLP</p>
                    <Button 
                      onClick={connectWallet}
                      className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg shadow-red-500/30"
                      data-testid="button-connect-liquidate"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Sync Wallet
                    </Button>
                  </div>
                ) : (
                  <>
                    {!isOnCorrectNetwork && !connectedWithSolana && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <h4 className="text-orange-300 font-medium text-sm" data-testid="text-wrong-network-liquidate">Solana Wallet Required</h4>
                        </div>
                        <p className="text-orange-200 text-xs">
                          CARV SVM Chain requires Phantom or Backpack wallet.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="slp-liquidate" className="text-red-300 font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        SLP Amount
                      </Label>
                      <Input
                        id="slp-liquidate"
                        type="number"
                        step="1"
                        placeholder="1000"
                        value={potionsAmount}
                        onChange={(e) => setPotionsAmount(e.target.value)}
                        className="bg-black/30 border-red-500/30 text-white placeholder:text-red-400/30 focus:border-red-400"
                        data-testid="input-liquidate-slp"
                      />
                      <div className="text-sm text-red-300/60">
                        <span data-testid="text-max-liquidate">Max: {earnedPotions.toLocaleString()} earned</span>
                      </div>
                    </div>

                    {potionsAmount && (
                      <div className="p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl border border-red-500/30">
                        <p className="text-sm text-red-300/60 mb-1">You will receive</p>
                        <p className="text-2xl font-bold text-white flex items-center gap-2" data-testid="text-liquidate-preview">
                          <Binary className="w-5 h-5 text-red-400" />
                          {calculateUsdtAmount().toFixed(4)} USDT
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleRedeem}
                      disabled={!potionsAmount || isRedeeming || parseFloat(potionsAmount) > earnedPotions}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg shadow-red-500/30 disabled:opacity-50"
                      data-testid="button-execute-liquidate"
                    >
                      {isRedeeming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 mr-2" />
                          Liquidate SLP
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
