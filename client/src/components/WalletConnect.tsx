import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ExternalLink, CheckCircle, AlertCircle, Smartphone, QrCode } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    phantom?: {
      solana?: any;
    };
    backpack?: any;
  }
}

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  showBalance?: boolean;
  linkMode?: boolean; // New prop for account linking
  mobileOptimized?: boolean; // New prop for mobile-optimized experience
}

export default function WalletConnect({ onConnect, showBalance = true, linkMode = false, mobileOptimized = false }: WalletConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [walletType, setWalletType] = useState<'ethereum' | 'solana' | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authenticateWallet = useMutation({
    mutationFn: async (walletAddress: string) => {
      const endpoint = linkMode ? "/api/auth/link-wallet" : "/api/auth/wallet";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403 && errorData.code === "BETA_ACCESS_REQUIRED") {
          throw new Error("BETA_ACCESS_REQUIRED");
        }
        throw new Error(errorData.message || `${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const message = data.message || (linkMode 
        ? "Successfully linked your wallet to your account."
        : "Successfully authenticated with your wallet.");
      
      toast({
        title: data.bonusAwarded ? "🎉 Wallet Connected!" : (linkMode ? "Wallet Linked" : "Wallet Connected"),
        description: message,
        duration: data.bonusAwarded ? 6000 : 3000
      });
      onConnect?.(address);
      if (!linkMode) {
        // Only refresh for authentication, not linking
        window.location.reload();
      }
    },
    onError: (error) => {
      console.error("Wallet operation error:", error);
      
      if (error.message === "BETA_ACCESS_REQUIRED") {
        toast({
          title: "Beta Access Required",
          description: "This wallet address is not whitelisted for the closed beta. Check your access status or contact support.",
          variant: "destructive",
          duration: 6000,
        });
        return;
      }
      
      toast({
        title: linkMode ? "Linking Failed" : "Authentication Failed",
        description: error.message || (linkMode 
          ? "Failed to link wallet. Please try again."
          : "Failed to authenticate wallet. Please try again."),
        variant: "destructive",
      });
    },
  });

  const detectMobile = () => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  };

  const connectMobileWallet = async (walletType: string) => {
    setIsConnecting(true);
    try {
      if (walletType === 'metamask' && !window.ethereum) {
        window.open(`https://metamask.app.link/dapp/${window.location.host}`, '_blank');
        toast({
          title: "Opening MetaMask",
          description: "Please connect your wallet in the MetaMask app",
        });
        return;
      }
      
      if (walletType === 'trust' && !window.ethereum) {
        window.open(`https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(window.location.href)}`, '_blank');
        toast({
          title: "Opening Trust Wallet",
          description: "Please connect your wallet in the Trust Wallet app",
        });
        return;
      }
      
      if (walletType === 'coinbase' && !window.ethereum) {
        window.open(`https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`, '_blank');
        toast({
          title: "Opening Coinbase Wallet",
          description: "Please connect your wallet in the Coinbase Wallet app",
        });
        return;
      }

      // If wallet provider is available, proceed with connection
      await connectWallet();
    } catch (error: any) {
      console.error("Mobile wallet connection error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    checkConnection();
    detectMobile();
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          if (showBalance) {
            await fetchBalance(accounts[0]);
          }
          onConnect?.(accounts[0]);
          // Auto-authenticate if wallet is already connected (but not in link mode)
          if (!linkMode) {
            authenticateWallet.mutate(accounts[0]);
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const fetchBalance = async (walletAddress: string) => {
    try {
      const response = await fetch(`/api/web3/balance/${walletAddress}`);
      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };



  const connectSolanaWallet = async (provider: 'phantom' | 'backpack') => {
    setIsConnecting(true);
    try {
      let wallet: any;
      
      if (provider === 'phantom') {
        wallet = window.phantom?.solana || window.solana;
        if (!wallet || !wallet.isPhantom) {
          window.open('https://phantom.app/', '_blank');
          toast({
            title: "Phantom Not Found",
            description: "Opening Phantom download page. Please install Phantom wallet.",
            duration: 5000,
          });
          setIsConnecting(false);
          return;
        }
      } else if (provider === 'backpack') {
        wallet = window.backpack;
        if (!wallet) {
          window.open('https://www.backpack.app/', '_blank');
          toast({
            title: "Backpack Not Found",
            description: "Opening Backpack download page. Please install Backpack wallet.",
            duration: 5000,
          });
          setIsConnecting(false);
          return;
        }
      }

      // Connect to wallet
      const response = await wallet.connect();
      const publicKey = response.publicKey.toString();
      
      setAddress(publicKey);
      setIsConnected(true);
      setWalletType('solana');
      
      onConnect?.(publicKey);
      
      // Authenticate with backend
      authenticateWallet.mutate(publicKey);
      
      // Show CARV network info
      await switchToCARVNetwork();
      
      toast({
        title: `${provider === 'phantom' ? 'Phantom' : 'Backpack'} Connected`,
        description: `Connected to ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`,
      });
    } catch (error: any) {
      console.error(`Error connecting ${provider} wallet:`, error);
      toast({
        title: "Connection Failed",
        description: error.message || `Failed to connect ${provider} wallet. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWallet = async () => {
    // Mobile-specific wallet detection
    if (isMobile && !window.ethereum) {
      toast({
        title: "Mobile Wallet Required",
        description: "Please use a mobile wallet app or browser with wallet support.",
        variant: "destructive",
      });
      return;
    }

    if (!window.ethereum) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const walletAddress = accounts[0];
        setAddress(walletAddress);
        setIsConnected(true);
        setWalletType('ethereum');
        
        // Show CARV network info
        await switchToCARVNetwork();
        
        if (showBalance) {
          await fetchBalance(walletAddress);
        }
        
        onConnect?.(walletAddress);
        
        // Authenticate with backend
        authenticateWallet.mutate(walletAddress);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToCARVNetwork = async () => {
    // CARV SVM Chain testnet configuration
    const networkConfig = {
      rpcUrl: 'https://rpc.testnet.carv.io/rpc',
      chainName: 'CARV SVM Chain Testnet',
      explorerUrl: 'https://explorer.testnet.carv.io/',
      bridgeUrl: 'https://bridge.testnet.carv.io',
    };

    if (walletType === 'solana') {
      // For Solana wallets, just notify the user about CARV SVM
      toast({
        title: "CARV SVM Chain",
        description: `Connected to ${networkConfig.chainName}. Visit ${networkConfig.bridgeUrl} to bridge assets.`,
        duration: 6000,
      });
      return;
    }

    // For Ethereum wallets, no network switching needed for CARV SVM
    // CARV SVM is Solana-based, Ethereum wallets can still interact via bridge
    toast({
      title: "CARV SVM Chain Info",
      description: `Using CARV SVM Chain testnet. Bridge assets at ${networkConfig.bridgeUrl}`,
      duration: 5000,
    });
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress("");
    setBalance("0");
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Wallet Connected
          </CardTitle>
          <CardDescription>
            {formatAddress(address)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showBalance && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">USDT Balance:</span>
              <Badge variant="secondary">{balance} USDT</Badge>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://polygonscan.com/address/${address}`, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnectWallet}
              className="flex-1"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${mobileOptimized ? 'max-w-full mx-2' : 'max-w-md'}`}>
      <CardHeader className={mobileOptimized ? 'pb-3' : ''}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </CardTitle>
        <CardDescription className="text-sm">
          Connect your wallet to CARV SVM Chain for battles and vouching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Desktop wallet options */}
        {!isMobile && (
          <>
            <div className="space-y-3">
              <div className="text-sm font-semibold text-cyan-400">Solana Wallets (Recommended for CARV SVM)</div>
              
              <Button 
                onClick={() => connectSolanaWallet('phantom')} 
                disabled={isConnecting}
                className="w-full flex items-center gap-3 h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                data-testid="button-connect-phantom"
              >
                <Wallet className="h-5 w-5" />
                <div className="flex-1 text-left">
                  <div className="font-semibold">Phantom</div>
                  <div className="text-xs opacity-80">Solana wallet for CARV SVM</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => connectSolanaWallet('backpack')} 
                disabled={isConnecting}
                variant="outline"
                className="w-full flex items-center gap-3 h-12 border-cyan-500/30 hover:bg-cyan-500/10"
                data-testid="button-connect-backpack"
              >
                <Wallet className="h-5 w-5" />
                <div className="flex-1 text-left">
                  <div className="font-semibold">Backpack</div>
                  <div className="text-xs opacity-70">xNFT-enabled wallet</div>
                </div>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or use Ethereum wallet</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={connectWallet} 
                disabled={isConnecting}
                variant="outline"
                className="w-full h-12 border-orange-500/30 hover:bg-orange-500/10"
                data-testid="button-connect-metamask"
              >
                <Wallet className="h-5 w-5 mr-2" />
                {isConnecting ? "Connecting..." : "MetaMask / Ethereum Wallet"}
              </Button>
            </div>
          </>
        )}

        {/* Mobile wallet options */}
        {isMobile && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-cyan-400 mb-2">Solana Wallets (CARV SVM)</div>
            
            <Button 
              onClick={() => connectSolanaWallet('phantom')} 
              disabled={isConnecting}
              className="w-full flex items-center gap-3 h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
            >
              <Smartphone className="h-5 w-5" />
              <div>
                <div className="font-semibold">Phantom</div>
                <div className="text-xs opacity-80">Solana wallet</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => connectSolanaWallet('backpack')} 
              disabled={isConnecting}
              variant="outline"
              className="w-full flex items-center gap-3 h-12"
            >
              <Smartphone className="h-5 w-5" />
              <div>
                <div className="font-semibold">Backpack</div>
                <div className="text-xs opacity-70">xNFT wallet</div>
              </div>
            </Button>

            <div className="text-xs text-center text-muted-foreground my-2">Ethereum Wallets</div>
            
            <Button 
              onClick={() => connectMobileWallet('metamask')} 
              disabled={isConnecting}
              variant="outline"
              className="w-full flex items-center gap-3 h-12"
            >
              <Smartphone className="h-5 w-5" />
              <div>
                <div className="font-semibold">MetaMask</div>
                <div className="text-xs opacity-70">Ethereum wallet</div>
              </div>
            </Button>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-cyan-950/30 rounded-lg border border-cyan-500/30">
          <div className="flex items-center gap-2 text-cyan-300 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>CARV SVM Chain is Solana-based. Phantom or Backpack recommended for best experience.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}