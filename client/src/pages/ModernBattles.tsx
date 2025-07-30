import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import ModernNavigation from "@/components/ModernNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Swords, 
  Trophy, 
  Users, 
  Clock,
  Target,
  Plus,
  Filter,
  X,
  Flame,
  ArrowRight,
  Calendar
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function ModernBattles() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("live");
  const [showCreateBattle, setShowCreateBattle] = useState(false);
  const [battleTitle, setBattleTitle] = useState("");
  const [battleDescription, setBattleDescription] = useState("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading]);

  // Fetch battles
  const { data: battles = [], isLoading: battlesLoading } = useQuery({
    queryKey: ["/api/battles"],
    enabled: isAuthenticated,
  });

  // Fetch battle stats
  const { data: stats } = useQuery({
    queryKey: ["/api/battle-stats"],
    enabled: isAuthenticated,
  });

  // Create battle mutation
  const createBattleMutation = useMutation({
    mutationFn: (battleData: any) => apiRequest("/api/battles", "POST", battleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/battles"] });
      setShowCreateBattle(false);
      setBattleTitle("");
      setBattleDescription("");
      toast({
        title: "Battle Created",
        description: "Your battle has been created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create battle",
      });
    },
  });

  // Loading state
  if (isLoading) {
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

  const liveBattles = Array.isArray(battles) ? battles.filter((b: any) => b.status === 'live') : [];
  const upcomingBattles = Array.isArray(battles) ? battles.filter((b: any) => b.status === 'upcoming') : [];
  const pastBattles = Array.isArray(battles) ? battles.filter((b: any) => b.status === 'completed') : [];

  const handleCreateBattle = () => {
    if (!battleTitle.trim() || !battleDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    createBattleMutation.mutate({
      title: battleTitle,
      description: battleDescription,
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <ModernNavigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Battles</h1>
            <p className="text-gray-400">Challenge others and prove your Web3 knowledge</p>
          </div>
          <Button 
            onClick={() => setShowCreateBattle(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Battle
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Live Battles</p>
                  <p className="text-2xl font-bold text-white">{liveBattles.length}</p>
                </div>
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Swords className="w-5 h-5 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Your Wins</p>
                  <p className="text-2xl font-bold text-white">{(user as any)?.totalBattlesWon || 0}</p>
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
                  <p className="text-sm text-gray-400">Total Participants</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalParticipants || 0}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Aura at Stake</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalAuraStaked || 0}</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Flame className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Battle Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="live" className="data-[state=active]:bg-gray-800">
              Live ({liveBattles.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-gray-800">
              Upcoming ({upcomingBattles.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="data-[state=active]:bg-gray-800">
              Past ({pastBattles.length})
            </TabsTrigger>
          </TabsList>

          {/* Live Battles */}
          <TabsContent value="live">
            <div className="space-y-4">
              {battlesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : liveBattles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveBattles.map((battle: any) => (
                    <Card key={battle.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20">
                                LIVE
                              </Badge>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{battle.timeRemaining || 'Starting soon'}</span>
                              </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{battle.title}</h3>
                            <p className="text-gray-400 text-sm mb-4">{battle.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>{battle.participantCount || 0} participants</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Flame className="w-4 h-4 text-orange-400" />
                                  <span>{battle.auraReward || 0} Aura</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          Join Battle <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-12 text-center">
                    <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Live Battles</h3>
                    <p className="text-gray-400 mb-6">There are no battles happening right now</p>
                    <Button 
                      onClick={() => setShowCreateBattle(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Create the First Battle
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Upcoming Battles */}
          <TabsContent value="upcoming">
            <div className="space-y-4">
              {upcomingBattles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingBattles.map((battle: any) => (
                    <Card key={battle.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                                UPCOMING
                              </Badge>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{battle.scheduledTime || 'TBD'}</span>
                              </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{battle.title}</h3>
                            <p className="text-gray-400 text-sm mb-4">{battle.description}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
                          Set Reminder
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Upcoming Battles</h3>
                    <p className="text-gray-400">No battles are scheduled at the moment</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Past Battles */}
          <TabsContent value="past">
            <div className="space-y-4">
              {pastBattles.length > 0 ? (
                <div className="space-y-4">
                  {pastBattles.map((battle: any) => (
                    <Card key={battle.id} className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="secondary" className="bg-gray-600/10 text-gray-400">
                                COMPLETED
                              </Badge>
                              <span className="text-xs text-gray-500">{battle.completedDate}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">{battle.title}</h3>
                            <p className="text-gray-400 text-sm">{battle.winner ? `Won by ${battle.winner}` : 'No winner'}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                            View Results
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Past Battles</h3>
                    <p className="text-gray-400">Your battle history will appear here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Battle Dialog */}
      <Dialog open={showCreateBattle} onOpenChange={setShowCreateBattle}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New Battle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-gray-300">Battle Title</Label>
              <Input
                id="title"
                value={battleTitle}
                onChange={(e) => setBattleTitle(e.target.value)}
                placeholder="Enter battle title..."
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={battleDescription}
                onChange={(e) => setBattleDescription(e.target.value)}
                placeholder="Describe your battle..."
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="ghost" onClick={() => setShowCreateBattle(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateBattle}
                disabled={createBattleMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {createBattleMutation.isPending ? "Creating..." : "Create Battle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}