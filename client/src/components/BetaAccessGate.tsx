import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, CheckCircle } from "lucide-react";

interface BetaAccessGateProps {
  children: React.ReactNode;
  walletAddress?: string;
}

export function BetaAccessGate({ children, walletAddress }: BetaAccessGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [checkAddress, setCheckAddress] = useState("");
  const [isManualCheck, setIsManualCheck] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      checkBetaAccess(walletAddress);
    } else {
      setIsChecking(false);
      setHasAccess(false);
    }
  }, [walletAddress]);

  const checkBetaAccess = async (address: string) => {
    try {
      setIsChecking(true);
      const response = await fetch(`/api/beta-access/${address}`);
      const data = await response.json();
      setHasAccess(data.hasAccess);
    } catch (error) {
      console.error("Error checking beta access:", error);
      setHasAccess(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleManualCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAddress.trim()) {
      await checkBetaAccess(checkAddress.trim());
      setIsManualCheck(true);
    }
  };

  // Show loading state while checking access
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-center text-muted-foreground">
                Checking beta access...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has access, render the app
  if (hasAccess) {
    return (
      <div className="relative">
        {children}
        {/* Beta indicator */}
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              BETA ACCESS
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show beta access required screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Closed Beta Access
          </CardTitle>
          <CardDescription className="text-center mt-2">
            Aura is currently in closed beta. Connect your whitelisted wallet or check if your address has access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!walletAddress && (
            <Alert>
              <AlertDescription>
                Please connect your wallet first, or manually check your wallet address below.
              </AlertDescription>
            </Alert>
          )}

          {/* Manual address check form */}
          <form onSubmit={handleManualCheck} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-address">Wallet Address</Label>
              <Input
                id="wallet-address"
                type="text"
                placeholder="0x..."
                value={checkAddress}
                onChange={(e) => setCheckAddress(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <Button type="submit" className="w-full" disabled={!checkAddress.trim() || isChecking}>
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking Access...
                </>
              ) : (
                "Check Beta Access"
              )}
            </Button>
          </form>

          {isManualCheck && hasAccess === false && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                This wallet address is not whitelisted for beta access. Contact our team to request access.
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-muted-foreground text-center">
              Want beta access?{" "}
              <a 
                href="https://twitter.com/AuraBattlePlatform" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                Follow us on Twitter
              </a>{" "}
              for updates and access opportunities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}