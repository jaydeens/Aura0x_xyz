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



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1A1A1B] border-[#8000FF]/20">
        <DialogHeader>
          <DialogTitle className="text-center text-white">Join Dreamz
</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Choose how you want to connect and verify your identity
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* X (Twitter) Option */}
          <Button
            onClick={handleTwitterAuth}
            className="w-full bg-black hover:bg-gray-800 text-white h-12"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 1200 1227" fill="currentColor">
              <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/>
            </svg>
            Connect with X
          </Button>

          <Separator className="bg-[#8000FF]/20" />

          {/* Wallet Connect Option */}
          <div className="space-y-2">
            <WalletConnect showBalance={false} />
          </div>


        </div>
      </DialogContent>
    </Dialog>
  );
}