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
import { Twitter, CheckCircle, AlertCircle, Settings2, User, Shield } from "lucide-react";
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

  const isTwitterConnected = (user as any)?.twitterId && (user as any)?.twitterAccessToken;

  return (
    <div className="min-h-screen bg-transparent">
      <Navigation />
      <main className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2">⚙️ Account Settings</h1>
            <p className="text-gray-400">Manage your profile and account preferences</p>
          </div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-400" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update your display name and profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username" className="text-white">Username</Label>
                    <Input
                      id="username"
                      value={(user as any)?.username || ""}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter username"
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      value={(user as any)?.email || "Not connected"}
                      className="bg-gray-700 border-gray-600 text-white"
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Connections */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Twitter className="w-5 h-5 mr-2 text-blue-400" />
                  Social Connections
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Connect your social media accounts for enhanced features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Twitter className="w-6 h-6 text-blue-400" />
                    <div>
                      <h4 className="text-white font-semibold">X (Twitter)</h4>
                      <p className="text-gray-400 text-sm">
                        {isTwitterConnected ? 
                          `Connected as @${(user as any)?.twitterUsername || 'Unknown'}` : 
                          'Connect your X account'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isTwitterConnected ? (
                      <>
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Connected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectTwitterMutation.mutate()}
                          disabled={disconnectTwitterMutation.isPending}
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleTwitterConnect}
                        disabled={isConnecting}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Twitter className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-400" />
                  Account Statistics
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your performance metrics and achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-white">{(user as any)?.auraPoints || 0}</div>
                    <div className="text-sm text-gray-400">Fame Points</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-white">{(user as any)?.currentStreak || 0}</div>
                    <div className="text-sm text-gray-400">Day Streak</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-white">{(user as any)?.totalBattlesWon || 0}</div>
                    <div className="text-sm text-gray-400">Battles Won</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-white">${(user as any)?.totalUsdtEarned || "0.00"}</div>
                    <div className="text-sm text-gray-400">USDT Earned</div>
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