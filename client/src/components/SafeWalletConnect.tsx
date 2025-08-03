import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wallet } from "lucide-react";

interface SafeWalletConnectProps {
  onConnect?: (address: string) => void;
  showBalance?: boolean;
  linkMode?: boolean;
}

export default function SafeWalletConnect({ onConnect, showBalance = true, linkMode = false }: SafeWalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Safely check for wallet availability
    const checkWallet = () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          setHasWallet(true);
        }
      } catch (error) {
        console.log('Wallet check failed, continuing without wallet support');
        setHasWallet(false);
      }
    };

    const timer = setTimeout(checkWallet, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleConnect = async () => {
    if (!hasWallet) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet to connect.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        const address = accounts[0];
        onConnect?.(address);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
        });
      }
    } catch (error: any) {
      console.log('Wallet connection failed:', error);
      
      if (error.code === 4001) {
        toast({
          title: "Connection Cancelled",
          description: "You rejected the wallet connection request.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to your wallet. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12"
    >
      <Wallet className="w-5 h-5 mr-3" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}