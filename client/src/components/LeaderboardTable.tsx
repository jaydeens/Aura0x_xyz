import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Crown, Trophy, Star, TrendingUp, Zap, User } from "lucide-react";
import { Link } from "wouter";

interface LeaderboardUser {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImageUrl?: string;
  auraPoints: number;
  currentStreak: number;
  totalBattlesWon: number;
  totalBattlesLost: number;

  totalVouchesReceived: string;
  walletAge: number;
}

interface LeaderboardTableProps {
  users: LeaderboardUser[];
  showTopPodium?: boolean;
}

export default function LeaderboardTable({ users, showTopPodium = true }: LeaderboardTableProps) {
  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { name: "Aura Vader", color: "#FFD700", icon: Crown };
    if (streak >= 15) return { name: "Grinder", color: "#00FF88", icon: Trophy };
    if (streak >= 5) return { name: "Attention Seeker", color: "#9933FF", icon: Star };
    return { name: "Clout Chaser", color: "#8000FF", icon: Zap };
  };

  const getUserDisplayName = (user: LeaderboardUser) => {
    return user.firstName || user.username || `User ${user.id.slice(0, 6)}`;
  };

  const getWinRate = (user: LeaderboardUser) => {
    const totalBattles = user.totalBattlesWon + user.totalBattlesLost;
    if (totalBattles === 0) return 0;
    return ((user.totalBattlesWon / totalBattles) * 100).toFixed(1);
  };



  const topThree = users.slice(0, 3);
  const remainingUsers = users.slice(3);

  return (
    <div className="space-y-8">
      {/* Top 3 Podium */}
      {showTopPodium && topThree.length > 0 && (
        <Card className="bg-gradient-to-r from-card to-primary/5 border-primary/20">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-center text-white mb-8">
              Top Aura Warriors
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="text-center order-2 md:order-1">
                  <Link href={`/profile/${topThree[1].id}`} className="block cursor-pointer hover:scale-105 transition-transform duration-300">
                    <div className="relative mx-auto w-20 h-20 mb-4">
                      <Avatar className="w-20 h-20 border-4 border-gray-400">
                        <AvatarImage src={topThree[1].profileImageUrl} />
                        <AvatarFallback className="bg-gray-400/20 text-gray-400">
                          <Star className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg text-white">
                      {getUserDisplayName(topThree[1])}
                    </h4>
                    <p className="text-accent font-semibold text-xl">
                      {topThree[1].auraPoints.toLocaleString()}
                    </p>
                    <div className="text-sm text-gray-400">
                      {topThree[1].totalBattlesWon} battles won
                    </div>
                  </Link>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="text-center order-1 md:order-2">
                  <Link href={`/profile/${topThree[0].id}`} className="block cursor-pointer hover:scale-105 transition-transform duration-300">
                    <div className="relative mx-auto w-28 h-28 mb-4">
                      <Avatar className="w-28 h-28 border-4 border-primary">
                        <AvatarImage src={topThree[0].profileImageUrl} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          <Crown className="w-10 h-10" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-primary/50">
                        <Crown className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(128,0,255,0.8)]" />
                      </div>
                    </div>
                    <h4 className="font-bold text-xl text-primary">
                      {getUserDisplayName(topThree[0])}
                    </h4>
                    <p className="text-primary font-bold text-2xl">
                      {topThree[0].auraPoints.toLocaleString()}
                    </p>
                    <div className="text-sm text-gray-300">
                      {topThree[0].totalBattlesWon} battles won
                    </div>
                    <Badge className="mt-2 bg-primary/20 text-primary border-primary/40">
                      AURA VADER
                    </Badge>
                  </Link>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="text-center order-3">
                  <Link href={`/profile/${topThree[2].id}`} className="block cursor-pointer hover:scale-105 transition-transform duration-300">
                    <div className="relative mx-auto w-20 h-20 mb-4">
                      <Avatar className="w-20 h-20 border-4 border-orange-600">
                        <AvatarImage src={topThree[2].profileImageUrl} />
                        <AvatarFallback className="bg-orange-600/20 text-orange-400">
                          <Trophy className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg text-white">
                      {getUserDisplayName(topThree[2])}
                    </h4>
                    <p className="text-orange-400 font-semibold text-xl">
                      {topThree[2].auraPoints.toLocaleString()}
                    </p>
                    <div className="text-sm text-gray-400">
                      {topThree[2].totalBattlesWon} battles won
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Leaderboard Table */}
      {remainingUsers.length > 0 && (
        <Card className="bg-card border-primary/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/20 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-medium">Rank</TableHead>
                    <TableHead className="text-gray-400 font-medium">User</TableHead>
                    <TableHead className="text-right text-gray-400 font-medium">Aura Points</TableHead>
                    <TableHead className="text-right text-gray-400 font-medium">Win Rate</TableHead>
                    <TableHead className="text-right text-gray-400 font-medium">Streak</TableHead>

                    <TableHead className="text-right text-gray-400 font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remainingUsers.map((user, index) => {
                    const rank = index + 4; // Starting from 4th place
                    const streakLevel = getStreakLevel(user.currentStreak);
                    const StreakIcon = streakLevel.icon;
                    
                    return (
                      <TableRow 
                        key={user.id} 
                        className="border-gray-700/50 hover:bg-primary/10 transition-all duration-300 cursor-pointer group"
                        onClick={() => window.location.href = `/profile/${user.id}`}
                      >
                        <TableCell>
                          <span className="font-semibold text-gray-300 group-hover:text-primary transition-colors">
                            #{rank}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10 border border-primary/20 group-hover:border-primary/50 transition-all duration-300">
                              <AvatarImage src={user.profileImageUrl} />
                              <AvatarFallback className="bg-primary/20 text-primary">
                                <User className="w-5 h-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-white group-hover:text-primary transition-colors">
                                {getUserDisplayName(user)}
                              </div>
                              <Badge 
                                variant="outline" 
                                className="text-xs transition-all duration-300"
                                style={{ 
                                  color: streakLevel.color, 
                                  borderColor: `${streakLevel.color}40`,
                                  backgroundColor: `${streakLevel.color}20`
                                }}
                              >
                                <StreakIcon className="w-3 h-3 mr-1" />
                                {streakLevel.name}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <span className="font-semibold text-primary text-lg">
                            {user.auraPoints.toLocaleString()}
                          </span>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <div className="text-gray-300">
                            {getWinRate(user)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            W:{user.totalBattlesWon} L:{user.totalBattlesLost}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <Badge 
                            variant="outline"
                            style={{ 
                              color: streakLevel.color, 
                              borderColor: `${streakLevel.color}40`,
                              backgroundColor: `${streakLevel.color}20`
                            }}
                          >
                            {user.currentStreak} days
                          </Badge>
                        </TableCell>
                        

                        
                        <TableCell className="text-right">
                          <Link href={`/profile/${user.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-primary/40 text-primary hover:bg-primary hover:text-white"
                            >
                              View Profile
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {users.length === 0 && (
        <Card className="bg-card border-primary/20">
          <CardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No Rankings Available
            </h3>
            <p className="text-gray-500">
              The leaderboard will populate as users earn Aura Points
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
