import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VouchModal from "@/components/VouchModal";
import type { User } from "@shared/schema";
import { 
  User as UserIcon, 
  TrendingUp, 
  Crown, 
  Trophy, 
  Star,
  Heart,
  Wallet
} from "lucide-react";

interface UserProfileProps {
  userId: string;
}

export default function UserProfile({ userId }: UserProfileProps) {
  const [isVouchModalOpen, setIsVouchModalOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const { data: profileUser, isLoading: profileLoading, error: profileError } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    retry: false,
  });

  const { data: dreamzLevels } = useQuery<any[]>({
    queryKey: ["/api/dreamz-levels"],
    retry: false,
  });

  const { data: vouchStats } = useQuery<any>({
    queryKey: [`/api/vouch/stats/${userId}`],
    retry: false,
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "Aura Vader": return <Crown className="w-4 h-4" />;
      case "Grinder": return <Trophy className="w-4 h-4" />;
      case "Dedicated": return <Star className="w-4 h-4" />;
      case "Attention Seeker": return <TrendingUp className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Aura Vader": return "text-yellow-400";
      case "Grinder": return "text-green-400";
      case "Dedicated": return "text-emerald-400";
      case "Attention Seeker": return "text-purple-400";
      default: return "text-blue-400";
    }
  };

  const getUserLevel = (user: any) => {
    if (!user || !dreamzLevels || !Array.isArray(dreamzLevels)) return null;
    return dreamzLevels.find((level: any) => 
      (user.currentStreak || 0) >= level.minDays && 
      (level.maxDays === null || (user.currentStreak || 0) <= level.maxDays)
    ) || dreamzLevels[0];
  };

  const userLevel = getUserLevel(profileUser);

  // Handle loading state
  if (profileLoading) {
    return (
      <Card className="bg-black/40 border border-purple-500/20">
        <CardContent className="pt-6">
          <div className="text-center text-white/60">Loading user profile...</div>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (profileError || !profileUser) {
    return (
      <Card className="bg-black/40 border border-red-500/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">User Not Found</div>
            <div className="text-white/60">The user profile you're looking for doesn't exist or couldn't be loaded.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Simplified canVouch logic - just check if users are different and both have wallets
  const canVouch = currentUser && 
                  (currentUser as User).id !== userId && 
                  (currentUser as User).walletAddress && 
                  profileUser?.walletAddress;

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-purple-900/40 via-black/60 to-cyan-900/40 border border-cyan-500/20 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20 ring-2 ring-cyan-500/50">
              <AvatarImage src={profileUser.profileImageUrl || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-cyan-500 text-white text-2xl font-bold">
                {profileUser.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-white text-3xl font-bold mb-1">{profileUser.username || "Anonymous"}</h1>
              {userLevel && (
                <div className="flex items-center gap-2">
                  <span className={`${getLevelColor(userLevel.name)}`}>
                    {getLevelIcon(userLevel.name)}
                  </span>
                  <span className="text-cyan-300 font-medium">{userLevel.name}</span>
                </div>
              )}
            </div>
          </div>
          
          {canVouch && (
            <Button 
              onClick={() => setIsVouchModalOpen(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-6 py-6 text-lg rounded-xl"
              data-testid="button-open-vouch"
            >
              <Heart className="w-5 h-5 mr-2" />
              Vouch
            </Button>
          )}
        </div>

        {/* User Stats - Gradient Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Total Dreamz - Purple/Blue Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-purple-800/20 border border-purple-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{(profileUser as any).dreamzPoints || 0}</div>
              <div className="text-purple-200 text-sm font-medium">Total Dreamz</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* Streak Days - Blue Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-600/20 via-cyan-600/20 to-blue-800/20 border border-blue-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{profileUser.currentStreak || 0}</div>
              <div className="text-blue-200 text-sm font-medium">Streak Days</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* Vouches Received - Green Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-green-600/20 via-emerald-600/20 to-green-800/20 border border-green-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{vouchStats?.vouchesReceived || 0}</div>
              <div className="text-green-200 text-sm font-medium">Vouches Received</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* USDT Received - Gold/Yellow Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-yellow-600/20 via-amber-600/20 to-yellow-800/20 border border-yellow-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{Number((vouchStats as any)?.totalUsdcReceived || 0).toFixed(2)}</div>
              <div className="text-yellow-200 text-sm font-medium">USDT Received</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* Vouches Given - Pink/Rose Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-pink-600/20 via-rose-600/20 to-pink-800/20 border border-pink-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{vouchStats?.vouchesGiven || 0}</div>
              <div className="text-pink-200 text-sm font-medium">Vouches Given</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* USDT Given - Orange Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-orange-600/20 via-amber-600/20 to-orange-800/20 border border-orange-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{Number((vouchStats as any)?.totalUsdcGiven || 0).toFixed(2)}</div>
              <div className="text-orange-200 text-sm font-medium">USDT Given</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* Dreamz from Vouching - Cyan Gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-cyan-600/20 via-teal-600/20 to-cyan-800/20 border border-cyan-500/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-2">{vouchStats?.totalDreamzReceived || 0}</div>
              <div className="text-cyan-200 text-sm font-medium">Dreamz from Vouches</div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>

      {/* Wallet Status Card */}
      <div className="bg-gradient-to-br from-gray-900/60 via-black/60 to-gray-900/60 border border-gray-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-gray-300" />
            <span className="text-white text-lg font-medium">Wallet Status</span>
          </div>
          {profileUser.walletAddress ? (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-green-400 border-green-400 px-3 py-1">
                Connected
              </Badge>
              <span className="text-white/80 font-mono text-sm bg-black/30 px-3 py-1 rounded-lg">
                {profileUser.walletAddress.slice(0, 6)}...{profileUser.walletAddress.slice(-4)}
              </span>
            </div>
          ) : (
            <Badge variant="outline" className="text-red-400 border-red-400 px-3 py-1">
              Not Connected
            </Badge>
          )}
        </div>
      </div>

      {/* Vouching Notice */}
      {!canVouch && currentUser && (currentUser as User).id !== userId && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
          <p className="text-orange-300 text-sm">
            {!(currentUser as User).walletAddress && "You need to connect your wallet to vouch for users."}
            {!profileUser?.walletAddress && "This user needs to connect their wallet to receive vouches."}
          </p>
        </div>
      )}

      {/* VouchModal */}
      <VouchModal 
        open={isVouchModalOpen} 
        onOpenChange={setIsVouchModalOpen} 
        recipient={profileUser}
      />
    </div>
  );
}
