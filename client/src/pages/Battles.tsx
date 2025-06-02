import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import BattleCard from "@/components/BattleCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sword, 
  Trophy, 
  Users, 
  Zap, 
  Clock,
  Target,
  Plus,
  Filter
} from "lucide-react";

export default function Battles() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("live");

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

  const { data: battles, isLoading: battlesLoading } = useQuery({
    queryKey: ["/api/battles"],
    retry: false,
  });

  const { data: userBattles, isLoading: userBattlesLoading } = useQuery({
    queryKey: ["/api/battles/user"],
    retry: false,
  });

  const createBattleMutation = useMutation({
    mutationFn: async (battleData: any) => {
      await apiRequest("/api/battles", {
        method: "POST",
        body: JSON.stringify(battleData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Battle Created!",
        description: "Your battle challenge has been posted to the arena.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/battles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/battles/user"] });
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
        title: "Error",
        description: "Failed to create battle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getBattleStats = () => {
    if (!battles) return { total: 0, live: 0, completed: 0 };
    
    const total = battles.length;
    const live = battles.filter((b: any) => b.status === 'active').length;
    const completed = battles.filter((b: any) => b.status === 'completed').length;
    
    return { total, live, completed };
  };

  const stats = getBattleStats();

  const liveBattles = battles?.filter((b: any) => b.status === 'active') || [];
  const completedBattles = battles?.filter((b: any) => b.status === 'completed') || [];

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#2A2A2B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8000FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#2A2A2B]">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sword className="w-12 h-12 text-[#8000FF] mr-4" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-[#8000FF] to-[#9933FF] bg-clip-text text-transparent">
              Battle Arena
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Challenge other users in 1v1 battles, stake your reputation, and let the community decide the winner.
          </p>
        </div>

        {/* Battle Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Battles</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.total}
                  </p>
                </div>
                <Sword className="w-8 h-8 text-[#8000FF]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1B] border-[#00FF88]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Live Battles</p>
                  <p className="text-3xl font-bold text-[#00FF88]">
                    {stats.live}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-[#00FF88]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1B] border-[#FFD700]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Completed</p>
                  <p className="text-3xl font-bold text-[#FFD700]">
                    {stats.completed}
                  </p>
                </div>
                <Trophy className="w-8 h-8 text-[#FFD700]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Battle Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-[#1A1A1B] border border-[#8000FF]/20">
              <TabsTrigger value="live" className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black">
                <Zap className="w-4 h-4 mr-2" />
                Live Battles
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
                <Trophy className="w-4 h-4 mr-2" />
                Completed
              </TabsTrigger>
              <TabsTrigger value="my-battles" className="data-[state=active]:bg-[#8000FF] data-[state=active]:text-white">
                <Target className="w-4 h-4 mr-2" />
                My Battles
              </TabsTrigger>
            </TabsList>

            <Button 
              className="bg-[#8000FF] hover:bg-[#8000FF]/80 text-white"
              onClick={() => {
                // TODO: Open create battle modal
                toast({
                  title: "Coming Soon",
                  description: "Battle creation feature is being developed.",
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Battle
            </Button>
          </div>

          {/* Live Battles */}
          <TabsContent value="live" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Live Battles</h2>
              <Badge className="bg-[#00FF88]/20 text-[#00FF88]">
                {stats.live} Active
              </Badge>
            </div>

            {battlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-[#1A1A1B] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : liveBattles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveBattles.map((battle: any) => (
                  <BattleCard key={battle.id} battle={battle} />
                ))}
              </div>
            ) : (
              <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                <CardContent className="p-12 text-center">
                  <Sword className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Live Battles</h3>
                  <p className="text-gray-400 mb-6">
                    No battles are currently active. Be the first to create one!
                  </p>
                  <Button className="bg-[#8000FF] hover:bg-[#8000FF]/80">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Battle
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completed Battles */}
          <TabsContent value="completed" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Completed Battles</h2>
              <Badge className="bg-[#FFD700]/20 text-[#FFD700]">
                {stats.completed} Finished
              </Badge>
            </div>

            {battlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-[#1A1A1B] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : completedBattles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedBattles.map((battle: any) => (
                  <BattleCard key={battle.id} battle={battle} showResult={true} />
                ))}
              </div>
            ) : (
              <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Completed Battles</h3>
                  <p className="text-gray-400">
                    No battles have been completed yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Battles */}
          <TabsContent value="my-battles" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">My Battles</h2>
              <Badge className="bg-[#8000FF]/20 text-[#8000FF]">
                {userBattles?.length || 0} Total
              </Badge>
            </div>

            {userBattlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 bg-[#1A1A1B] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : userBattles && userBattles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userBattles.map((battle: any) => (
                  <BattleCard key={battle.id} battle={battle} showResult={battle.status === 'completed'} />
                ))}
              </div>
            ) : (
              <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Battles Yet</h3>
                  <p className="text-gray-400 mb-6">
                    You haven't participated in any battles yet. Start your journey!
                  </p>
                  <Button className="bg-[#8000FF] hover:bg-[#8000FF]/80">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Battle
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}