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
    trustwallet?: any;
  }
}

const BASE_MAINNET = {
  chainId: 8453,
  chainName: "Base Mainnet",
  rpcUrl: "https://mainnet.base.org",
  blockExplorer: "https://basescan.org/",
};

// Helper function to get network name
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
  const [steezeAmount, setSteezeAmount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [currentChainId, setCurrentChainId] = useState<number | null>(BASE_MAINNET.chainId);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);

  const currentUser = user as any;
  const userWalletAddress = currentUser?.walletAddress;
  const isOnCorrectNetwork = currentChainId === BASE_MAINNET.chainId;

  // Add manual network refresh function specifically for Trust Wallet
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
        
        // Trust Wallet specific refresh
        try {
          chainId = await provider.request({ method: 'eth_chainId' });
          console.log("Trust Wallet refresh - chainId:", chainId);
          
          // Also check networkVersion for Trust Wallet
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
        // Standard refresh for other wallets
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
        // Trust Wallet fix: always assume Base Mainnet due to broken network detection
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

  // Initialize wallet connection state from authenticated user
  useEffect(() => {
    if (userWalletAddress && !isConnected) {
      setWalletAddress(userWalletAddress);
      setIsConnected(true);
    }
  }, [userWalletAddress, isConnected]);

  // Clear cache and refresh data when wallet address changes
  useEffect(() => {
    const effectiveAddress = userWalletAddress || walletAddress;
    if (effectiveAddress) {
      // Clear previous wallet's cached data
      queryClient.removeQueries({ 
        queryKey: ['/api/wallet/usdc-balance']
      });
      
      // Reset local state for new wallet
      setUsdcBalance(0);
      
      // Trigger fresh data fetch
      refetchUsdcBalance();
      
      console.log(`Wallet changed to: ${effectiveAddress}`);
    }
  }, [userWalletAddress, walletAddress]);

  // Check network on wallet connection - Trust Wallet special handling
  useEffect(() => {
    const checkNetwork = async () => {
      if (!isConnected) return;
      
      const provider = window.trustwallet || window.ethereum;
      const isTrustWallet = window.trustwallet || (window.ethereum && window.ethereum.isTrust);
      
      // Special Trust Wallet handling - network detection is broken
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
              
              // Trust Wallet often returns invalid responses
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
            // Standard detection for other wallets
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
        // For authenticated users, assume Base Mainnet
        if (userWalletAddress) {
          console.log("Using fallback: setting to Base Mainnet for authenticated user");
          setCurrentChainId(BASE_MAINNET.chainId);
        }
      }
    };

    checkNetwork();
  }, [isConnected, userWalletAddress]);

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

  // Fetch USDC balance when wallet is connected - use userWalletAddress if available
  const effectiveWalletAddress = userWalletAddress || walletAddress;
  const { data: usdcBalanceData, refetch: refetchUsdcBalance, isRefetching } = useQuery({
    queryKey: [`/api/wallet/usdc-balance/${effectiveWalletAddress}`],
    enabled: !!effectiveWalletAddress && (isConnected || !!userWalletAddress),
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

  // Switch to Base Mainnet network - improved mobile wallet support
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
      
      // First ensure wallet is connected
      if (!isConnected) {
        await connectWallet();
      }
      
      // Special Trust Wallet handling for network check  
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
      
      // Check current network for other wallets
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
      
      // Try to switch to Base Mainnet with more aggressive approach
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
        
        // Wait longer for mobile wallets
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Multiple attempts to verify the switch
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
          // Network not added yet, try to add it
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
          
          // Wait for the add to complete
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Verify the add was successful
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
          throw switchError; // Re-throw to be handled by outer catch
        }
      }
    } catch (error: any) {
      console.error("Network switch error:", error);
      
      if (error.code === 4001) {
        // User rejected the request
        toast({
          title: "Network Switch Cancelled",
          description: "Please switch to Base Mainnet to continue",
          variant: "destructive",
        });
      } else if (error.code === -32002) {
        // Request already pending (common in mobile wallets)
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

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async ({ usdcValue, steezeAmount }: { usdcValue: number; steezeAmount: number }) => {
      if (!window.ethereum) {
        throw new Error("MetaMask not detected. Please install MetaMask.");
      }
      
      if (!isConnected) {
        throw new Error("Please connect your wallet first");
      }
      
      // Verify network first - get fresh network status
      let actualChainId = currentChainId;
      try {
        const freshChainId = await window.ethereum.request({ method: 'eth_chainId' });
        actualChainId = parseInt(freshChainId, 16);
        console.log(`Purchase - Fresh network check: ${actualChainId} (Base Mainnet is ${BASE_MAINNET.chainId})`);
        
        // Update state with fresh network info
        if (actualChainId !== currentChainId) {
          setCurrentChainId(actualChainId);
        }
      } catch (networkError) {
        console.warn("Could not verify network for purchase, using cached value:", currentChainId);
      }

      // Only switch if actually not on Base Mainnet
      if (actualChainId !== BASE_MAINNET.chainId) {
        console.log(`Purchase - Auto-switching from Chain ID ${actualChainId} to Base Mainnet (${BASE_MAINNET.chainId})`);
        
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${BASE_MAINNET.chainId.toString(16)}` }],
          });
          
          // Give time for the network switch
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Verify the switch worked
          const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
          const parsedChainId = parseInt(newChainId, 16);
          
          if (parsedChainId !== BASE_MAINNET.chainId) {
            throw new Error("Network switch failed. Please manually switch to Base Mainnet in your wallet.");
          }
          
          // Update the state
          setCurrentChainId(parsedChainId);
        } catch (switchError) {
          console.error("Purchase - Auto network switch failed:", switchError);
          throw new Error("Please switch to Base Mainnet in your wallet and try again");
        }
      } else {
        console.log("✓ Purchase - Already on Base Mainnet - no network switch needed");
      }

      // Verify wallet matches user account
      if (userWalletAddress && walletAddress.toLowerCase() !== userWalletAddress.toLowerCase()) {
        throw new Error("Please connect the wallet associated with your account");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // USDC contract for approval
      const usdcContractAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDC
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
      
      const contractAddress = "0xf209E955Ad3711EE983627fb52A32615455d8cC3"; // Steeze contract
      const usdcAmountWei = ethers.parseUnits(usdcValue.toString(), 6); // USDC has 6 decimals
      
      console.log("Purchase Debug Info:");
      console.log("- USDC Value:", usdcValue);
      console.log("- USDC Amount Wei:", usdcAmountWei.toString());
      console.log("- Contract Address:", contractAddress);
      console.log("- USDC Contract:", usdcContractAddress);
      console.log("- User Balance:", currentUsdcBalance);
      
      // Step 1: Approve USDC for the contract
      toast({
        title: "Approving USDC",
        description: "Please approve USDC spending in your wallet...",
      });
      
      // Detect Trust Wallet once for both operations
      const isTrustWallet = window.trustwallet || (window.ethereum && window.ethereum.isTrust);
      console.log("Trust Wallet detected:", !!isTrustWallet);
      
      let approvalTx;
      if (isTrustWallet) {
        console.log("Using Trust Wallet optimized approval");
        try {
          // Trust Wallet specific approval with gas handling
          const gasEstimate = await usdcContract.approve.estimateGas(contractAddress, usdcAmountWei);
          const gasLimit = gasEstimate + (gasEstimate * BigInt(20) / BigInt(100));
          
          approvalTx = await usdcContract.approve(contractAddress, usdcAmountWei, {
            gasLimit: gasLimit,
          });
        } catch (gasError) {
          console.error("Trust Wallet approval gas estimation failed:", gasError);
          // Fallback with much higher fixed gas limit for Trust Wallet
          approvalTx = await usdcContract.approve(contractAddress, usdcAmountWei, {
            gasLimit: 200000, // Much higher fixed gas limit for Trust Wallet approval
          });
        }
      } else {
        approvalTx = await usdcContract.approve(contractAddress, usdcAmountWei);
      }
      
      await approvalTx.wait();
      
      // Step 2: Call buySteeze function
      toast({
        title: "Processing Purchase",
        description: "Please confirm the Steeze purchase transaction...",
      });
      
      // Return the approval transaction hash since the purchase is backend-controlled
      // The backend will process the actual Steeze purchase after USDC approval
      console.log("USDC approval completed, returning approval transaction hash for backend processing");
      
      return approvalTx.hash;
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
      if (!window.ethereum || !isConnected) {
        throw new Error("Please connect your wallet first");
      }

      // Verify network first - get fresh network status
      let actualChainId = currentChainId;
      try {
        const freshChainId = await window.ethereum.request({ method: 'eth_chainId' });
        actualChainId = parseInt(freshChainId, 16);
        console.log(`Redeem - Fresh network check: ${actualChainId} (Base Mainnet is ${BASE_MAINNET.chainId})`);
        
        // Update state with fresh network info
        if (actualChainId !== currentChainId) {
          setCurrentChainId(actualChainId);
        }
      } catch (networkError) {
        console.warn("Could not verify network for redeem, using cached value:", currentChainId);
      }

      // Only switch if actually not on Base Mainnet
      if (actualChainId !== BASE_MAINNET.chainId) {
        console.log(`Redeem - Auto-switching from Chain ID ${actualChainId} to Base Mainnet (${BASE_MAINNET.chainId})`);
        
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${BASE_MAINNET.chainId.toString(16)}` }],
          });
          
          // Give time for the network switch
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Verify the switch worked
          const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
          const parsedChainId = parseInt(newChainId, 16);
          
          if (parsedChainId !== BASE_MAINNET.chainId) {
            throw new Error("Network switch failed. Please manually switch to Base Mainnet in your wallet.");
          }
          
          // Update the state
          setCurrentChainId(parsedChainId);
        } catch (switchError) {
          console.error("Redeem - Auto network switch failed:", switchError);
          throw new Error("Please switch to Base Mainnet in your wallet and try again");
        }
      } else {
        console.log("✓ Redeem - Already on Base Mainnet - no network switch needed");
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
      console.log('Confirming purchase with transaction hash:', txHash);
      if (!txHash) {
        throw new Error('Transaction hash is missing');
      }
      return apiRequest('POST', '/api/steeze/confirm-purchase', { transactionHash: txHash });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/steeze/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/steeze/transactions"] });
      toast({
        title: "Purchase Confirmed",
        description: "Steeze tokens added to your balance",
      });
      
      // Trigger celebration animation
      triggerSteezeCelebration();
      
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
      userWalletAddress,
      effectiveWalletAddress: effectiveWalletAddress,
      currentChainId,
      expectedChainId: BASE_MAINNET.chainId,
      isOnCorrectNetwork,
    });
  }, [isConnected, walletAddress, userWalletAddress, effectiveWalletAddress, currentChainId]);

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
      <div className="pt-16 xs:pt-20 pb-6 xs:pb-8 px-4 xs:px-6">
        <div className="max-w-6xl mx-auto space-y-4 xs:space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 xs:space-y-3">
            <div className="flex flex-col xs:flex-row items-center justify-center gap-3 xs:gap-4">
              <div className="w-14 h-14 xs:w-16 xs:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl xs:rounded-3xl flex items-center justify-center">
                <Coins className="w-7 h-7 xs:w-8 xs:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                  STEEZE RECHARGE
                </h1>
                <p className="text-white/60 text-sm xs:text-base sm:text-lg">Buy and redeem Steeze tokens with USDC</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-4 xs:mb-6 space-y-4">
            {/* Network Status Card - Mobile First */}
            <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isOnCorrectNetwork ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-xs text-white/60">Network Status</p>
                      <p className="text-sm font-bold text-white">
                        {currentChainId === BASE_MAINNET.chainId 
                          ? "Base Mainnet ✓" 
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
                    className="text-white/60 hover:text-white p-1 h-auto"
                    title="Refresh network status"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
                {!isOnCorrectNetwork && currentChainId !== null && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-red-400">Switch to Base Mainnet required</p>
                    {currentChainId === 33875 && (
                      <p className="text-xs text-blue-400">
                        Trust Wallet: tap network selector → choose "Base"
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Balance Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-white/60">Total Balance</p>
                      <p className="text-lg sm:text-2xl font-bold text-white">{totalBalance.toLocaleString()} STEEZE</p>
                      <p className="text-xs text-white/40 truncate">Purchased: {purchasedSteeze} | Earned: {earnedSteeze}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-white/60">Purchased</p>
                      <p className="text-lg sm:text-2xl font-bold text-white">{purchasedSteeze.toLocaleString()} STEEZE</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20 sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-white/60">Earned</p>
                      <p className="text-lg sm:text-2xl font-bold text-white">{earnedSteeze.toLocaleString()} STEEZE</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Buy/Redeem Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6">
            {/* Buy Section */}
            <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
              <CardHeader className="p-4 xs:p-6">
                <div className="flex items-center gap-2 xs:gap-3">
                  <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl xs:rounded-2xl flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg xs:text-xl">Buy Steeze</CardTitle>
                    <CardDescription className="text-white/60 text-sm xs:text-base">
                      Purchase Steeze tokens with USDC (requires approval)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 xs:space-y-6 p-4 xs:p-6">
                {/* Wallet Connection */}
                {!isConnected ? (
                  <Button 
                    onClick={connectWallet}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                ) : (
                  <div>
                    {/* Network Warning */}
                    {!isOnCorrectNetwork && currentChainId !== null && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
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
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-orange-200 text-xs mb-2">
                          Currently on {getNetworkName(currentChainId)}. The purchase will automatically switch to Base Mainnet.
                        </p>
                        {(currentChainId === 33875 || !getNetworkName(currentChainId).includes("Base")) && (
                          <p className="text-blue-200 text-xs">
                            <strong>Trust Wallet:</strong> Tap network name → Select "Base"
                          </p>
                        )}
                      </div>
                    )}

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

                    {/* Purchase Instructions */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                      <h4 className="text-blue-300 font-medium mb-2">Purchase Process:</h4>
                      <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
                        <li>Click "Buy Steeze" to start the purchase</li>
                        <li>First, approve USDC spending in your wallet</li>
                        <li>Then, confirm the Steeze purchase transaction</li>
                        <li>Your Steeze tokens will be added to your balance</li>
                      </ol>
                    </div>

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
                ) : (
                  <div>
                    {/* Network Warning */}
                    {!isOnCorrectNetwork && currentChainId !== null && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
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
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-orange-200 text-xs mb-2">
                          Currently on {getNetworkName(currentChainId)}. The redeem will automatically switch to Base Mainnet.
                        </p>
                        {(currentChainId === 33875 || !getNetworkName(currentChainId).includes("Base")) && (
                          <p className="text-blue-200 text-xs">
                            <strong>Trust Wallet:</strong> Tap network name → Select "Base"
                          </p>
                        )}
                      </div>
                    )}

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
                            {(tx.type === 'purchase' || tx.type === 'buy') ? 'Bought' : 'Redeemed'} {tx.amount.toLocaleString()} STEEZE
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