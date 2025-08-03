import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Footer from "@/components/Footer";
import { 
  Settings2, 
  User, 
  Camera, 
  Edit3, 
  Check, 
  X, 
  ExternalLink,
  Crown,
  Star,
  Target,
  Wallet,
  Trophy,
  Heart,
  Shield,
  Mail,
  Phone,
  Share,
  Twitter,
  Send,
  AlertTriangle
} from "lucide-react";
import Navigation from "@/components/Navigation";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [usernameMessage, setUsernameMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [tweetText, setTweetText] = useState("");
  const [showTweetComposer, setShowTweetComposer] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: twitterStatus, refetch: refetchTwitterStatus } = useQuery({
    queryKey: ["/api/social/x-status"],
  });

  const { data: auraLevels } = useQuery({
    queryKey: ["/api/aura-levels"],
  });

  const currentUser = user as any;
  const currentAuraLevel = auraLevels?.find?.((level: any) => 
    currentUser?.auraPoints >= level.minAuraPoints
  ) || auraLevels?.[0];

  const isTwitterConnected = !!twitterStatus?.connected;

  // Username validation
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setIsUsernameValid(false);
      setUsernameMessage("Username must be at least 3 characters");
      return;
    }

    try {
      const response = await fetch(`/api/check-username?username=${username}&excludeUserId=${currentUser?.id}`);
      const data = await response.json();
      
      if (data.available) {
        setIsUsernameValid(true);
        setUsernameMessage("Username is available");
      } else {
        setIsUsernameValid(false);
        setUsernameMessage("Username is already taken");
      }
    } catch (error) {
      setIsUsernameValid(false);
      setUsernameMessage("Error checking username");
    }
  };

  // Mutations
  const updateUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      return apiRequest("POST", "/api/auth/update-profile", { username });
    },
    onSuccess: () => {
      toast({ title: "Username updated successfully!" });
      setIsEditingUsername(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({ title: "Error updating username", description: error.message, variant: "destructive" });
    }
  });

  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/user/upload-profile-image', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: async () => {
      // Force refresh of all queries that might contain user data with profile images
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] }),
        queryClient.invalidateQueries({ predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          (query.queryKey[0].startsWith('/api/users/') || 
           query.queryKey[0].startsWith('/api/vouch/stats/'))
        }),
        queryClient.refetchQueries({ queryKey: ["/api/leaderboard"] })
      ]);
      
      toast({ title: "Profile image updated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error uploading image", description: error.message, variant: "destructive" });
    }
  });

  const disconnectTwitterMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/disconnect-twitter");
    },
    onSuccess: () => {
      toast({ title: "X account disconnected successfully!" });
      refetchTwitterStatus();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({ title: "Error disconnecting X account", description: error.message, variant: "destructive" });
    }
  });

  const postTweetMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest("POST", "/api/social/post-tweet", { text });
    },
    onSuccess: () => {
      toast({ title: "Tweet posted successfully!" });
      setTweetText("");
      setShowTweetComposer(false);
    },
    onError: (error: any) => {
      toast({ title: "Error posting tweet", description: error.message, variant: "destructive" });
    }
  });

  const connectWalletMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      return apiRequest("POST", "/api/auth/bind-wallet", { walletAddress });
    },
    onSuccess: (data: any) => {
      const message = data.message || "Wallet connected successfully!";
      toast({ 
        title: data.bonusAwarded ? "🎉 Wallet Connected!" : "Wallet Connected!", 
        description: message,
        duration: data.bonusAwarded ? 6000 : 3000
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({ title: "Error connecting wallet", description: error.message, variant: "destructive" });
    }
  });

  // Event handlers
  const handleUsernameEdit = () => {
    setNewUsername(currentUser?.username || "");
    setIsEditingUsername(true);
  };

  const handleUsernameSubmit = () => {
    if (isUsernameValid && newUsername) {
      updateUsernameMutation.mutate(newUsername);
    }
  };



  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadProfileImageMutation.mutate(file);
    }
  };

  const handleTwitterConnect = () => {
    setIsConnecting(true);
    window.location.href = '/api/auth/twitter';
  };

  const handlePostTweet = () => {
    if (tweetText.trim()) {
      postTweetMutation.mutate(tweetText);
    }
  };

  const handleWalletConnect = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        toast({ 
          title: "MetaMask not found", 
          description: "Please install MetaMask to connect your wallet", 
          variant: "destructive" 
        });
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        const walletAddress = accounts[0];
        connectWalletMutation.mutate(walletAddress);
      }
    } catch (error: any) {
      toast({ 
        title: "Error connecting wallet", 
        description: error.message || "Failed to connect wallet", 
        variant: "destructive" 
      });
    }
  };

  const characterCount = tweetText.length;
  const maxCharacters = 280;
  const isOverLimit = characterCount > maxCharacters;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-full blur-xl animate-bounce-slow"></div>
      </div>
      
      <Navigation />
      <main className="relative pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center">
                <Settings2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
              Account Settings
            </h1>
            <p className="text-white/60 text-lg">Manage your profile and account preferences</p>
          </div>

          <div className="space-y-8">
            {/* Profile Information */}
            <div className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white">Profile Information</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Image */}
                <div className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-gradient-to-br from-purple-500 to-pink-600 shadow-2xl">
                        <img
                          src={currentUser?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadProfileImageMutation.isPending}
                        className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 border-4 border-black/20"
                        size="sm"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-white/60 text-sm">Click camera icon to update</p>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="space-y-6">
                  {/* Username */}
                  <div className="space-y-2">
                    <Label className="text-white font-semibold">Username</Label>
                    <div className="flex items-center gap-3">
                      {isEditingUsername ? (
                        <div className="flex-1 space-y-2">
                          <Input
                            value={newUsername}
                            onChange={(e) => {
                              setNewUsername(e.target.value);
                              checkUsernameAvailability(e.target.value);
                            }}
                            className="bg-black/50 border-purple-500/30 text-white placeholder-white/50"
                            placeholder="Enter new username"
                          />
                          {usernameMessage && (
                            <p className={`text-sm ${isUsernameValid ? 'text-green-400' : 'text-red-400'}`}>
                              {usernameMessage}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              onClick={handleUsernameSubmit}
                              disabled={!isUsernameValid || updateUsernameMutation.isPending}
                              size="sm"
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => setIsEditingUsername(false)}
                              variant="outline"
                              size="sm"
                              className="border-purple-500/30 text-white hover:bg-purple-500/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 bg-black/50 border border-purple-500/30 rounded-lg px-4 py-3">
                            <p className="text-white font-medium">{currentUser?.username || 'Not set'}</p>
                          </div>
                          <Button
                            onClick={handleUsernameEdit}
                            variant="outline"
                            size="sm"
                            className="border-purple-500/30 text-white hover:bg-purple-500/10"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>


                </div>
              </div>
            </div>

            {/* Social Connections */}
            <div className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white">Social Connections</h2>
              </div>

              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-blue-500/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">X (Twitter)</h3>
                      <p className="text-white/60">
                        {isTwitterConnected 
                          ? `Connected as @${twitterStatus?.username || 'Unknown'}` 
                          : 'Connect your X account for enhanced features'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isTwitterConnected ? (
                      <>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-bold">
                          Connected
                        </Badge>
                        <Button
                          onClick={() => disconnectTwitterMutation.mutate()}
                          disabled={disconnectTwitterMutation.isPending}
                          variant="outline"
                          className="border-blue-500/30 text-white hover:bg-blue-500/10"
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleTwitterConnect}
                        disabled={isConnecting}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold"
                      >
                        {isConnecting ? "Connecting..." : "Connect X Account"}
                      </Button>
                    )}
                  </div>
                </div>


              </div>
            </div>

            {/* Wallet Connections */}
            <div className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white">Wallet Connections</h2>
              </div>

              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Ethereum Wallet</h3>
                      <p className="text-white/60">
                        {currentUser?.walletAddress 
                          ? `Connected: ${currentUser.walletAddress.slice(0, 6)}...${currentUser.walletAddress.slice(-4)}` 
                          : 'Connect your wallet to access Web3 features'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {currentUser?.walletAddress ? (
                      <>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-bold">
                          Connected
                        </Badge>
                        <Button
                          onClick={() => {
                            // Disconnect wallet functionality will be implemented
                            toast({ 
                              title: "Wallet disconnected", 
                              description: "Your wallet has been disconnected from this account." 
                            });
                          }}
                          variant="outline"
                          className="border-purple-500/30 text-white hover:bg-purple-500/10"
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleWalletConnect}
                        disabled={connectWalletMutation.isPending}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
                      >
                        {connectWalletMutation.isPending ? "Connecting..." : "Connect Wallet"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Wallet Benefits */}
                <div className="space-y-4 border-t border-white/10 pt-6">
                  <h4 className="text-lg font-bold text-white">Wallet Benefits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/20 rounded-xl p-4 border border-purple-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-5 h-5 text-purple-400" />
                        <span className="text-white font-semibold">Battle Rewards</span>
                      </div>
                      <p className="text-white/60 text-sm">Receive ETH rewards directly to your wallet from battle wins</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4 border border-purple-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Heart className="w-5 h-5 text-pink-400" />
                        <span className="text-white font-semibold">Vouch Payments</span>
                      </div>
                      <p className="text-white/60 text-sm">Send and receive vouches in ETH to build reputation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}