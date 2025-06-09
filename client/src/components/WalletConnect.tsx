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
      toast({
        title: linkMode ? "Linking Failed" : "Authentication Failed",
        description: error.message || (linkMode 
          ? "Failed to link wallet. Please try again."
          : "Failed to authenticate wallet. Please try again."),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    checkConnection();
    detectMobile();
  }, []);

  const detectMobile = () => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    setIsMobile(mobile);
  };

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

  const connectMobileWallet = async (walletType: 'metamask' | 'trust' | 'coinbase' | 'walletconnect') => {
    const deepLinks = {
      metamask: `https://metamask.app.link/dapp/${window.location.host}`,
      trust: `https://link.trustwallet.com/open_url?coin_id=60&url=https://${window.location.host}`,
      coinbase: `https://go.cb-w.com/dapp?cb_url=https://${window.location.host}`,
      walletconnect: `wc://` // WalletConnect protocol
    };

    // Check for Trust Wallet specifically
    if (walletType === 'trust' && (window as any).trustWallet) {
      try {
        const accounts = await (window as any).trustWallet.request({
          method: 'eth_requestAccounts',
        });
        if (accounts.length > 0) {
          const walletAddress = accounts[0];
          setAddress(walletAddress);
          setIsConnected(true);
          await switchToBaseSepolia();
          if (showBalance) await fetchBalance(walletAddress);
          onConnect?.(walletAddress);
          authenticateWallet.mutate(walletAddress);
          toast({
            title: "Trust Wallet Connected",
            description: `Connected to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          });
        }
        return;
      } catch (error) {
        console.error("Trust Wallet connection failed:", error);
      }
    }

    if (isMobile && !window.ethereum) {
      // Open mobile wallet app
      window.open(deepLinks[walletType], '_blank');
      toast({
        title: "Opening Wallet App",
        description: `Opening ${walletType} app. Please connect your wallet and return to this page.`,
      });
      return;
    }

    // If wallet is available, proceed with normal connection
    await connectWallet();
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
        
        // Switch to Base Sepolia network if needed
        await switchToBaseSepolia();
        
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

  const switchToBaseSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14A34' }], // Base Sepolia
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x14A34',
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia-explorer.base.org'],
            }],
          });
        } catch (addError) {
          console.error("Error adding Base Sepolia network:", addError);
        }
      }
    }
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
          Connect your Web3 wallet to participate in vouching and battles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mobile wallet options */}
        {isMobile ? (
          <div className="space-y-3">
            <Button 
              onClick={() => connectMobileWallet('metamask')} 
              disabled={isConnecting}
              className="w-full flex items-center gap-3 h-12 text-left justify-start bg-orange-500 hover:bg-orange-600"
            >
              <Smartphone className="h-5 w-5" />
              <div>
                <div className="font-semibold">MetaMask</div>
                <div className="text-xs opacity-80">Most popular wallet</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => connectMobileWallet('trust')} 
              disabled={isConnecting}
              variant="outline"
              className="w-full flex items-center gap-3 h-12 text-left justify-start"
            >
              <Smartphone className="h-5 w-5" />
              <div>
                <div className="font-semibold">Trust Wallet</div>
                <div className="text-xs opacity-70">Mobile-first wallet</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => connectMobileWallet('walletconnect')} 
              disabled={isConnecting}
              variant="outline"
              className="w-full flex items-center gap-3 h-12 text-left justify-start"
            >
              <QrCode className="h-5 w-5" />
              <div>
                <div className="font-semibold">WalletConnect</div>
                <div className="text-xs opacity-70">Scan QR code</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => connectMobileWallet('coinbase')} 
              disabled={isConnecting}
              variant="outline"
              className="w-full flex items-center gap-3 h-12 text-left justify-start"
            >
              <Smartphone className="h-5 w-5" />
              <div>
                <div className="font-semibold">Coinbase Wallet</div>
                <div className="text-xs opacity-70">Easy to use</div>
              </div>
            </Button>
          </div>
        ) : (
          /* Desktop wallet connection */
          <Button 
            onClick={connectWallet} 
            disabled={isConnecting}
            className="w-full h-12"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
        
        {!window.ethereum && !isMobile && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Please install a Web3 wallet extension</span>
            </div>
          </div>
        )}
        
        {isMobile && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Smartphone className="h-4 w-4" />
              <span className="text-sm">Choose your preferred mobile wallet above</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}