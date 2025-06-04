import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Twitter, CheckCircle, AlertCircle } from "lucide-react";
import Navigation from "@/components/Navigation";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: profileData } = useQuery({
    queryKey: ["/api/profile"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username?: string; twitterUsername?: string }) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTwitterConnect = () => {
    setIsConnecting(true);
    // Redirect to Twitter OAuth
    window.location.href = "/api/auth/twitter";
  };

  const disconnectTwitterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/twitter/disconnect");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "X Disconnected",
        description: "Your X account has been disconnected.",
      });
    },
    onError: () => {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect X account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isTwitterConnected = user?.twitterId && user?.twitterAccessToken;

  return (
    <div className="min-h-screen bg-transparent">
      <Navigation />
      <main className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2">⚙️ Settings</h1>
            <p className="text-gray-400">Manage your account and preferences</p>
          </div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your profile details and display information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={user?.username || ""}
                  onChange={(e) => {
                    updateProfileMutation.mutate({ username: e.target.value });
                  }}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  placeholder="Email from auth provider"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* X (Twitter) Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Twitter className="h-5 w-5" />
              X (Twitter) Integration
            </CardTitle>
            <CardDescription>
              Connect your X account to automatically share lesson completions and Aura achievements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTwitterConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Connected to X</p>
                      <p className="text-sm text-muted-foreground">
                        @{user?.twitterUsername}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Connected
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Automated Posting</h4>
                  <p className="text-sm text-muted-foreground">
                    When enabled, your lesson completions and Aura achievements will be automatically shared to X.
                  </p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Lesson completion posts enabled</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => disconnectTwitterMutation.mutate()}
                  disabled={disconnectTwitterMutation.isPending}
                >
                  Disconnect X Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">X Account Not Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Connect your X account to enable automated sharing of your Aura journey.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Benefits of Connecting X</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Automatically share lesson completions</li>
                    <li>• Showcase your Aura level achievements</li>
                    <li>• Build your Web3 learning reputation</li>
                    <li>• Connect with other learners</li>
                  </ul>
                </div>

                <Button
                  onClick={handleTwitterConnect}
                  disabled={isConnecting}
                  className="flex items-center gap-2"
                >
                  <Twitter className="h-4 w-4" />
                  {isConnecting ? "Connecting..." : "Connect X Account"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
            <CardDescription>
              Your Aura journey progress and achievements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {user?.auraPoints || 0}
                </div>
                <div className="text-sm text-muted-foreground">Aura Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {user?.currentStreak || 0}
                </div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {user?.totalBattlesWon || 0}
                </div>
                <div className="text-sm text-muted-foreground">Clashes Won</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  ${user?.totalUsdtEarned || "0.00"}
                </div>
                <div className="text-sm text-muted-foreground">USDT Earned</div>
              </div>
            </div>
          </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}