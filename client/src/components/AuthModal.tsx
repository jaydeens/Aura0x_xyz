import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import TwitterConnect from "@/components/TwitterConnect";
import WalletConnect from "@/components/WalletConnect";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [step, setStep] = useState<'select' | 'twitter' | 'wallet'>('select');

  const handleTwitterAuth = () => {
    window.location.href = "/api/auth/twitter";
  };

  const handleReplit = () => {
    window.location.href = "/api/login";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1A1A1B] border-[#8000FF]/20">
        <DialogHeader>
          <DialogTitle className="text-center text-white">Join Aura</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Choose how you want to connect and verify your identity
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Twitter Option */}
          <Button
            onClick={handleTwitterAuth}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Connect with Twitter
          </Button>

          <Separator className="bg-[#8000FF]/20" />

          {/* Wallet Connect Option */}
          <div className="space-y-2">
            <WalletConnect showBalance={false} />
          </div>

          <Separator className="bg-[#8000FF]/20" />

          {/* Replit Fallback */}
          <Button
            onClick={handleReplit}
            variant="outline"
            className="w-full border-[#8000FF]/50 text-[#8000FF] hover:bg-[#8000FF]/10"
          >
            Continue with Replit Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}