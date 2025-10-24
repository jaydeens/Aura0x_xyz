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
  Database
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
          const gasEstimate = await usdcContract.approve.estimateGas(contractAddress, usdcAmountWei);
          const gasLimit = gasEstimate + (gasEstimate * BigInt(20) / BigInt(100));
          
          approvalTx = await usdcContract.approve(contractAddress, usdcAmountWei, {
            gasLimit: gasLimit,
          });
        } catch (gasError) {
          console.error("Trust Wallet approval gas estimation failed:", gasError);
          approvalTx = await usdcContract.approve(contractAddress, usdcAmountWei, {
            gasLimit: 200000,
          });
        }
      } else {
        approvalTx = await usdcContract.approve(contractAddress, usdcAmountWei);
      }
      
      await approvalTx.wait();
      
      toast({
        title: "Processing Acquisition",
        description: "Please confirm the Potion acquisition transaction...",
      });
      
      const potionsABI = [
        {
          "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
          "name": "buySteeze",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];
      
      const potionsContract = new ethers.Contract(contractAddress, potionsABI, signer);
      
      console.log("Executing Potion acquisition transaction...");
      console.log("- USDC Amount:", usdcAmountWei.toString());
      console.log("- Expected Potion Amount:", potionsAmount);
      console.log("- Contract Address:", contractAddress);
      
      let purchaseTx;
      if (isTrustWallet) {
        console.log("Using Trust Wallet optimized purchase");
        try {
          const gasEstimate = await potionsContract.buySteeze.estimateGas(usdcAmountWei);
          const gasLimit = gasEstimate + (gasEstimate * BigInt(30) / BigInt(100));
          
          purchaseTx = await potionsContract.buySteeze(usdcAmountWei, {
            gasLimit: gasLimit,
          });
        } catch (gasError) {
          console.error("Trust Wallet purchase gas estimation failed:", gasError);
          purchaseTx = await potionsContract.buySteeze(usdcAmountWei, {
            gasLimit: 250000,
          });
        }
      } else {
        purchaseTx = await potionsContract.buySteeze(usdcAmountWei);
      }
      
      await purchaseTx.wait();
      console.log("✓ Potion acquisition transaction confirmed:", purchaseTx.hash);
      
      return purchaseTx.hash;
    },
    onSuccess: (txHash) => {
      toast({
        title: "Acquisition Initiated",
        description: "Transaction sent. Confirming...",
      });

      setTimeout(() => {
        confirmPurchaseMutation.mutate(txHash);
      }, 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Acquisition Failed",
        description: error.message || "Failed to acquire Potions",
        variant: "destructive",
      });
      setIsPurchasing(false);
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async ({ potionsAmount }: { potionsAmount: number }) => {
      if (!window.ethereum || !isConnected) {
        throw new Error("Please connect your wallet first");
      }

      let actualChainId = currentChainId;
      try {
        const freshChainId = await window.ethereum.request({ method: 'eth_chainId' });
        actualChainId = parseInt(freshChainId, 16);
        console.log(`Redeem - Fresh network check: ${actualChainId} (Base Mainnet is ${BASE_MAINNET.chainId})`);
        
        if (actualChainId !== currentChainId) {
          setCurrentChainId(actualChainId);
        }
      } catch (networkError) {
        console.warn("Could not verify network for redeem, using cached value:", currentChainId);
      }

      if (actualChainId !== BASE_MAINNET.chainId) {
        console.log(`Redeem - Auto-switching from Chain ID ${actualChainId} to Base Mainnet (${BASE_MAINNET.chainId})`);
        
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
          console.error("Redeem - Auto network switch failed:", switchError);
          throw new Error("Please switch to Base Mainnet in your wallet and try again");
        }
      } else {
        console.log("✓ Redeem - Already on Base Mainnet - no network switch needed");
      }

      const ABI = ["function withdrawSteeze(uint256 amount)"];
      const iface = new ethers.Interface(ABI);
      const data = iface.encodeFunctionData("withdrawSteeze", [potionsAmount]);

      const transactionParameters = {
        to: "0xf209E955Ad3711EE983627fb52A32615455d8cC3",
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
        title: "Liquidation Initiated",
        description: "Transaction sent. Processing...",
      });

      setTimeout(() => {
        confirmRedeemMutation.mutate(txHash);
      }, 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Liquidation Failed",
        description: error.message || "Failed to liquidate Potions",
        variant: "destructive",
      });
      setIsRedeeming(false);
    },
  });

  const confirmPurchaseMutation = useMutation({
    mutationFn: async (txHash: string) => {
      console.log('Confirming purchase with transaction hash:', txHash);
      if (!txHash) {
        throw new Error('Transaction hash is missing');
      }
      return apiRequest('POST', '/api/potions/confirm-purchase', { transactionHash: txHash });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/potions/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/potions/transactions"] });
      toast({
        title: "Acquisition Confirmed",
        description: "Potion tokens added to your vault",
      });
      
      triggerSteezeCelebration();
      
      setIsPurchasing(false);
      setUsdcAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Confirmation Failed",
        description: error.message || "Failed to confirm acquisition",
        variant: "destructive",
      });
      setIsPurchasing(false);
    },
  });

  const confirmRedeemMutation = useMutation({
    mutationFn: async (txHash: string) => {
      const response = await fetch('/api/potions/redeem-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: txHash })
      });
      if (!response.ok) throw new Error('Failed to confirm liquidation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/potions/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/potions/transactions"] });
      toast({
        title: "Liquidation Confirmed",
        description: "USDC sent to your wallet",
      });
      setIsRedeeming(false);
      setPotionsAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Liquidation Failed",
        description: error.message || "Failed to confirm liquidation",
        variant: "destructive",
      });
      setIsRedeeming(false);
    },
  });

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

    if (usdcValue > currentUsdcBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${usdcValue} USDC but only have ${currentUsdcBalance.toFixed(2)} USDC in your wallet`,
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (currentChainId !== BASE_MAINNET.chainId) {
      const switchSuccessful = await switchToBaseMainnet();
      if (!switchSuccessful) {
        toast({
          title: "Network Switch Required",
          description: "Please switch to Base Mainnet to acquire Potions",
          variant: "destructive",
        });
        return;
      }
    }

    setIsPurchasing(true);
    const potionsToReceive = calculatePotionsAmount();
    purchaseMutation.mutate({ usdcValue, potionsAmount: potionsToReceive });
  };

  const handleRedeem = async () => {
    if (!potionsAmount) return;

    const potionsValue = parseFloat(potionsAmount);
    if (potionsValue <= 0 || potionsValue > earnedPotions) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid Potion amount. Only earned Potions can be liquidated.",
        variant: "destructive",
      });
      return;
    }

    if (currentChainId !== BASE_MAINNET.chainId) {
      await switchToBaseMainnet();
      return;
    }

    setIsRedeeming(true);
    redeemMutation.mutate({ potionsAmount: Math.floor(potionsValue) });
  };

  const calculatePotionsAmount = () => {
    if (!usdcAmount) return 0;
    return parseFloat(usdcAmount) * 10;
  };

  const calculateUsdcAmount = () => {
    if (!potionsAmount) return 0;
    return parseFloat(potionsAmount) * 0.07;
  };
  
  useEffect(() => {
    console.log("Wallet State:", {
      isConnected,
      walletAddress,
      userWalletAddress,
      effectiveWalletAddress: effectiveWalletAddress,
      currentChainId,
      expectedChainId: BASE_MAINNET.chainId,
      isOnCorrectNetwork,
    });
  }, [isConnected, walletAddress, userWalletAddress, effectiveWalletAddress, currentChainId]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          
          window.ethereum.request({ method: 'eth_chainId' }).then((chainId: string) => {
            setCurrentChainId(parseInt(chainId, 16));
          });
        }
      });

      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setWalletAddress("");
          setIsConnected(false);
        }
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        setCurrentChainId(parseInt(chainId, 16));
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-cyan-950">
      <Navigation />
      <div className="pt-16 xs:pt-20 pb-6 xs:pb-8 px-4 xs:px-6">
        <div className="max-w-6xl mx-auto space-y-4 xs:space-y-6">
          {/* Header - Redesigned with tech theme */}
          <div className="text-center space-y-3 xs:space-y-4 mb-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 xs:w-24 xs:h-24 bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800 rounded-2xl xs:rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/50 border border-cyan-400/30">
                  <Brain className="w-10 h-10 xs:w-12 xs:h-12 text-white animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent tracking-tight" data-testid="page-title">
                  NEURAL POTIONS VAULT
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" />
                  <p className="text-cyan-300/80 text-sm xs:text-base sm:text-lg font-medium">Acquire & Liquidate Neural Potions via USDC</p>
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-blue-300/60 text-xs">Powered by Base Blockchain Technology</p>
              </div>
            </div>
          </div>

          {/* Stats Cards - Redesigned */}
          <div className="mb-4 xs:mb-6 space-y-4">
            {/* Network Status Card */}
            <Card className="bg-gradient-to-br from-blue-900/40 via-blue-950/40 to-black/60 backdrop-blur-xl border border-cyan-500/30 shadow-lg shadow-cyan-500/10" data-testid="card-network-status">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isOnCorrectNetwork ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' : 'bg-red-500 shadow-lg shadow-red-500/50'} animate-pulse`} />
                    <div>
                      <p className="text-xs text-cyan-300/60 font-medium">Blockchain Network</p>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        {currentChainId === BASE_MAINNET.chainId 
                          ? <><Network className="w-3 h-3" /> Base Mainnet ✓</> 
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
                    className="text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 p-1 h-auto"
                    title="Refresh network status"
                    data-testid="button-refresh-network"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
                {!isOnCorrectNetwork && currentChainId !== null && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-red-400">Switch to Base Mainnet required</p>
                    {currentChainId === 33875 && (
                      <p className="text-xs text-cyan-400">
                        Trust Wallet: tap network selector → choose "Base"
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Balance Cards Grid - Redesigned */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-900/40 via-cyan-900/30 to-black/60 backdrop-blur-xl border border-cyan-500/30 shadow-lg shadow-cyan-500/10" data-testid="card-total-balance">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                      <Database className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-cyan-300/60 font-medium">Total Vault</p>
                      <p className="text-lg sm:text-2xl font-bold text-white" data-testid="text-total-potions">{totalBalance.toLocaleString()} POTIONS</p>
                      <p className="text-xs text-cyan-400/40 truncate">Acquired: {purchasedPotions} | Earned: {earnedPotions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/40 via-green-900/20 to-black/60 backdrop-blur-xl border border-cyan-500/30 shadow-lg shadow-green-500/10" data-testid="card-purchased">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50">
                      <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-cyan-300/60 font-medium">Acquired</p>
                      <p className="text-lg sm:text-2xl font-bold text-white" data-testid="text-purchased-potions">{purchasedPotions.toLocaleString()} POTIONS</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/40 via-orange-900/20 to-black/60 backdrop-blur-xl border border-cyan-500/30 shadow-lg shadow-orange-500/10 sm:col-span-2 lg:col-span-1" data-testid="card-earned">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-cyan-300/60 font-medium">Battle Earned</p>
                      <p className="text-lg sm:text-2xl font-bold text-white" data-testid="text-earned-potions">{earnedPotions.toLocaleString()} POTIONS</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Acquire/Liquidate Interface - Redesigned */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6">
            {/* Acquire Section */}
            <Card className="bg-gradient-to-br from-blue-900/40 via-cyan-900/30 to-black/60 backdrop-blur-xl border border-cyan-500/30 shadow-xl shadow-cyan-500/10" data-testid="card-acquire">
              <CardHeader className="p-4 xs:p-6 border-b border-cyan-500/20">
                <div className="flex items-center gap-2 xs:gap-3">
                  <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl xs:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50">
                    <Layers className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg xs:text-xl flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      Acquire Potions
                    </CardTitle>
                    <CardDescription className="text-cyan-300/60 text-sm xs:text-base">
                      Purchase neural tokens via USDC (requires blockchain approval)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 xs:space-y-6 p-4 xs:p-6">
                {!isConnected ? (
                  <Button 
                    onClick={connectWallet}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg shadow-cyan-500/30"
                    data-testid="button-connect-wallet-acquire"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Sync Wallet
                  </Button>
                ) : (
                  <div>
                    {!isOnCorrectNetwork && currentChainId !== null && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <h4 className="text-orange-300 font-medium text-sm">Wrong Network Detected</h4>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={refreshNetworkStatus}
                            className="text-orange-300 hover:text-orange-200 p-1 h-auto"
                            title="Refresh network status"
                            data-testid="button-refresh-network-acquire"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-orange-200 text-xs mb-2">
                          Currently on {getNetworkName(currentChainId)}. The acquisition will automatically switch to Base Mainnet.
                        </p>
                        {(currentChainId === 33875 || !getNetworkName(currentChainId).includes("Base")) && (
                          <p className="text-cyan-200 text-xs">
                            <strong>Trust Wallet:</strong> Tap network name → Select "Base"
                          </p>
                        )}
                      </div>
                    )}

                    {/* USDC Balance Display */}
                    <div className="p-4 bg-black/30 rounded-xl border border-cyan-500/20 shadow-inner">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-cyan-300/60 font-medium">Your USDC Reserve</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-white" data-testid="text-usdc-balance">
                            {currentUsdcBalance.toFixed(2)} USDC
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => refetchUsdcBalance()}
                            disabled={isRefetching}
                            className="text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 p-1 h-auto"
                            title={isRefetching ? "Refreshing..." : "Refresh balance"}
                            data-testid="button-refresh-usdc"
                          >
                            <RotateCcw className={`w-3 h-3 ${isRefetching ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* USDC Input */}
                    <div className="space-y-2">
                      <Label htmlFor="usdc-amount" className="text-cyan-300 font-medium flex items-center gap-2">
                        <Binary className="w-4 h-4" />
                        USDC Amount
                      </Label>
                      <Input
                        id="usdc-amount"
                        type="number"
                        step="0.01"
                        placeholder="1.0"
                        value={usdcAmount}
                        onChange={(e) => setUsdcAmount(e.target.value)}
                        className="bg-black/30 border-cyan-500/30 text-white placeholder:text-cyan-400/30 focus:border-cyan-400 focus:ring-cyan-400/50"
                        data-testid="input-usdc-amount"
                      />
                      <div className="flex justify-between text-sm text-cyan-300/60">
                        <span>Available: {currentUsdcBalance.toFixed(2)} USDC</span>
                        <button 
                          onClick={() => setUsdcAmount(currentUsdcBalance.toString())}
                          className="text-cyan-400 hover:text-cyan-300 font-medium"
                          data-testid="button-use-max"
                        >
                          Use Max
                        </button>
                      </div>
                    </div>

                    {/* Potions Preview */}
                    {usdcAmount && (
                      <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/30 mt-4 shadow-lg">
                        <p className="text-sm text-cyan-300/60 mb-1 font-medium">You will receive</p>
                        <p className="text-2xl font-bold text-white flex items-center gap-2" data-testid="text-potions-preview">
                          <Sparkles className="w-5 h-5 text-cyan-400" />
                          {calculatePotionsAmount().toLocaleString()} POTIONS
                        </p>
                      </div>
                    )}

                    {/* Acquisition Instructions */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4 shadow-lg">
                      <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        Acquisition Protocol:
                      </h4>
                      <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
                        <li>Click "Acquire Potions" to initiate transaction</li>
                        <li>Approve USDC spending authorization in wallet</li>
                        <li>Confirm the neural token acquisition</li>
                        <li>Potions will be deposited to your vault</li>
                      </ol>
                    </div>

                    {/* Acquire Button */}
                    <Button
                      onClick={handlePurchase}
                      disabled={!usdcAmount || isPurchasing || parseFloat(usdcAmount || "0") > currentUsdcBalance}
                      className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 shadow-lg shadow-green-500/30"
                      data-testid="button-acquire-potions"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing Transaction...
                        </>
                      ) : parseFloat(usdcAmount || "0") > currentUsdcBalance ? (
                        <>
                          <Binary className="w-4 h-4 mr-2" />
                          Insufficient Reserves
                        </>
                      ) : (
                        <>
                          <Layers className="w-4 h-4 mr-2" />
                          Acquire Potions
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Liquidate Section */}
            <Card className="bg-gradient-to-br from-blue-900/40 via-red-900/20 to-black/60 backdrop-blur-xl border border-cyan-500/30 shadow-xl shadow-red-500/10" data-testid="card-liquidate">
              <CardHeader className="p-4 xs:p-6 border-b border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/50">
                    <ArrowDownLeft className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Network className="w-4 h-4 text-cyan-400" />
                      Liquidate Potions
                    </CardTitle>
                    <CardDescription className="text-cyan-300/60">
                      Convert neural tokens back to USDC
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-4 xs:p-6">
                {!isConnected ? (
                  <Button 
                    onClick={connectWallet}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg shadow-cyan-500/30"
                    data-testid="button-connect-wallet-liquidate"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Sync Wallet
                  </Button>
                ) : (
                  <div>
                    {!isOnCorrectNetwork && currentChainId !== null && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <h4 className="text-orange-300 font-medium text-sm">Wrong Network Detected</h4>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={refreshNetworkStatus}
                            className="text-orange-300 hover:text-orange-200 p-1 h-auto"
                            title="Refresh network status"
                            data-testid="button-refresh-network-liquidate"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-orange-200 text-xs mb-2">
                          Currently on {getNetworkName(currentChainId)}. The liquidation will automatically switch to Base Mainnet.
                        </p>
                        {(currentChainId === 33875 || !getNetworkName(currentChainId).includes("Base")) && (
                          <p className="text-cyan-200 text-xs">
                            <strong>Trust Wallet:</strong> Tap network name → Select "Base"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Potions Input */}
                    <div className="space-y-2">
                      <Label htmlFor="potions-amount" className="text-cyan-300 font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Potion Amount (Max: {earnedPotions.toLocaleString()} earned)
                      </Label>
                      <Input
                        id="potions-amount"
                        type="number"
                        step="1"
                        placeholder="1000"
                        value={potionsAmount}
                        onChange={(e) => setPotionsAmount(e.target.value)}
                        className="bg-black/30 border-cyan-500/30 text-white placeholder:text-cyan-400/30 focus:border-cyan-400 focus:ring-cyan-400/50"
                        data-testid="input-potions-amount"
                      />
                    </div>

                    {/* USDC Preview */}
                    {potionsAmount && (
                      <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl border border-red-500/30 mt-4 shadow-lg">
                        <p className="text-sm text-cyan-300/60 mb-1 font-medium">You will receive</p>
                        <p className="text-2xl font-bold text-white flex items-center gap-2" data-testid="text-usdc-preview">
                          <Binary className="w-5 h-5 text-cyan-400" />
                          {calculateUsdcAmount().toFixed(4)} USDC
                        </p>
                      </div>
                    )}

                    {/* Liquidate Button */}
                    <Button
                      onClick={handleRedeem}
                      disabled={!potionsAmount || isRedeeming || parseFloat(potionsAmount) > earnedPotions}
                      className="w-full mt-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg shadow-red-500/30"
                      data-testid="button-liquidate-potions"
                    >
                      {isRedeeming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing Transaction...
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="w-4 h-4 mr-2" />
                          Liquidate Potions
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction History - Redesigned */}
          <Card className="bg-gradient-to-br from-blue-900/40 via-cyan-900/20 to-black/60 backdrop-blur-xl border border-cyan-500/30 shadow-xl" data-testid="card-transaction-history">
            <CardHeader className="border-b border-cyan-500/20">
              <CardTitle className="text-white flex items-center gap-3">
                <Clock className="w-5 h-5 text-cyan-400" />
                Transaction Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 xs:p-6">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Binary className="w-12 h-12 text-cyan-400/40 mx-auto mb-4" />
                  <p className="text-cyan-300/60">No transactions recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((tx: any) => (
                    <div
                      key={tx.id}
                      className="p-4 bg-black/30 rounded-xl flex items-center justify-between border border-cyan-500/10 hover:border-cyan-500/30 transition-colors"
                      data-testid={`transaction-${tx.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          (tx.type === 'purchase' || tx.type === 'buy') 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {(tx.type === 'purchase' || tx.type === 'buy') ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {(tx.type === 'purchase' || tx.type === 'buy') ? 'Acquired' : 'Liquidated'} {tx.amount.toLocaleString()} POTIONS
                          </p>
                          <p className="text-cyan-300/60 text-sm">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                          {tx.transactionHash && (
                            <p className="text-cyan-400/40 text-xs mt-1 font-mono">
                              {tx.transactionHash.slice(0, 10)}...{tx.transactionHash.slice(-8)}
                            </p>
                          )}
                        </div>
                      </div>
                      {tx.transactionHash && (
                        <a
                          href={`${BASE_MAINNET.blockExplorer}tx/${tx.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300"
                          data-testid={`link-tx-${tx.id}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
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
