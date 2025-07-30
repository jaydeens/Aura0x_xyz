import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import ModernNavigation from "@/components/ModernNavigation";
import { 
  User, 
  Trophy, 
  Target, 
  Calendar, 
  Star,
  Edit3,
  Crown,
  Check,
  X,
  Heart,
  Wallet,
  ExternalLink,
  Flame,
  Swords,
  Award,
  TrendingUp
} from "lucide-react";

export default function ModernProfile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  // Form states
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [usernameMessage, setUsernameMessage] = useState("");
  
  // Get user ID from URL
  const urlPath = window.location.pathname;
  const urlSegments = urlPath.split('/').filter(segment => segment.length > 0);
  const urlUserId = urlSegments.length > 1 ? urlSegments[1] : '';
  const currentUser = user as any;
  
  // Check if viewing own profile
  const viewingOwnProfile = urlSegments.length === 1 || urlUserId === currentUser?.id || urlUserId === 'profile';
  const targetUserId = viewingOwnProfile ? currentUser?.id : urlUserId;

  // Fetch profile data only if viewing another user's profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/users", targetUserId],
    enabled: !!targetUserId && isAuthenticated && !viewingOwnProfile,
  });

  // Use current user data for own profile, or fetched data for others
  const userData = viewingOwnProfile ? currentUser : (profileData as any)?.user;
  
  // Fetch user battles
  const { data: userBattles = [] } = useQuery({
    queryKey: ["/api/battles/user", targetUserId],
    enabled: !!targetUserId && isAuthenticated,
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ["/api/users/stats", targetUserId],
    enabled: !!targetUserId && isAuthenticated,
  });

  // Username validation
  const checkUsernameAvailability = async (newUsername: string) => {
    if (!newUsername || newUsername.length < 3) {
      setIsUsernameValid(false);
      setUsernameMessage("Username must be at least 3 characters long");
      return;
    }

    if (newUsername === currentUser?.username) {
      setIsUsernameValid(true);
      setUsernameMessage("This is your current username");
      return;
    }

    try {
      const response = await fetch(`/api/users/check-username?username=${encodeURIComponent(newUsername)}`);
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
      setUsernameMessage("Error checking username availability");
    }
  };

  // Update username mutation
  const updateUsernameMutation = useMutation({
    mutationFn: (newUsername: string) => 
      fetch('/api/users/update-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditingUsername(false);
      toast({
        title: "Username Updated",
        description: "Your username has been updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update username",
      });
    },
  });

  // Initialize username when editing
  const handleUsernameEdit = () => {
    setUsername(currentUser?.username || '');
    setIsEditingUsername(true);
  };

  const handleUsernameSubmit = () => {
    if (isUsernameValid && username.trim()) {
      updateUsernameMutation.mutate(username.trim());
    }
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading]);

  // Loading state
  if (isLoading || (!viewingOwnProfile && profileLoading)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-black">
        <ModernNavigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-12 text-center">
              <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">User Not Found</h3>
              <p className="text-gray-400">The user you're looking for doesn't exist</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const level = Math.floor((userData.auraPoints || 0) / 100) + 1;
  const progress = ((userData.auraPoints || 0) % 100);

  return (
    <div className="min-h-screen bg-black">
      <ModernNavigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <Card className="bg-gray-900/50 border-gray-800 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                {level >= 10 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Crown className="w-4 h-4 text-black" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div>
                    {viewingOwnProfile && isEditingUsername ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            checkUsernameAvailability(e.target.value);
                          }}
                          className="bg-gray-800 border-gray-700 text-white"
                          placeholder="Enter username"
                        />
                        <Button
                          onClick={handleUsernameSubmit}
                          disabled={!isUsernameValid || updateUsernameMutation.isPending}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setIsEditingUsername(false)}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <h1 className="text-3xl font-bold text-white">
                          {userData.username || userData.twitterDisplayName || `User ${userData.id?.slice(-4)}`}
                        </h1>
                        {viewingOwnProfile && (
                          <Button
                            onClick={handleUsernameEdit}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                    {isEditingUsername && usernameMessage && (
                      <p className={`text-sm mt-1 ${isUsernameValid ? 'text-green-400' : 'text-red-400'}`}>
                        {usernameMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    Level {level}
                  </Badge>
                  <div className="flex items-center space-x-1 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(userData.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  {userData.walletAddress && (
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <Wallet className="w-4 h-4" />
                      <span>{userData.walletAddress.slice(0, 6)}...{userData.walletAddress.slice(-4)}</span>
                    </div>
                  )}
                </div>

                {/* Level Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress to Level {level + 1}</span>
                    <span className="text-white">{progress}/100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Aura</p>
                  <p className="text-2xl font-bold text-white">{userData.auraPoints || 0}</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Flame className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Battles Won</p>
                  <p className="text-2xl font-bold text-white">{userData.totalBattlesWon || 0}</p>
                </div>
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Current Streak</p>
                  <p className="text-2xl font-bold text-white">{userData.currentStreak || 0}</p>
                </div>
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Max Streak</p>
                  <p className="text-2xl font-bold text-white">{userData.maxStreak || 0}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Tabs */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="activity" className="data-[state=active]:bg-gray-800">
              Activity
            </TabsTrigger>
            <TabsTrigger value="battles" className="data-[state=active]:bg-gray-800">
              Battles ({Array.isArray(userBattles) ? userBattles.length : 0})
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-gray-800">
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sample activity items */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Won a battle</p>
                      <p className="text-sm text-gray-400">Earned 50 Aura points</p>
                    </div>
                    <span className="text-sm text-gray-500">2 days ago</span>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Completed daily lesson</p>
                      <p className="text-sm text-gray-400">Learned about DeFi protocols</p>
                    </div>
                    <span className="text-sm text-gray-500">3 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Battles Tab */}
          <TabsContent value="battles">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Swords className="w-5 h-5 mr-2 text-red-400" />
                  Battle History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(userBattles) && userBattles.length > 0 ? (
                  <div className="space-y-4">
                    {userBattles.map((battle: any) => (
                      <div key={battle.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-white font-medium">{battle.title}</p>
                          <p className="text-sm text-gray-400">{battle.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={battle.result === 'won' ? 'default' : battle.result === 'lost' ? 'destructive' : 'secondary'}
                            className="mb-1"
                          >
                            {battle.result || 'Pending'}
                          </Badge>
                          <p className="text-xs text-gray-500">{battle.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Battles Yet</h3>
                    <p className="text-gray-400 mb-6">Start battling to build your history</p>
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      Join a Battle
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-400" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sample achievements */}
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-green-500/20">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-green-400" />
                      </div>
                      <h4 className="text-white font-medium">First Victory</h4>
                    </div>
                    <p className="text-sm text-gray-400">Win your first battle</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-green-400 border-green-500/30">
                        Unlocked
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gray-600/10 rounded-lg flex items-center justify-center">
                        <Flame className="w-4 h-4 text-gray-500" />
                      </div>
                      <h4 className="text-gray-500 font-medium">Streak Master</h4>
                    </div>
                    <p className="text-sm text-gray-500">Maintain a 7-day streak</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-gray-500 border-gray-600">
                        Locked
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}