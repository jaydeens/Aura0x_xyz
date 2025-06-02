import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, ExternalLink } from "lucide-react";
import { SiX } from "react-icons/si";

interface TwitterConnectProps {
  onConnect?: (twitterData: any) => void;
}

export default function TwitterConnect({ onConnect }: TwitterConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const connectTwitter = async () => {
    setIsConnecting(true);
    try {
      // For now, show a message that X linking will be available soon
      toast({
        title: "X Account Linking",
        description: "X account linking will be available soon. Stay tuned!",
        variant: "default",
      });
      setIsConnecting(false);
    } catch (error) {
      console.error("Error connecting Twitter:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect X. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const isTwitterConnected = user?.twitterId && user?.twitterUsername;

  if (isTwitterConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            Twitter Connected
          </CardTitle>
          <CardDescription>
            @{user.twitterUsername}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={user.isVerified ? "default" : "secondary"}>
              {user.isVerified ? "Verified" : "Unverified"}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://twitter.com/${user.twitterUsername}`, '_blank')}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Twitter Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Twitter className="h-5 w-5 text-blue-500" />
          Connect Twitter
        </CardTitle>
        <CardDescription>
          Connect your Twitter account to participate in the Aura platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={connectTwitter} 
          disabled={isConnecting}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isConnecting ? "Connecting..." : "Connect with Twitter"}
        </Button>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          We'll use your Twitter profile to verify your identity and reputation
        </p>
      </CardContent>
    </Card>
  );
}