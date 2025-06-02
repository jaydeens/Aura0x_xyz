import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { 
  User, 
  Trophy, 
  Target, 
  Calendar, 
  Star,
  Crown,
  Camera,
  Edit3,
  Check,
  X,
  Heart
} from "lucide-react";

// Helper function to check unauthorized errors
function isUnauthorizedError(error: any): boolean {
  return error?.message?.includes('Unauthorized') || 
         error?.message?.includes('401') ||
         (error?.cause && error.cause.message?.includes('Unauthorized'));
}

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

  // Initialize username state when profile user data loads
  useEffect(() => {
    if (userData && viewingOwnProfile) {
      setUsername(userData.username || userData.firstName || "");
    }
  }, [userData, viewingOwnProfile]);

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
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="h-96 bg-[#1A1A1B] rounded-2xl"></div>
                <div className="h-96 bg-[#1A1A1B] rounded-2xl"></div>
                <div className="h-96 bg-[#1A1A1B] rounded-2xl"></div>
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
              <CardContent className="p-8 text-center">
                <User className="w-16 h-16 text-[#666] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
                <p className="text-[#999] mb-6">The profile you're looking for doesn't exist or has been removed.</p>
                <Button 
                  onClick={() => window.location.href = "/"}
                  className="bg-gradient-to-r from-[#8000FF] to-[#9933FF] hover:from-[#7000E6] hover:to-[#8829E6] text-white"
                >
                  Go Home
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
    if (!username || !isUsernameValid) {
      toast({
        title: "Invalid Username",
        description: "Please enter a valid username",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({ username });
  };

  // Get aura level info
  const currentAuraLevel = auraLevels?.find((level: any) => 
    profileUser?.auraPoints >= level.minPoints && 
    profileUser?.auraPoints <= level.maxPoints
  ) || auraLevels?.[0];

  const nextAuraLevel = auraLevels?.find((level: any) => 
    level.minPoints > (profileUser?.auraPoints || 0)
  );

  const progressToNext = nextAuraLevel ? 
    Math.min(100, ((profileUser?.auraPoints || 0) - (currentAuraLevel?.minPoints || 0)) / 
    ((nextAuraLevel.minPoints - (currentAuraLevel?.minPoints || 0)) / 100)) : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B]">
      <Navigation />
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <Card className="bg-gradient-to-r from-[#1A1A1B] to-[#8000FF]/5 border-[#8000FF]/20 mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#8000FF] to-[#9933FF] rounded-2xl flex items-center justify-center relative">
                    {profileUser?.profileImageUrl ? (
                      <img 
                        src={profileUser.profileImageUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                    {viewingOwnProfile && (
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#8000FF] hover:bg-[#7000E6] p-0"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-white">
                      {profileUser?.username || profileUser?.firstName || "Anonymous User"}
                    </h1>
                    {currentAuraLevel && (
                      <Badge 
                        className="text-white border-0"
                        style={{ 
                          background: `linear-gradient(135deg, ${currentAuraLevel.color}, ${currentAuraLevel.color}80)` 
                        }}
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        {currentAuraLevel.name}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-[#999] mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#8000FF]" />
                      <span>{profileUser?.auraPoints || 0} Aura Points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#8000FF]" />
                      <span>{profileUser?.currentStreak || 0} Day Streak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#8000FF]" />
                      <span>{battleStats?.won || 0} Battles Won</span>
                    </div>
                  </div>

                  {viewingOwnProfile && (
                    <div className="flex items-center gap-2">
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={() => validateUsername(username)}
                        placeholder="Enter username"
                        className="max-w-xs bg-[#0A0A0B] border-[#8000FF]/20 text-white"
                      />
                      <Button
                        onClick={handleUsernameSave}
                        disabled={!isUsernameValid || updateProfileMutation.isPending}
                        className="bg-[#8000FF] hover:bg-[#7000E6] text-white"
                        size="sm"
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {usernameMessage && (
                    <p className={`text-sm mt-2 ${isUsernameValid ? 'text-green-400' : 'text-red-400'}`}>
                      {usernameMessage}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Aura Progress */}
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#8000FF]" />
                  Aura Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {currentAuraLevel?.name || 'Unknown'}
                  </div>
                  <div className="text-[#999] text-sm">
                    {profileUser?.auraPoints || 0} / {nextAuraLevel?.minPoints || '∞'} Aura Points
                  </div>
                </div>
                
                <div className="w-full bg-[#0A0A0B] rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-[#8000FF] to-[#9933FF] transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
                
                {nextAuraLevel && (
                  <div className="text-center text-sm text-[#999]">
                    {nextAuraLevel.minPoints - (profileUser?.auraPoints || 0)} points to {nextAuraLevel.name}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Battle Stats */}
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#8000FF]" />
                  Battle Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{battleStats?.total || 0}</div>
                    <div className="text-[#999] text-sm">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{battleStats?.won || 0}</div>
                    <div className="text-[#999] text-sm">Won</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">{battleStats?.lost || 0}</div>
                    <div className="text-[#999] text-sm">Lost</div>
                  </div>
                </div>
                
                {battleStats?.total > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[#8000FF]">
                      {Math.round((battleStats.won / battleStats.total) * 100)}% Win Rate
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vouch Stats */}
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#8000FF]" />
                  Vouch Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{vouchStats?.received || 0}</div>
                    <div className="text-[#999] text-sm">Received</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{vouchStats?.given || 0}</div>
                    <div className="text-[#999] text-sm">Given</div>
                  </div>
                </div>
                
                <div className="text-center text-sm text-[#999]">
                  Community reputation through vouching
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}