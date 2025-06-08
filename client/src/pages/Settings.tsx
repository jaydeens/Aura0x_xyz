import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  Phone
} from "lucide-react";
import Navigation from "@/components/Navigation";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [usernameMessage, setUsernameMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: profileData } = useQuery({
    queryKey: ["/api/profile"],
  });

  const { data: auraLevels } = useQuery({
    queryKey: ["/api/aura-levels"],
    retry: false,
  });

  // Username validation
  const validateUsername = async (username: string) => {
    if (!username || username.length < 3) {
      setIsUsernameValid(false);
      setUsernameMessage("Username must be at least 3 characters long");
      return false;
    }
    
    if (username === (user as any)?.username) {
      setIsUsernameValid(true);
      setUsernameMessage("");
      return true;
    }

    try {
      const response = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      
      if (data.available) {
        setIsUsernameValid(true);
        setUsernameMessage("Username available");
      } else {
        setIsUsernameValid(false);
        setUsernameMessage("Username already taken");
      }
      return data.available;
    } catch (error) {
      setIsUsernameValid(false);
      setUsernameMessage("Error checking username");
      return false;
    }
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username?: string; email?: string; profileImageUrl?: string }) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsEditingUsername(false);
      setIsEditingEmail(false);
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

  // Profile picture upload mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      
      const response = await fetch("/api/upload-profile-image", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      updateProfileMutation.mutate({ profileImageUrl: data.imageUrl });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Twitter connection
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

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      
      uploadProfilePictureMutation.mutate(file);
    }
  };

  // Handle username save
  const handleUsernameSave = async () => {
    if (await validateUsername(newUsername)) {
      updateProfileMutation.mutate({ username: newUsername });
    }
  };

  // Handle email save
  const handleEmailSave = () => {
    if (newEmail && newEmail.includes("@")) {
      updateProfileMutation.mutate({ email: newEmail });
    } else {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
    }
  };

  const currentUser = user as any;
  const isTwitterConnected = currentUser?.twitterId && currentUser?.twitterAccessToken;

  // Get aura level info
  const currentAuraLevel = auraLevels?.find((level: any) => 
    currentUser?.auraPoints >= level.minPoints && 
    currentUser?.auraPoints <= level.maxPoints
  ) || auraLevels?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900">
      {/* Animated background orbs */}
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
                <h2 className="text-3xl font-black text-white">Profile Information</h2>
              </div>

              {/* Profile Picture Section */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative group mb-4">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center relative overflow-hidden">
                    {currentUser?.profileImageUrl ? (
                      <img 
                        src={currentUser.profileImageUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-3xl"
                      />
                    ) : (
                      <User className="w-16 h-16 text-white" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadProfilePictureMutation.isPending}
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 p-0 border-2 border-white/20"
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-white/60 text-sm text-center">Click to change your profile picture</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Form Fields */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Username */}
                <div className="space-y-3">
                  <Label className="text-white font-bold">Username</Label>
                  {isEditingUsername ? (
                    <div className="space-y-2">
                      <Input
                        value={newUsername}
                        onChange={(e) => {
                          setNewUsername(e.target.value);
                          validateUsername(e.target.value);
                        }}
                        className="bg-black/30 border-purple-500/30 text-white placeholder:text-white/40 focus:border-purple-500"
                        placeholder="Enter new username"
                      />
                      {usernameMessage && (
                        <p className={`text-sm ${isUsernameValid ? 'text-green-400' : 'text-red-400'}`}>
                          {usernameMessage}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUsernameSave}
                          disabled={!isUsernameValid || updateProfileMutation.isPending}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setIsEditingUsername(false)}
                          size="sm"
                          variant="outline"
                          className="border-purple-500/30 text-white hover:bg-purple-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-black/30 backdrop-blur-md px-4 py-3 rounded-2xl border border-purple-500/20">
                      <span className="text-white font-medium">
                        {currentUser?.username || currentUser?.firstName || "Set username"}
                      </span>
                      <Button
                        onClick={() => {
                          setIsEditingUsername(true);
                          setNewUsername(currentUser?.username || currentUser?.firstName || "");
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <Label className="text-white font-bold">Email</Label>
                  {isEditingEmail ? (
                    <div className="space-y-2">
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="bg-black/30 border-purple-500/30 text-white placeholder:text-white/40 focus:border-purple-500"
                        placeholder="Enter email address"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleEmailSave}
                          disabled={!newEmail.includes("@") || updateProfileMutation.isPending}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setIsEditingEmail(false)}
                          size="sm"
                          variant="outline"
                          className="border-purple-500/30 text-white hover:bg-purple-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-black/30 backdrop-blur-md px-4 py-3 rounded-2xl border border-purple-500/20">
                      <span className="text-white font-medium">
                        {currentUser?.email || "Add email"}
                      </span>
                      <Button
                        onClick={() => {
                          setIsEditingEmail(true);
                          setNewEmail(currentUser?.email || "");
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Wallet */}
                <div className="space-y-3">
                  <Label className="text-white font-bold">Wallet Address</Label>
                  <div className="flex items-center justify-between bg-black/30 backdrop-blur-md px-4 py-3 rounded-2xl border border-purple-500/20">
                    <span className="text-white font-mono text-sm">
                      {currentUser?.walletAddress 
                        ? `${currentUser.walletAddress.slice(0, 6)}...${currentUser.walletAddress.slice(-4)}`
                        : currentUser?.id?.substring(7, 20) + "..." || "Not connected"}
                    </span>
                    <Button
                      onClick={() => navigator.clipboard.writeText(currentUser?.walletAddress || currentUser?.id || "")}
                      size="sm"
                      variant="ghost"
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Connections */}
            <div className="bg-gradient-to-br from-blue-800/30 to-purple-900/30 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white">Social Connections</h2>
              </div>

              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-blue-500/20">
                <div className="flex items-center justify-between">
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
                          ? `Connected as @${currentUser?.twitterUsername || 'Unknown'}` 
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
                        Connect X
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Statistics */}
            <div className="bg-gradient-to-br from-emerald-800/30 to-cyan-900/30 backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white">Account Statistics</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/20 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-black text-white mb-2">{currentUser?.auraPoints || 0}</div>
                  <div className="text-white/60 font-bold">Aura Points</div>
                  {currentAuraLevel && (
                    <Badge 
                      className="mt-2 text-xs border-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${currentAuraLevel.color}, ${currentAuraLevel.color}80)` 
                      }}
                    >
                      {currentAuraLevel.name}
                    </Badge>
                  )}
                </div>

                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/20 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-black text-white mb-2">{currentUser?.currentStreak || 0}</div>
                  <div className="text-white/60 font-bold">Day Streak</div>
                </div>

                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/20 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-black text-white mb-2">{(currentUser?.totalEthEarned || 0).toFixed(4)}</div>
                  <div className="text-white/60 font-bold">ETH Earned</div>
                </div>

                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/20 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-black text-white mb-2">{(currentUser?.totalEthReceived || 0).toFixed(4)}</div>
                  <div className="text-white/60 font-bold">ETH Received</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}