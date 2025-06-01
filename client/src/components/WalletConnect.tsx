import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  showBalance?: boolean;
}

export default function WalletConnect({ onConnect, showBalance = true }: WalletConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
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

  const connectWallet = async () => {
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
        
        // Switch to Polygon network if needed
        await switchToPolygon();
        
        if (showBalance) {
          await fetchBalance(walletAddress);
        }
        
        onConnect?.(walletAddress);
        
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

  const switchToPolygon = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }], // Polygon Mainnet
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x89',
              chainName: 'Polygon Mainnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: ['https://polygon-rpc.com/'],
              blockExplorerUrls: ['https://polygonscan.com/'],
            }],
          });
        } catch (addError) {
          console.error("Error adding Polygon network:", addError);
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </CardTitle>
        <CardDescription>
          Connect your Web3 wallet to participate in vouching and battles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
        {!window.ethereum && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">MetaMask not detected</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}