import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import BattleCard from "@/components/BattleCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sword, Clock, Trophy, Crown, Zap, Target } from "lucide-react";

export default function Battles() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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

  const { data: activeBattles, isLoading: activeBattlesLoading } = useQuery({
    queryKey: ["/api/battles", "active"],
    retry: false,
  });

  const { data: pendingBattles, isLoading: pendingBattlesLoading } = useQuery({
    queryKey: ["/api/battles", "pending"],
    retry: false,
  });

  const { data: completedBattles, isLoading: completedBattlesLoading } = useQuery({
    queryKey: ["/api/battles", "completed"],
    retry: false,
  });

  const { data: userBattles, isLoading: userBattlesLoading } = useQuery({
    queryKey: ["/api/battles/user", user?.id],
    enabled: !!user?.id,
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-br from-[#8000FF] to-[#9933FF] rounded-2xl flex items-center justify-center">
            <Sword className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B]">
      <Navigation />
      
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[#8000FF] to-[#9933FF] bg-clip-text text-transparent">
              Aura Battles
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Challenge other KOLs to epic 1v1 battles and stake your Aura Points for glory
            </p>
          </div>

          {/* Featured Live Battle */}
          {activeBattles && activeBattles.length > 0 && (
            <Card className="bg-gradient-to-r from-[#1A1A1B] to-[#8000FF]/5 border-[#8000FF]/30 mb-8">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Sword className="w-6 h-6 mr-2 text-[#8000FF]" />
                    Featured Battle
                  </h2>
                  <Badge className="bg-red-500/20 text-red-400 animate-pulse">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                    LIVE
                  </Badge>
                </div>
                
                <BattleCard battle={activeBattles[0]} featured={true} />
              </CardContent>
            </Card>
          )}

          {/* Battle Tabs */}
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-[#1A1A1B] border border-[#8000FF]/20">
              <TabsTrigger value="active" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                <Clock className="w-4 h-4 mr-2" />
                Active ({activeBattles?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
                <Target className="w-4 h-4 mr-2" />
                Pending ({pendingBattles?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black">
                <Trophy className="w-4 h-4 mr-2" />
                Completed ({completedBattles?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="mine" className="data-[state=active]:bg-[#9933FF] data-[state=active]:text-white">
                <Crown className="w-4 h-4 mr-2" />
                My Battles ({userBattles?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Active Battles */}
            <TabsContent value="active" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Active Battles</h3>
                <Button 
                  className="bg-gradient-to-r from-[#8000FF] to-[#9933FF] hover:from-[#6B00E6] hover:to-[#8000FF] text-white"
                  onClick={() => {
                    toast({
                      title: "Create Battle",
                      description: "Battle creation feature coming soon!",
                    });
                  }}
                >
                  <Sword className="w-4 h-4 mr-2" />
                  Create Battle
                </Button>
              </div>

              {activeBattlesLoading ? (
                <div className="grid gap-6">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="bg-[#1A1A1B] border-[#8000FF]/20 animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-32 bg-[#0A0A0B] rounded-lg"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : activeBattles && activeBattles.length > 0 ? (
                <div className="grid gap-6">
                  {activeBattles.map((battle: any) => (
                    <BattleCard key={battle.id} battle={battle} />
                  ))}
                </div>
              ) : (
                <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                  <CardContent className="p-12 text-center">
                    <Sword className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      No Active Battles
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Be the first to start an epic Aura Battle!
                    </p>
                    <Button 
                      className="bg-gradient-to-r from-[#8000FF] to-[#9933FF] hover:from-[#6B00E6] hover:to-[#8000FF] text-white"
                      onClick={() => {
                        toast({
                          title: "Create Battle",
                          description: "Battle creation feature coming soon!",
                        });
                      }}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Challenge Someone
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Pending Battles */}
            <TabsContent value="pending" className="space-y-6">
              <h3 className="text-2xl font-bold text-white">Pending Battles</h3>

              {pendingBattlesLoading ? (
                <div className="grid gap-6">
                  {[1, 2].map(i => (
                    <Card key={i} className="bg-[#1A1A1B] border-[#FFD700]/20 animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-24 bg-[#0A0A0B] rounded-lg"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : pendingBattles && pendingBattles.length > 0 ? (
                <div className="grid gap-6">
                  {pendingBattles.map((battle: any) => (
                    <BattleCard key={battle.id} battle={battle} />
                  ))}
                </div>
              ) : (
                <Card className="bg-[#1A1A1B] border-[#FFD700]/20">
                  <CardContent className="p-12 text-center">
                    <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      No Pending Battles
                    </h3>
                    <p className="text-gray-500">
                      All battles are either active or completed
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Completed Battles */}
            <TabsContent value="completed" className="space-y-6">
              <h3 className="text-2xl font-bold text-white">Battle History</h3>

              {completedBattlesLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="bg-[#1A1A1B] border-[#00FF88]/20 animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-16 bg-[#0A0A0B] rounded-lg"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : completedBattles && completedBattles.length > 0 ? (
                <div className="grid gap-4">
                  {completedBattles.map((battle: any) => (
                    <Card key={battle.id} className="bg-[#1A1A1B] border-[#00FF88]/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-[#00FF88]/20 rounded-full flex items-center justify-center">
                              <Trophy className="w-5 h-5 text-[#00FF88]" />
                            </div>
                            <div>
                              <div className="font-semibold text-white">
                                Battle #{battle.id.slice(0, 8)}
                              </div>
                              <div className="text-sm text-gray-400">
                                Stakes: {battle.challengerStake + battle.opponentStake} Aura
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-[#00FF88]/20 text-[#00FF88]">
                              Completed
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(battle.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-[#1A1A1B] border-[#00FF88]/20">
                  <CardContent className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      No Completed Battles
                    </h3>
                    <p className="text-gray-500">
                      Battle history will appear here once battles are finished
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* My Battles */}
            <TabsContent value="mine" className="space-y-6">
              <h3 className="text-2xl font-bold text-white">My Battle History</h3>

              {userBattlesLoading ? (
                <div className="grid gap-4">
                  {[1, 2].map(i => (
                    <Card key={i} className="bg-[#1A1A1B] border-[#9933FF]/20 animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-16 bg-[#0A0A0B] rounded-lg"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : userBattles && userBattles.length > 0 ? (
                <div className="grid gap-4">
                  {userBattles.map((battle: any) => (
                    <BattleCard key={battle.id} battle={battle} showResult={true} />
                  ))}
                </div>
              ) : (
                <Card className="bg-[#1A1A1B] border-[#9933FF]/20">
                  <CardContent className="p-12 text-center">
                    <Crown className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      No Battles Yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Start your first battle to build your reputation!
                    </p>
                    <Button 
                      className="bg-gradient-to-r from-[#9933FF] to-[#8000FF] hover:from-[#9933FF]/80 hover:to-[#8000FF]/80 text-white"
                      onClick={() => {
                        toast({
                          title: "Create Battle",
                          description: "Battle creation feature coming soon!",
                        });
                      }}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Start First Battle
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
