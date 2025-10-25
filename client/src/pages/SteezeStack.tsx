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
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
    trustwallet?: any;
  }
}

const BASE_MAINNET = {
  chainId: 8453,
  chainName: "Base Mainnet",
  rpcUrl: "https://mainnet.base.org",
  blockExplorer: "https://basescan.org/",
};

const getNetworkName = (chainId: number): string => {
  const networks: Record<number, string> = {
    1: "Ethereum Mainnet",
    8453: "Base Mainnet", 
    84532: "Base Sepolia",
    33875: "Unknown Network (33875)",
    137: "Polygon Mainnet",
    56: "BSC Mainnet",
    43114: "Avalanche Mainnet",
    250: "Fantom Mainnet",
    10: "Optimism Mainnet",
    42161: "Arbitrum One",
    1337: "Local Network"
  };
  return networks[chainId] || `Chain ID: ${chainId}`;
};

export default function SteezeStack() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerSteezeCelebration } = useCelebration();
  const [usdcAmount, setUsdcAmount] = useState("");
  const [potionsAmount, setPotionsAmount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [currentChainId, setCurrentChainId] = useState<number | null>(BASE_MAINNET.chainId);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);

  const currentUser = user as any;
  const userWalletAddress = currentUser?.walletAddress;
  const isOnCorrectNetwork = currentChainId === BASE_MAINNET.chainId;

  const refreshNetworkStatus = async () => {
    const provider = window.trustwallet || window.ethereum;
    const isTrustWallet = window.trustwallet || (window.ethereum && window.ethereum.isTrust);
    
    if (!provider) {
      toast({
        title: "No Wallet Found",
        description: "Please ensure your wallet is connected",
        variant: "destructive"
      });
      return;
    }
    
    try {
      let chainId: string | null = null;
      
      if (isTrustWallet) {
        console.log("Refreshing Trust Wallet network status...");
        
        try {
          chainId = await provider.request({ method: 'eth_chainId' });
          console.log("Trust Wallet refresh - chainId:", chainId);
          
          if (provider.networkVersion) {
            const networkVersionChainId = `0x${parseInt(provider.networkVersion).toString(16)}`;
            console.log("Trust Wallet refresh - networkVersion:", networkVersionChainId);
            if (chainId !== networkVersionChainId) {
              console.log("Using networkVersion for Trust Wallet:", networkVersionChainId);
              chainId = networkVersionChainId;
            }
          }
        } catch (e) {
          console.log("Trust Wallet refresh failed, trying direct properties");
          if (provider.chainId) {
            chainId = provider.chainId;
          } else if (provider.networkVersion) {
            chainId = `0x${parseInt(provider.networkVersion).toString(16)}`;
          }
        }
      } else {
        try {
          chainId = await provider.request({ method: 'eth_chainId' });
        } catch (e) {
          const ethersProvider = new ethers.BrowserProvider(provider);
          const network = await ethersProvider.getNetwork();
          chainId = `0x${network.chainId.toString(16)}`;
        }
      }

      if (chainId && chainId !== "0x" && !isNaN(parseInt(chainId, 16))) {
        const actualChainId = parseInt(chainId, 16);
        console.log(`Refreshed network detection: ${actualChainId} (Base Mainnet: ${BASE_MAINNET.chainId})`);
        setCurrentChainId(actualChainId);
        
        toast({
          title: "Network Status Updated", 
          description: actualChainId === BASE_MAINNET.chainId 
            ? "✓ Connected to Base Mainnet" 
            : `Connected to ${getNetworkName(actualChainId)}`,
        });
      } else if (isTrustWallet) {
        console.log("Trust Wallet - forcing Base Mainnet assumption");
        setCurrentChainId(BASE_MAINNET.chainId);
        toast({
          title: "Network Status Updated",
          description: "✓ Set to Base Mainnet (Trust Wallet network detection bypassed)",
        });
      } else {
        throw new Error("Could not detect network");
      }
    } catch (error) {
      console.error("Failed to refresh network status:", error);
      toast({
        title: "Network Detection Failed",
        description: "Please check your wallet connection and try switching networks manually",
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
    if (effectiveAddress) {
      queryClient.removeQueries({ 
        queryKey: ['/api/wallet/usdc-balance']
      });
      
      setUsdcBalance(0);
      refetchUsdcBalance();
      
      console.log(`Wallet changed to: ${effectiveAddress}`);
      console.log("Wallet State:", {
        isConnected,
        walletAddress,
        userWalletAddress,
        effectiveWalletAddress: effectiveAddress,
        currentChainId,
        expectedChainId: BASE_MAINNET.chainId,
        isOnCorrectNetwork
      });
    }
  }, [userWalletAddress, walletAddress]);

  useEffect(() => {
    const checkNetwork = async () => {
      if (!isConnected) return;
      
      const provider = window.trustwallet || window.ethereum;
      const isTrustWallet = window.trustwallet || (window.ethereum && window.ethereum.isTrust);
      
      if (isTrustWallet) {
        console.log("Trust Wallet detected - skipping network detection, assuming Base Mainnet");
        console.log("Reason: Trust Wallet mobile returns invalid chainId (NaN/Unknown Network) but functions correctly on Base");
        setCurrentChainId(BASE_MAINNET.chainId);
        return;
      }
      
      try {
        let chainId: string | null = null;
        
        if (provider) {
          if (isTrustWallet) {
            console.log("Trust Wallet detected - attempting network detection with fallbacks");
            
            try {
              chainId = await provider.request({ method: 'eth_chainId' });
              console.log("Trust Wallet chainId response:", chainId);
              
              if (!chainId || chainId === "0x" || chainId === "NaN" || isNaN(parseInt(chainId, 16))) {
                console.log("Trust Wallet returned invalid chainId, using fallback assumption");
                setCurrentChainId(BASE_MAINNET.chainId);
                return;
              }
            } catch (trustError) {
              console.log("Trust Wallet network request failed, assuming Base Mainnet:", trustError);
              setCurrentChainId(BASE_MAINNET.chainId);
              return;
            }
          } else {
            try {
              chainId = await provider.request({ method: 'eth_chainId' });
              console.log("Standard network detection successful:", chainId);
            } catch (e) {
              console.log("Standard method failed, trying ethers...");
              
              try {
                const ethersProvider = new ethers.BrowserProvider(provider);
                const network = await ethersProvider.getNetwork();
                chainId = `0x${network.chainId.toString(16)}`;
                console.log("Ethers network detection successful:", chainId);
              } catch (e2) {
                console.log("Ethers method also failed");
                
                if (provider.chainId) {
                  chainId = provider.chainId;
                  console.log("Direct chainId property found:", chainId);
                }
              }
            }
          }
        }

        if (chainId && chainId !== "0x" && !isNaN(parseInt(chainId, 16))) {
          const actualChainId = parseInt(chainId, 16);
          console.log(`Detected network: ${actualChainId} (${getNetworkName(actualChainId)}) - Base Mainnet is ${BASE_MAINNET.chainId}`);
          setCurrentChainId(actualChainId);
          
          if (actualChainId === BASE_MAINNET.chainId) {
            console.log("✓ Successfully detected Base Mainnet");
          } else {
            console.log(`⚠ Wrong network detected: ${getNetworkName(actualChainId)} instead of Base Mainnet`);
          }
        } else {
          console.log("Could not detect network - leaving as null");
          setCurrentChainId(null);
        }
      } catch (error) {
        console.error("Error checking network:", error);
        if (userWalletAddress) {
          console.log("Using fallback: setting to Base Mainnet for authenticated user");
          setCurrentChainId(BASE_MAINNET.chainId);
        }
      }
    };

    checkNetwork();
  }, [isConnected, userWalletAddress]);

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
  const { data: usdcBalanceData, refetch: refetchUsdcBalance, isRefetching } = useQuery({
    queryKey: [`/api/wallet/usdc-balance/${effectiveWalletAddress}`],
    enabled: !!effectiveWalletAddress && (isConnected || !!userWalletAddress),
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const purchasedPotions = (balanceData as any)?.purchasedSteeze || 0;
  const earnedPotions = (balanceData as any)?.battleEarnedSteeze || 0;
  const totalBalance = purchasedPotions + earnedPotions;
  const currentUsdcBalance = (usdcBalanceData as any)?.balance || 0;

  const transactions = (transactionsData as any[]) || [];

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "Web3 Wallet Required",
        description: "Please install MetaMask or a compatible wallet",
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
        title: "Wallet Synced",
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

  const switchToBaseMainnet = async () => {
    const provider = window.trustwallet || window.ethereum;
    if (!provider) {
      toast({
        title: "Wallet Not Found",
        description: "Please install a Web3 wallet like MetaMask or Trust Wallet",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log(`Switching to Base Mainnet (Chain ID: ${BASE_MAINNET.chainId})`);
      
      if (!isConnected) {
        await connectWallet();
      }
      
      const isTrustWallet = window.trustwallet || (provider && provider.isTrust);
      if (isTrustWallet) {
        console.log("Trust Wallet detected - skipping network check, assuming Base Mainnet");
        setCurrentChainId(BASE_MAINNET.chainId);
        toast({
          title: "Trust Wallet Network Set",
          description: "Set to Base Mainnet (Trust Wallet network detection bypassed)",
        });
        return true;
      }
      
      try {
        const currentChainId = await provider.request({ method: 'eth_chainId' });
        const parsedChainId = parseInt(currentChainId, 16);
        
        console.log(`Current network: ${parsedChainId} (${getNetworkName(parsedChainId)})`);
        
        if (parsedChainId === BASE_MAINNET.chainId) {
          setCurrentChainId(parsedChainId);
          toast({
            title: "Already on Base Mainnet",
            description: "You're already connected to the correct network",
          });
          return true;
        } else {
          toast({
            title: "Wrong Network Detected",
            description: `Currently on ${getNetworkName(parsedChainId)}. Switching to Base Mainnet...`,
          });
        }
      } catch (e) {
        console.log("Could not check current network, proceeding with switch...");
      }
      
      try {
        console.log("Attempting to switch to Base Mainnet...");
        
        toast({
          title: "Switching Network",
          description: "Please confirm the network switch in your wallet",
        });

        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${BASE_MAINNET.chainId.toString(16)}` }],
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        let attempts = 0;
        let switched = false;
        
        while (attempts < 5 && !switched) {
          try {
            const newChainId = await provider.request({ method: 'eth_chainId' });
            const parsedChainId = parseInt(newChainId, 16);
            
            console.log(`Verification attempt ${attempts + 1}: Chain ID ${parsedChainId}`);
            
            if (parsedChainId === BASE_MAINNET.chainId) {
              setCurrentChainId(parsedChainId);
              toast({
                title: "Network Switched",
                description: "Successfully switched to Base Mainnet",
              });
              switched = true;
              return true;
            }
            
            setCurrentChainId(parsedChainId);
            attempts++;
            
            if (attempts < 5) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (e) {
            console.log(`Verification attempt ${attempts + 1} failed:`, e);
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (!switched) {
          toast({
            title: "Please Switch to Base Network",
            description: "In Trust Wallet: tap the network selector and choose 'Base'. In other wallets: switch to Base Mainnet network.",
            variant: "destructive"
          });
          return false;
        }
        
        return false;
      } catch (switchError: any) {
        console.error("Switch error:", switchError);
        
        if (switchError.code === 4902) {
          console.log("Adding Base Mainnet network...");
          await provider.request({
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
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const newChainId = await provider.request({ method: 'eth_chainId' });
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
        } else {
          throw switchError;
        }
      }
    } catch (error: any) {
      console.error("Network switch error:", error);
      
      if (error.code === 4001) {
        toast({
          title: "Network Switch Cancelled",
          description: "Please switch to Base Mainnet to continue",
          variant: "destructive",
        });
      } else if (error.code === -32002) {
        toast({
          title: "Request Pending",
          description: "Please check your wallet app to complete the network switch",
          variant: "default",
        });
      } else {
        toast({
          title: "Network Switch Failed",
          description: error.message || "Failed to switch to Base Mainnet. Please try manually switching in your wallet.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const purchaseMutation = useMutation({
    mutationFn: async ({ usdcValue, potionsAmount }: { usdcValue: number; potionsAmount: number }) => {
      if (!window.ethereum) {
        throw new Error("Web3 wallet not detected. Please install MetaMask.");
      }
      
      if (!isConnected) {
        throw new Error("Please connect your wallet first");
      }
      
      const isTrustWallet = window.trustwallet || (window.ethereum && window.ethereum.isTrust);
      if (isTrustWallet) {
        console.log("Trust Wallet detected in purchase - skipping network verification, assuming Base Mainnet");
        setCurrentChainId(BASE_MAINNET.chainId);
      } else {
        let actualChainId = currentChainId;
        try {
          const freshChainId = await window.ethereum.request({ method: 'eth_chainId' });
          actualChainId = parseInt(freshChainId, 16);
          console.log(`Purchase - Fresh network check: ${actualChainId} (Base Mainnet is ${BASE_MAINNET.chainId})`);
          
          if (actualChainId !== currentChainId) {
            setCurrentChainId(actualChainId);
          }
        } catch (networkError) {
          console.warn("Could not verify network for purchase, using cached value:", currentChainId);
        }

        if (actualChainId !== BASE_MAINNET.chainId) {
          console.log(`Purchase - Auto-switching from Chain ID ${actualChainId} to Base Mainnet (${BASE_MAINNET.chainId})`);
          
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${BASE_MAINNET.chainId.toString(16)}` }],
            });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
            const parsedChainId = parseInt(newChainId, 16);
            
            if (parsedChainId !== BASE_MAINNET.chainId) {
              throw new Error("Network switch failed. Please manually switch to Base Mainnet in your wallet.");
            }
            
            setCurrentChainId(parsedChainId);
          } catch (switchError) {
            console.error("Purchase - Auto network switch failed:", switchError);
            throw new Error("Please switch to Base Mainnet in your wallet and try again");
          }
        } else {
          console.log("✓ Purchase - Already on Base Mainnet - no network switch needed");
        }
      }

      if (userWalletAddress && walletAddress.toLowerCase() !== userWalletAddress.toLowerCase()) {
        throw new Error("Please connect the wallet associated with your account");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      if (!isTrustWallet) {
        try {
          const network = await provider.getNetwork();
          console.log("Final network verification before USDC approval:", network.chainId);
          
          if (Number(network.chainId) !== BASE_MAINNET.chainId) {
            const networkName = getNetworkName(Number(network.chainId));
            throw new Error(`Network Error: You're on ${networkName} but Potion purchases require Base network. Please switch to Base Mainnet in your wallet to use USDC transactions.`);
          }
          
          console.log("✓ Network verification passed - proceeding with USDC approval on Base network");
        } catch (networkError) {
          console.error("Network verification failed:", networkError);
          throw networkError;
        }
      } else {
        console.log("✓ Trust Wallet detected - skipping network verification, assuming Base network");
      }
      
      const usdcContractAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      const usdcABI = [
        {
          "constant": false,
          "inputs": [
            {"name": "_spender", "type": "address"},
            {"name": "_value", "type": "uint256"}
          ],
          "name": "approve",
          "outputs": [{"name": "", "type": "bool"}],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];
      const usdcContract = new ethers.Contract(usdcContractAddress, usdcABI, signer);
      
      const contractAddress = "0xf209E955Ad3711EE983627fb52A32615455d8cC3";
      const usdcAmountWei = ethers.parseUnits(usdcValue.toString(), 6);
      
      console.log("Purchase Debug Info:");
      console.log("- USDC Value:", usdcValue);
      console.log("- USDC Amount Wei:", usdcAmountWei.toString());
      console.log("- Contract Address:", contractAddress);
      console.log("- USDC Contract:", usdcContractAddress);
      console.log("- User Balance:", currentUsdcBalance);
      
      toast({
        title: "Approving USDC",
        description: "Please approve USDC spending in your wallet...",
      });
      
      console.log("Trust Wallet detected:", !!isTrustWallet);
      
      let approvalTx;
      if (isTrustWallet) {
        console.log("Using Trust Wallet optimized approval");
        try {
          approvalTx = await usdcContract.approve(contractAddress, usdcAmountWei);
          console.log("Trust Wallet approval submitted:", approvalTx.hash);
        } catch (e) {
          console.error("Trust Wallet approval failed:", e);
          throw new Error("Failed to approve USDC spending. Please check your Trust Wallet app and try again.");
        }
      } else {
        approvalTx = await usdcContract.approve(contractAddress, usdcAmountWei);
      }
      
      console.log("USDC approval transaction hash:", approvalTx.hash);
      toast({
        title: "Waiting for approval...",
        description: "Confirming USDC spending approval on Base network...",
      });
      
      console.log("Waiting for approval confirmation (1 block)...");
      await approvalTx.wait(1);
      console.log("✓ USDC approval confirmed on Base network");

      const response = await apiRequest('POST', '/api/potions/purchase', {
        usdcAmount: usdcValue,
        potionsAmount,
        txHash: approvalTx.hash,
        walletAddress: walletAddress || userWalletAddress,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Potions Acquired!",
        description: "Neural tokens successfully added to your vault",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/potions/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/potions/transactions"] });
      setUsdcAmount("");
      refetchUsdcBalance();
      setIsPurchasing(false);
      triggerSteezeCelebration();
    },
    onError: (error: Error) => {
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to purchase potions",
        variant: "destructive",
      });
      setIsPurchasing(false);
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async ({ potionsAmount, usdcValue }: { potionsAmount: number; usdcValue: number }) => {
      if (!window.ethereum) {
        throw new Error("Web3 wallet not detected");
      }
      
      if (!isConnected) {
        throw new Error("Please connect your wallet first");
      }

      const isTrustWallet = window.trustwallet || (window.ethereum && window.ethereum.isTrust);
      if (isTrustWallet) {
        console.log("Trust Wallet detected in redeem - skipping network verification, assuming Base Mainnet");
        setCurrentChainId(BASE_MAINNET.chainId);
      } else {
        let actualChainId = currentChainId;
        try {
          const freshChainId = await window.ethereum.request({ method: 'eth_chainId' });
          actualChainId = parseInt(freshChainId, 16);
          console.log(`Redeem - Fresh network check: ${actualChainId}`);
          
          if (actualChainId !== currentChainId) {
            setCurrentChainId(actualChainId);
          }
        } catch (networkError) {
          console.warn("Could not verify network for redeem, using cached value:", currentChainId);
        }

        if (actualChainId !== BASE_MAINNET.chainId) {
          console.log(`Redeem - Auto-switching from Chain ID ${actualChainId} to Base Mainnet`);
          
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${BASE_MAINNET.chainId.toString(16)}` }],
            });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
            const parsedChainId = parseInt(newChainId, 16);
            
            if (parsedChainId !== BASE_MAINNET.chainId) {
              throw new Error("Network switch failed. Please manually switch to Base Mainnet");
            }
            
            setCurrentChainId(parsedChainId);
          } catch (switchError) {
            console.error("Redeem - Auto network switch failed:", switchError);
            throw new Error("Please switch to Base Mainnet in your wallet and try again");
          }
        }
      }

      const response = await apiRequest('POST', '/api/potions/redeem', {
        potionsAmount,
        walletAddress: walletAddress || userWalletAddress,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Potions Liquidated!",
        description: "USDC transfer initiated to your wallet",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/potions/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/potions/transactions"] });
      setPotionsAmount("");
      setIsRedeeming(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Liquidation Failed",
        description: error.message || "Failed to redeem potions",
        variant: "destructive",
      });
      setIsRedeeming(false);
    },
  });

  const calculatePotionsAmount = () => {
    const usdcValue = parseFloat(usdcAmount || "0");
    const rate = (purchaseInfo as any)?.potionsPerUsdc || 1;
    return Math.floor(usdcValue * rate);
  };

  const calculateUsdcAmount = () => {
    const potions = parseFloat(potionsAmount || "0");
    const rate = (purchaseInfo as any)?.potionsPerUsdc || 1;
    return potions / rate;
  };

  const handlePurchase = async () => {
    if (!usdcAmount || parseFloat(usdcAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid USDC amount",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    purchaseMutation.mutate({
      usdcValue: parseFloat(usdcAmount),
      potionsAmount: calculatePotionsAmount(),
    });
  };

  const handleRedeem = async () => {
    if (!potionsAmount || parseFloat(potionsAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid potions amount",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(potionsAmount) > earnedPotions) {
      toast({
        title: "Insufficient Balance",
        description: "You can only liquidate earned potions",
        variant: "destructive",
      });
      return;
    }

    setIsRedeeming(true);
    redeemMutation.mutate({
      potionsAmount: parseFloat(potionsAmount),
      usdcValue: calculateUsdcAmount(),
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
                <p className="text-cyan-300/80 text-sm font-medium" data-testid="text-treasury-description">Acquire & Liquidate Dream Elixirs via USDC</p>
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
                    {currentChainId === BASE_MAINNET.chainId 
                      ? <><Network className="w-3 h-3" /> CARV SVM Chain ✓</> 
                      : currentChainId 
                        ? getNetworkName(currentChainId)
                        : "Detecting..."}
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
            {!isOnCorrectNetwork && currentChainId !== null && (
              <div className="mt-3 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-xs text-orange-400" data-testid="text-network-warning">Switch to CARV SVM Chain required</p>
                {currentChainId === 33875 && (
                  <p className="text-xs text-cyan-400 mt-1">
                    Trust Wallet: tap network selector → choose "CARV SVM"
                  </p>
                )}
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
                  <div className="text-cyan-400 text-sm font-mono uppercase tracking-wider">ELIXIRS</div>
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

            {/* USDC Balance Card */}
            {isConnected && (
              <Card className="bg-gradient-to-br from-blue-900/60 to-black border border-blue-500/30 shadow-xl" data-testid="card-usdc-reserves">
                <CardHeader className="border-b border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-blue-400" />
                      USDC Reserves
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => refetchUsdcBalance()}
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
                    <div className="text-3xl font-black text-white mb-1" data-testid="text-usdc-reserves">{currentUsdcBalance.toFixed(2)}</div>
                    <div className="text-blue-400 text-sm font-mono uppercase">USDC</div>
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
                              ? `+${tx.potionsAmount?.toLocaleString() || 0} Potions`
                              : `-${tx.potionsAmount?.toLocaleString() || 0} Potions`
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
                      Purchase with USDC
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                {!isConnected ? (
                  <div className="py-12 text-center">
                    <Wallet className="w-16 h-16 text-green-400/40 mx-auto mb-4" />
                    <p className="text-green-300/60 mb-6">Connect wallet to acquire potions</p>
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
                    {!isOnCorrectNetwork && currentChainId !== null && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <h4 className="text-orange-300 font-medium text-sm" data-testid="text-wrong-network-acquire">Wrong Network</h4>
                        </div>
                        <p className="text-orange-200 text-xs">
                          Currently on {getNetworkName(currentChainId)}. Will auto-switch to CARV SVM Chain.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="usdc-acquire" className="text-green-300 font-medium flex items-center gap-2">
                        <Binary className="w-4 h-4" />
                        USDC Amount
                      </Label>
                      <Input
                        id="usdc-acquire"
                        type="number"
                        step="0.01"
                        placeholder="1.0"
                        value={usdcAmount}
                        onChange={(e) => setUsdcAmount(e.target.value)}
                        className="bg-black/30 border-green-500/30 text-white placeholder:text-green-400/30 focus:border-green-400"
                        data-testid="input-acquire-usdc"
                      />
                      <div className="flex justify-between text-sm text-green-300/60">
                        <span data-testid="text-available-usdc">Available: {currentUsdcBalance.toFixed(2)}</span>
                        <button 
                          onClick={() => setUsdcAmount(currentUsdcBalance.toString())}
                          className="text-green-400 hover:text-green-300 font-medium"
                          data-testid="button-max-usdc"
                        >
                          Use Max
                        </button>
                      </div>
                    </div>

                    {usdcAmount && (
                      <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                        <p className="text-sm text-green-300/60 mb-1">You will receive</p>
                        <p className="text-2xl font-bold text-white flex items-center gap-2" data-testid="text-acquire-preview">
                          <Sparkles className="w-5 h-5 text-green-400" />
                          {calculatePotionsAmount().toLocaleString()} POTIONS
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handlePurchase}
                      disabled={!usdcAmount || isPurchasing || parseFloat(usdcAmount || "0") > currentUsdcBalance}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 shadow-lg shadow-green-500/30"
                      data-testid="button-execute-acquire"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : parseFloat(usdcAmount || "0") > currentUsdcBalance ? (
                        <>Insufficient USDC</>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Acquire Potions
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
                      Convert to USDC
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                {!isConnected ? (
                  <div className="py-12 text-center">
                    <Wallet className="w-16 h-16 text-red-400/40 mx-auto mb-4" />
                    <p className="text-red-300/60 mb-6">Connect wallet to liquidate potions</p>
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
                    {!isOnCorrectNetwork && currentChainId !== null && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <h4 className="text-orange-300 font-medium text-sm" data-testid="text-wrong-network-liquidate">Wrong Network</h4>
                        </div>
                        <p className="text-orange-200 text-xs">
                          Currently on {getNetworkName(currentChainId)}. Will auto-switch to CARV SVM Chain.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="potions-liquidate" className="text-red-300 font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Potions Amount
                      </Label>
                      <Input
                        id="potions-liquidate"
                        type="number"
                        step="1"
                        placeholder="1000"
                        value={potionsAmount}
                        onChange={(e) => setPotionsAmount(e.target.value)}
                        className="bg-black/30 border-red-500/30 text-white placeholder:text-red-400/30 focus:border-red-400"
                        data-testid="input-liquidate-potions"
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
                          {calculateUsdcAmount().toFixed(4)} USDC
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
                          Liquidate Potions
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
