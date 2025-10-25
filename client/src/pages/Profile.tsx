import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  User, 
  Trophy, 
  Target, 
  Calendar, 
  Star,
  Edit2,
  Crown,
  Camera,
  Edit3,
  Check,
  X,
  Heart,
  Wallet,
  ExternalLink,
  Sparkles,
  Zap,
  Brain
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
  const [twitterUsername, setTwitterUsername] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Get user ID from URL
  const urlPath = window.location.pathname;
  const urlSegments = urlPath.split('/').filter(segment => segment.length > 0);
  const urlUserId = urlSegments.length > 1 ? urlSegments[1] : '';
  const currentUser = user as any;
  
  // Check if viewing own profile (either /profile or /profile/currentUserId)
  const viewingOwnProfile = urlSegments.length === 1 || urlUserId === currentUser?.id || urlUserId === 'profile';
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

  // Initialize form states when profile user data loads
  useEffect(() => {
    if (userData && viewingOwnProfile) {
      setUsername(userData.username || userData.firstName || "");
      setTwitterUsername(userData.twitterUsername || "");
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
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-cyan-950 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800 rounded-3xl flex items-center justify-center border border-cyan-400/30 shadow-2xl shadow-cyan-500/50">
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-cyan-950">
        <Navigation />
        <main className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-48 bg-blue-800/20 rounded-3xl backdrop-blur-xl border border-cyan-500/20"></div>
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="h-96 bg-blue-800/20 rounded-3xl backdrop-blur-xl border border-cyan-500/20"></div>
                <div className="h-96 bg-blue-800/20 rounded-3xl backdrop-blur-xl border border-blue-500/20"></div>
                <div className="h-96 bg-cyan-800/20 rounded-3xl backdrop-blur-xl border border-cyan-500/20"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-cyan-950">
        <Navigation />
        <main className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/30 shadow-2xl">
              <div className="text-center">
                <User className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-white mb-2">User Not Found</h2>
                <p className="text-white/60 mb-6">The profile you're looking for doesn't exist or has been removed.</p>
                <Button 
                  onClick={() => window.location.href = "/"}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const profileUser = userData;
  const battleStats = viewingOwnProfile ? { total: 0, won: 0, lost: 0 } : (profileData as any)?.battleStats || { total: 0, won: 0, lost: 0 };
  const vouchStats = viewingOwnProfile ? { received: 0, given: 0 } : (profileData as any)?.vouchStats || { received: 0, given: 0 };

  // Get dreamz level info
  const currentAuraLevel = auraLevels?.find((level: any) => 
    profileUser?.dreamzPoints >= level.minPoints && 
    profileUser?.dreamzPoints <= level.maxPoints
  ) || auraLevels?.[0];

  const nextAuraLevel = auraLevels?.find((level: any) => 
    level.minPoints > (profileUser?.dreamzPoints || 0)
  );

  const progressToNext = nextAuraLevel ? 
    Math.min(100, ((profileUser?.dreamzPoints || 0) - (currentAuraLevel?.minPoints || 0)) / 
    ((nextAuraLevel.minPoints - (currentAuraLevel?.minPoints || 0)) / 100)) : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-cyan-950">
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-cyan-600/10 rounded-full blur-2xl animate-bounce-slow"></div>
      </div>
      
      <Navigation />
      <main className="relative pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/30 shadow-2xl mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800 rounded-3xl flex items-center justify-center relative overflow-hidden border border-cyan-400/30 shadow-2xl shadow-cyan-500/50">
                  {profileUser?.profileImageUrl ? (
                    <img 
                      src={profileUser.profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                  {viewingOwnProfile && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 p-0 border-2 border-white/20"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                    {profileUser?.username || profileUser?.firstName || "Anonymous User"}
                  </h1>
                  {currentAuraLevel && (
                    <Badge 
                      className="text-white border-0 font-black px-3 py-1"
                      style={{ 
                        background: `linear-gradient(135deg, ${currentAuraLevel.color}, ${currentAuraLevel.color}80)` 
                      }}
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      {currentAuraLevel.name}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-6 text-white/80 mb-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold">{profileUser?.dreamzPoints || 0} Dreamz Points</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <span className="font-bold">{profileUser?.currentStreak || 0} Day Streak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold">{Number((profileUser as any)?.totalUsdtEarned || 0).toFixed(4)} USDC Earned</span>
                  </div>
                </div>

                {/* Social Connections */}
                {(profileUser?.walletAddress || profileUser?.twitterUsername) && (
                  <div className="flex flex-wrap gap-3">
                    {profileUser?.walletAddress && (
                      <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-cyan-500/30">
                        <Wallet className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-white font-mono">
                          {profileUser.walletAddress.slice(0, 6)}...{profileUser.walletAddress.slice(-4)}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(profileUser.walletAddress)}
                          className="ml-1 p-1 hover:bg-cyan-500/20 rounded-lg transition-colors"
                          title="Copy wallet address"
                        >
                          <ExternalLink className="w-3 h-3 text-white/60" />
                        </button>
                      </div>
                    )}
                    
                    {profileUser?.twitterUsername && (
                      <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-blue-500/30">
                        <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span className="text-sm text-white">@{profileUser.twitterUsername}</span>
                        <a
                          href={`https://x.com/${profileUser.twitterUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 p-1 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="View X profile"
                        >
                          <ExternalLink className="w-3 h-3 text-white/60" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Dreamz Level Progress */}
            <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-xl rounded-3xl p-6 border border-cyan-500/30 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white">Dreamz Level</h3>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                  {currentAuraLevel?.name || "Unknown"}
                </div>
                <div className="text-white/60 text-sm">
                  {profileUser?.dreamzPoints || 0} / ∞ Dreamz Points
                </div>
              </div>
              
              <div className="w-full bg-black/30 rounded-full h-4 mb-4 border border-cyan-500/20">
                <div 
                  className="bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-600 h-4 rounded-full transition-all duration-500 shadow-lg shadow-cyan-500/50"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
              
              {nextAuraLevel && (
                <div className="text-center text-sm text-white/60">
                  {nextAuraLevel.minPoints - (profileUser?.dreamzPoints || 0)} points to {nextAuraLevel.name}
                </div>
              )}
            </div>

            {/* Dream Duel Stats */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/30 backdrop-blur-xl rounded-3xl p-6 border border-blue-500/30 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white">Dream Duel Stats</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-3xl font-black text-white">{battleStats?.total || 0}</div>
                  <div className="text-white/60 text-sm">Total</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-green-400">{battleStats?.won || 0}</div>
                  <div className="text-white/60 text-sm">Won</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-red-400">{battleStats?.lost || 0}</div>
                  <div className="text-white/60 text-sm">Lost</div>
                </div>
              </div>
              
              {battleStats?.total > 0 && (
                <div className="text-center">
                  <div className="text-xl font-black text-blue-400">
                    {Math.round((battleStats.won / battleStats.total) * 100)}% Win Rate
                  </div>
                </div>
              )}
            </div>

            {/* Vouch Stats */}
            <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 backdrop-blur-xl rounded-3xl p-6 border border-cyan-500/30 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white">Vouch Statistics</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center mb-4">
                <div>
                  <div className="text-2xl font-black text-white">{Number((profileUser as any)?.totalUsdtEarned || 0).toFixed(4)} USDC</div>
                  <div className="text-white/60 text-sm">Received</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{Number((profileUser as any)?.totalVouchesReceived || 0).toFixed(0)}</div>
                  <div className="text-white/60 text-sm">Vouches</div>
                </div>
              </div>
              
              <div className="text-center text-sm text-white/60">
                USDC vouching activity and community support
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
