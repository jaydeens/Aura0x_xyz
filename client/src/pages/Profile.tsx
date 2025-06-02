import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import VouchForm from "@/components/VouchForm";
import TwitterConnect from "@/components/TwitterConnect";
import WalletConnect from "@/components/WalletConnect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Crown, 
  Trophy, 
  Coins, 
  TrendingUp, 
  Calendar, 
  Wallet,
  Target,
  Flame,
  Star,
  Zap,
  Sword,
  HandHeart,
  Clock,
  ExternalLink,
  Settings,
  Link2,
  CheckCircle,
  AlertCircle,
  Edit,
  Camera
} from "lucide-react";
import { SiX } from "react-icons/si";

interface ProfileParams {
  id: string;
}

export default function Profile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  // Form states
  const [username, setUsername] = useState("");
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [usernameMessage, setUsernameMessage] = useState("");
  
  // Get user ID from URL
  const urlPath = window.location.pathname;
  const urlUserId = urlPath.split('/').pop() || '';
  const currentUser = user as any;
  
  // Check if viewing own profile
  const viewingOwnProfile = !urlUserId || urlUserId === currentUser?.id;
  const targetUserId = viewingOwnProfile ? currentUser?.id : urlUserId;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch profile data only if viewing another user's profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/users", targetUserId],
    queryFn: () => fetch(`/api/users/${targetUserId}`).then(res => {
      if (!res.ok) {
        throw new Error('User not found');
      }
      return res.json();
    }),
    enabled: !!targetUserId && isAuthenticated && !viewingOwnProfile,
    retry: false,
  });

  // Use current user data for own profile, or fetched data for others
  const userData = viewingOwnProfile ? currentUser : (profileData as any)?.user;

  const { data: auraLevels } = useQuery({
    queryKey: ["/api/aura-levels"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-br from-[#8000FF] to-[#9933FF] rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B]">
        <Navigation />
        <main className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-48 bg-[#1A1A1B] rounded-2xl"></div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="h-64 bg-[#1A1A1B] rounded-2xl"></div>
                <div className="h-64 bg-[#1A1A1B] rounded-2xl"></div>
                <div className="h-64 bg-[#1A1A1B] rounded-2xl"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B]">
        <Navigation />
        <main className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardContent className="p-12 text-center">
                <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  User Not Found
                </h3>
                <p className="text-gray-500 mb-6">
                  The requested user profile could not be found.
                </p>
                <Button asChild>
                  <a href="/leaderboard">View Leaderboard</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const profileUser = userData;
  const battleStats = viewingOwnProfile ? { total: 0, won: 0, lost: 0 } : (profileData as any)?.battleStats || { total: 0, won: 0, lost: 0 };
  const vouchStats = viewingOwnProfile ? { received: 0, given: 0 } : (profileData as any)?.vouchStats || { received: 0, given: 0 };

  // Initialize username state when profile user data loads
  useEffect(() => {
    if (profileUser && viewingOwnProfile) {
      setUsername(profileUser.username || profileUser.firstName || "");
    }
  }, [profileUser, viewingOwnProfile]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { username?: string; profileImageUrl?: string }) => {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        body: JSON.stringify(updates),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${urlUserId}`] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Username validation
  const validateUsername = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setIsUsernameValid(false);
      setUsernameMessage("Username must be at least 3 characters long");
      return false;
    }
    
    if (usernameToCheck.length > 20) {
      setIsUsernameValid(false);
      setUsernameMessage("Username must be less than 20 characters");
      return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
      setIsUsernameValid(false);
      setUsernameMessage("Username can only contain letters, numbers, and underscores");
      return false;
    }

    try {
      const response = await fetch(`/api/user/check-username/${usernameToCheck}`);
      const result = await response.json();
      if (!result.available) {
        setIsUsernameValid(false);
        setUsernameMessage("Username is already taken");
        return false;
      }
    } catch (error) {
      console.error("Error checking username:", error);
    }

    setIsUsernameValid(true);
    setUsernameMessage("Username is available");
    return true;
  };

  // Handle username save
  const handleUsernameSave = async () => {
    if (!username || !isUsernameValid) return;
    
    const isValid = await validateUsername(username);
    if (isValid) {
      updateProfileMutation.mutate({ username });
    }
  };

  // Function to crop image to square and resize
  const cropImageToSquare = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate square dimensions (use the smaller dimension)
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        // Set canvas to desired output size (400x400 for good quality)
        const outputSize = 400;
        canvas.width = outputSize;
        canvas.height = outputSize;

        if (ctx) {
          // Draw cropped and resized image
          ctx.drawImage(
            img,
            startX, startY, size, size, // Source rectangle (square crop)
            0, 0, outputSize, outputSize // Destination rectangle
          );

          // Convert to blob with good quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to process image'));
              }
            },
            'image/jpeg',
            0.9 // High quality
          );
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        // Check file size (max 5MB for original)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: "Please select an image smaller than 5MB.",
            variant: "destructive",
          });
          return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid File Type",
            description: "Please select a valid image file.",
            variant: "destructive",
          });
          return;
        }

        try {
          toast({
            title: "Processing Image",
            description: "Cropping and optimizing your profile picture...",
          });

          // Crop image to square and optimize
          const croppedBlob = await cropImageToSquare(file);
          
          const formData = new FormData();
          formData.append('profileImage', croppedBlob, 'profile.jpg');

          const response = await fetch('/api/user/upload-profile-image', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload image');
          }

          const result = await response.json();
          
          // Update profile with new image URL
          updateProfileMutation.mutate({ profileImageUrl: result.imageUrl });
          
          toast({
            title: "Profile Picture Updated",
            description: "Your profile picture has been cropped and uploaded successfully.",
          });
        } catch (error) {
          console.error('Upload error:', error);
          toast({
            title: "Upload Failed",
            description: error instanceof Error ? error.message : "Failed to process and upload image. Please try again.",
            variant: "destructive",
          });
        }
      }
    };
    input.click();
  };

  const getStreakLevel = (streak: number) => {
    if (!auraLevels) return { name: "Clout Chaser", color: "#8000FF", icon: Zap, multiplier: 1.0 };
    
    return (auraLevels as any[]).find((level: any) => 
      streak >= level.minDays && (!level.maxDays || streak <= level.maxDays)
    ) || (auraLevels as any[])[0];
  };

  const getUserDisplayName = () => {
    return profileUser.firstName || profileUser.username || `User ${profileUser.id?.slice(0, 6)}`;
  };

  const getWinRate = () => {
    const totalBattles = battleStats.won + battleStats.lost;
    if (totalBattles === 0) return 0;
    return ((battleStats.won / totalBattles) * 100).toFixed(1);
  };

  const getPortfolioGrowthColor = () => {
    const growth = parseFloat(profileUser.portfolioGrowth || "0");
    if (growth > 0) return "text-green-400";
    if (growth < 0) return "text-red-400";
    return "text-gray-400";
  };

  const streakLevel = getStreakLevel(profileUser.currentStreak || 0);
  const StreakIcon = streakLevel.icon || Zap;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B]">
      <Navigation />
      
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <Card className="bg-gradient-to-r from-[#1A1A1B] to-[#8000FF]/5 border-[#8000FF]/20 mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
                {/* Avatar */}
                <div className="flex-shrink-0 mb-6 lg:mb-0">
                  <Avatar className="w-32 h-32 border-4 border-[#8000FF]/30">
                    <AvatarImage
                      src={profileUser.profileImageUrl || ""}
                      alt={getUserDisplayName()}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#8000FF] to-[#9933FF] text-white text-2xl">
                      {(profileUser.firstName?.[0] || profileUser.username?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">
                        {getUserDisplayName()}
                      </h1>
                      <div className="flex items-center space-x-4 mb-4">
                        <Badge 
                          className="text-sm"
                          style={{ 
                            backgroundColor: `${streakLevel.color}20`,
                            color: streakLevel.color,
                            borderColor: `${streakLevel.color}40`
                          }}
                        >
                          <StreakIcon className="w-4 h-4 mr-1" />
                          {streakLevel.name}
                        </Badge>
                        <div className="flex items-center text-gray-400">
                          <Flame className="w-4 h-4 mr-1" />
                          {profileUser.currentStreak || 0} day streak
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Calendar className="w-4 h-4 mr-1" />
                          Joined {new Date(profileUser.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {profileUser.email && (
                        <p className="text-gray-400 mb-4">{profileUser.email}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      {!viewingOwnProfile && (
                        <Button className="bg-gradient-to-r from-[#8000FF] to-[#9933FF] hover:from-[#8000FF]/80 hover:to-[#9933FF]/80">
                          <HandHeart className="w-4 h-4 mr-2" />
                          Vouch
                        </Button>
                      )}
                      {profileUser.walletAddress && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`https://polygonscan.com/address/${profileUser.walletAddress}`, '_blank')}
                          className="border-[#8000FF]/30 text-[#8000FF] hover:bg-[#8000FF]/10"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Wallet
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Aura Points */}
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total Aura</p>
                    <p className="text-2xl font-bold text-white">
                      {profileUser.auraPoints?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-[#8000FF]" />
                </div>
              </CardContent>
            </Card>

            {/* Win Rate */}
            <Card className="bg-[#1A1A1B] border-[#FFD700]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Win Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {getWinRate()}%
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-[#FFD700]" />
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Growth */}
            <Card className="bg-[#1A1A1B] border-[#00FF88]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Portfolio Growth</p>
                    <p className={`text-2xl font-bold ${getPortfolioGrowthColor()}`}>
                      {parseFloat(profileUser.portfolioGrowth || "0") > 0 ? "+" : ""}{profileUser.portfolioGrowth || "0"}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-[#00FF88]" />
                </div>
              </CardContent>
            </Card>

            {/* Total Vouches */}
            <Card className="bg-[#1A1A1B] border-[#9933FF]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Vouches Received</p>
                    <p className="text-2xl font-bold text-white">
                      ${parseFloat(profileUser.totalVouchesReceived || "0").toLocaleString()}
                    </p>
                  </div>
                  <Coins className="w-8 h-8 text-[#9933FF]" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className={`grid w-full ${viewingOwnProfile ? 'grid-cols-4' : 'grid-cols-4'} bg-[#1A1A1B] border border-[#8000FF]/20`}>
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="battles" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                Battles
              </TabsTrigger>
              <TabsTrigger value="vouches" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                Vouches
              </TabsTrigger>
              {viewingOwnProfile ? (
                <TabsTrigger value="settings" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                  Settings
                </TabsTrigger>
              ) : (
                <TabsTrigger value="vouch-user" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                  Vouch User
                </TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Battle History Summary */}
                <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Sword className="w-5 h-5 mr-2 text-[#FFD700]" />
                      Battle Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Battles:</span>
                      <span className="text-white font-medium">{battleStats.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Battles Won:</span>
                      <span className="text-green-400 font-medium">{battleStats.won}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Battles Lost:</span>
                      <span className="text-red-400 font-medium">{battleStats.lost}</span>
                    </div>
                    <Separator className="bg-[#8000FF]/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Win Rate:</span>
                      <Badge className="bg-[#FFD700]/20 text-[#FFD700]">
                        {getWinRate()}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Vouch Statistics */}
                <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <HandHeart className="w-5 h-5 mr-2 text-[#9933FF]" />
                      Vouch Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Vouches Received:</span>
                      <span className="text-white font-medium">{vouchStats.received}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Vouches Given:</span>
                      <span className="text-white font-medium">{vouchStats.given}</span>
                    </div>
                    <Separator className="bg-[#8000FF]/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Value:</span>
                      <Badge className="bg-[#9933FF]/20 text-[#9933FF]">
                        ${parseFloat(profileUser.totalVouchesReceived || "0").toLocaleString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab (Own Profile Only) */}
            {viewingOwnProfile && (
              <TabsContent value="settings" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Account Linking */}
                  <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Link2 className="w-5 h-5 mr-2 text-[#8000FF]" />
                        Account Linking
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Twitter Connection */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <SiX className="w-5 h-5 text-white" />
                            <div>
                              <p className="text-white font-medium">X Account</p>
                              <p className="text-sm text-gray-400">Connect your X account for verification</p>
                            </div>
                          </div>
                          {profileUser.twitterId ? (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-green-500 text-sm">Connected</span>
                            </div>
                          ) : (
                            <TwitterConnect onConnect={(twitterData) => {
                              toast({
                                title: "Twitter Connected",
                                description: "Your Twitter account has been linked successfully.",
                              });
                              // Refresh user data
                              window.location.reload();
                            }} />
                          )}
                        </div>
                      </div>

                      <Separator className="bg-[#8000FF]/20" />

                      {/* Wallet Connection */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Wallet className="w-5 h-5 text-[#8000FF]" />
                            <div>
                              <p className="text-white font-medium">Wallet Address</p>
                              <p className="text-sm text-gray-400">Connect your wallet for Web3 features</p>
                            </div>
                          </div>
                          {profileUser.walletAddress ? (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-green-500 text-sm">Connected</span>
                            </div>
                          ) : (
                            <WalletConnect 
                              showBalance={false}
                              linkMode={true}
                              onConnect={(address) => {
                                toast({
                                  title: "Wallet Connected",
                                  description: "Your wallet has been linked successfully.",
                                });
                                // Refresh user data
                                window.location.reload();
                              }} 
                            />
                          )}
                        </div>
                        {profileUser.walletAddress && (
                          <div className="bg-[#0A0A0B] rounded-lg p-3">
                            <p className="text-sm text-gray-400 mb-1">Connected Wallet:</p>
                            <p className="text-white font-mono text-sm break-all">
                              {profileUser.walletAddress}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profile Settings */}
                  <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Edit className="w-5 h-5 mr-2 text-[#FFD700]" />
                        Profile Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Profile Picture */}
                      <div className="space-y-3">
                        <h4 className="text-white font-medium flex items-center">
                          <Camera className="w-4 h-4 mr-2" />
                          Profile Picture
                        </h4>
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-16 h-16 border-2 border-[#8000FF]/30">
                            <AvatarImage src={profileUser.profileImageUrl || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-[#8000FF] to-[#9933FF] text-white">
                              {(profileUser.firstName?.[0] || profileUser.username?.[0] || "U").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleProfilePictureUpload}
                            className="border-[#8000FF]/30 text-[#8000FF] hover:bg-[#8000FF]/10"
                          >
                            Change Picture
                          </Button>
                        </div>
                      </div>

                      <Separator className="bg-[#8000FF]/20" />

                      {/* Username */}
                      <div className="space-y-3">
                        <h4 className="text-white font-medium flex items-center">
                          <Edit className="w-4 h-4 mr-2" />
                          Username
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => {
                                  setUsername(e.target.value);
                                  if (e.target.value) {
                                    validateUsername(e.target.value);
                                  }
                                }}
                                className={`w-full px-3 py-2 bg-[#0A0A0B] border rounded-lg text-white placeholder-gray-400 focus:outline-none ${
                                  isUsernameValid ? 'border-[#8000FF]/30 focus:border-[#8000FF]' : 'border-red-500 focus:border-red-500'
                                }`}
                              />
                            </div>
                            <Button 
                              size="sm" 
                              onClick={handleUsernameSave}
                              disabled={!username || !isUsernameValid || updateProfileMutation.isPending}
                              className="bg-[#8000FF] hover:bg-[#8000FF]/80 disabled:opacity-50"
                            >
                              {updateProfileMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                          </div>
                          {usernameMessage && (
                            <p className={`text-xs ${isUsernameValid ? 'text-green-400' : 'text-red-400'}`}>
                              {usernameMessage}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            Username must be 3-20 characters and can only contain letters, numbers, and underscores
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-[#8000FF]/20" />

                      {/* Account Info */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Account Type:</span>
                          <Badge className="bg-[#8000FF]/20 text-[#8000FF]">
                            {profileUser.id?.startsWith('wallet_') ? 'Wallet Login' : 'X Login'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Account Created:</span>
                          <span className="text-white text-sm">
                            {new Date(profileUser.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <Separator className="bg-[#8000FF]/20" />

                      <div className="space-y-3">
                        <h4 className="text-white font-medium">Verification Status</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">X Verified:</span>
                            {profileUser.twitterId ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Wallet Verified:</span>
                            {profileUser.walletAddress ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Vouch User Tab */}
            {!viewingOwnProfile && (
              <TabsContent value="vouch-user" className="space-y-6">
                <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Vouch {getUserDisplayName()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VouchForm preselectedUserId={profileUser.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}