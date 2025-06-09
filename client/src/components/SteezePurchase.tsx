import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Zap, Loader2, ExternalLink } from "lucide-react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const BASE_SEPOLIA = {
  chainId: '0x14a34', // 84532 in hex
  chainName: 'Base Sepolia',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia-explorer.base.org/'],
};

interface SteezePurchaseProps {
  userWalletAddress?: string;
  currentBalance?: number;
  onPurchaseComplete?: () => void;
}

export default function SteezePurchase({ 
  userWalletAddress, 
  currentBalance = 0, 
  onPurchaseComplete 
}: SteezePurchaseProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [ethAmount, setEthAmount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [currentChainId, setCurrentChainId] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Get purchase info (contract address, rate, etc.)
  const { data: purchaseInfo, isLoading: infoLoading } = useQuery({
    queryKey: ["/api/steeze/purchase"],
    retry: false,
  });

  // Get current Steeze rate
  const { data: rateInfo } = useQuery({
    queryKey: ["/api/steeze/rate"],
    retry: false,
  });

  // Confirm purchase mutation
  const confirmPurchaseMutation = useMutation({
    mutationFn: async (transactionHash: string) => {
      return apiRequest("POST", "/api/steeze/confirm-purchase", { transactionHash });
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 Steeze Purchase Successful!",
        description: `You received ${data.steezeAmount} Steeze for ${data.ethAmount} ETH`,
        duration: 6000,
      });
      setEthAmount("");
      setIsPurchasing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onPurchaseComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to confirm purchase",
        variant: "destructive",
      });
      setIsPurchasing(false);
    },
  });

  // Check wallet connection on component mount
  useEffect(() => {
    checkWalletConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkWalletConnection = async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (accounts.length > 0) {
        setIsConnected(true);
        setWalletAddress(accounts[0]);
        setCurrentChainId(chainId);
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setIsConnected(true);
      setWalletAddress(accounts[0]);
    } else {
      setIsConnected(false);
      setWalletAddress("");
    }
  };

  const handleChainChanged = (chainId: string) => {
    setCurrentChainId(chainId);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        setIsConnected(true);
        setWalletAddress(accounts[0]);
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setCurrentChainId(chainId);
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const switchToBaseSepolia = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA.chainId }],
      });
    } catch (error: any) {
      // If the chain doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_SEPOLIA],
          });
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

  const handlePurchase = async () => {
    if (!window.ethereum || !isConnected || !ethAmount) return;

    // Check if on correct network
    if (currentChainId !== BASE_SEPOLIA.chainId) {
      await switchToBaseSepolia();
      return;
    }

    // Verify wallet matches user account
    if (userWalletAddress && walletAddress.toLowerCase() !== userWalletAddress.toLowerCase()) {
      toast({
        title: "Wallet Mismatch",
        description: "Please connect the wallet associated with your account",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);

    try {
      const ethValue = parseFloat(ethAmount);
      if (ethValue <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid ETH amount",
          variant: "destructive",
        });
        setIsPurchasing(false);
        return;
      }

      // Calculate Steeze amount based on ETH input and rate
      const steezeAmount = Math.floor(ethValue * (purchaseInfo?.steezePerEth || 10000));
      
      // Encode buySteeze(uint256 amount) function call
      const ABI = ["function buySteeze(uint256 amount)"];
      const iface = new ethers.Interface(ABI);
      const data = iface.encodeFunctionData("buySteeze", [steezeAmount]);
      
      // Calculate required ETH value based on buy price
      const weiAmount = (ethValue * 1e18).toString();

      // Send transaction to smart contract
      const transactionParameters = {
        to: purchaseInfo?.contractAddress,
        from: walletAddress,
        value: '0x' + BigInt(weiAmount).toString(16),
        data: data,
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      toast({
        title: "Transaction Sent",
        description: "Please wait for confirmation...",
      });

      // Wait a moment for transaction to be mined, then confirm
      setTimeout(() => {
        confirmPurchaseMutation.mutate(txHash);
      }, 5000);

    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to send transaction",
        variant: "destructive",
      });
      setIsPurchasing(false);
    }
  };

  const calculateSteezeAmount = () => {
    if (!ethAmount || !rateInfo?.steezePerEth) return 0;
    return parseFloat(ethAmount) * rateInfo.steezePerEth;
  };

  const isOnCorrectNetwork = currentChainId === BASE_SEPOLIA.chainId;

  return (
    <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Purchase Steeze</CardTitle>
            <CardDescription className="text-white/60">
              Buy Steeze tokens with ETH on Base Sepolia
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Balance */}
        <div className="p-4 bg-black/20 rounded-xl">
          <p className="text-sm text-white/60 mb-1">Current Steeze Balance</p>
          <p className="text-2xl font-bold text-white">{currentBalance.toLocaleString()} STEEZE</p>
        </div>

        {/* Rate Info */}
        {rateInfo && (
          <div className="p-4 bg-black/20 rounded-xl">
            <p className="text-sm text-white/60 mb-1">Exchange Rate</p>
            <p className="text-lg font-semibold text-white">
              1 ETH = {rateInfo.steezePerEth.toLocaleString()} STEEZE
            </p>
          </div>
        )}

        {/* Wallet Connection */}
        {!isConnected ? (
          <Button 
            onClick={connectWallet}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="ethAmount" className="text-white mb-2 block">
                ETH Amount
              </Label>
              <Input
                id="ethAmount"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.0"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                className="bg-black/20 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            {ethAmount && (
              <div className="p-3 bg-black/20 rounded-lg">
                <p className="text-sm text-white/60">You will receive:</p>
                <p className="text-lg font-semibold text-white">
                  {calculateSteezeAmount().toLocaleString()} STEEZE
                </p>
              </div>
            )}

            <Button 
              onClick={handlePurchase}
              disabled={!ethAmount || isPurchasing || confirmPurchaseMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isPurchasing || confirmPurchaseMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Purchase Steeze"
              )}
            </Button>
          </div>
        )}

        {/* Network Info */}
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>Network: Base Sepolia</span>
          <a 
            href="https://sepolia-explorer.base.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            Explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}