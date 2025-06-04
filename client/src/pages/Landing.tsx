import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Star, Users, BookOpen, Play, CheckCircle, TrendingUp, Award, Target } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function Landing() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch real-time platform statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['/api/leaderboard'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: activeBattles } = useQuery({
    queryKey: ['/api/battles'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // User is on landing page, this is expected
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleWatchDemo = () => {
    toast({
      title: "Demo Coming Soon",
      description: "Battle demos will be available once you join the platform!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                AURA
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#elite" className="text-muted-foreground hover:text-amber-600 transition-colors font-medium">Elite Features</a>
              <a href="#prestige" className="text-muted-foreground hover:text-amber-600 transition-colors font-medium">Prestige Ranks</a>
              <a href="#legends" className="text-muted-foreground hover:text-amber-600 transition-colors font-medium">Hall of Legends</a>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 font-semibold">
                INVITE ONLY
              </Badge>
              <Button onClick={handleLogin} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-8 py-2 shadow-lg">
                Claim Your Status
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-50 via-white to-amber-50/30 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-amber-100/30 to-yellow-100/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-2 text-sm font-bold tracking-wide">
                  🏆 ELITE STATUS PLATFORM
                </Badge>
                <h1 className="text-6xl lg:text-7xl font-black leading-tight">
                  Build Your
                  <span className="block bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                    LEGENDARY
                  </span>
                  <span className="block text-gray-900">Reputation</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Join the most exclusive community of high-achievers. Complete elite challenges, 
                  dominate leaderboards, and earn recognition that sets you apart from everyone else.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg px-12 py-4 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <Trophy className="w-6 h-6 mr-3" />
                  Claim Elite Status
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleWatchDemo}
                  size="lg"
                  className="border-2 border-amber-500 text-amber-700 hover:bg-amber-50 font-semibold text-lg px-8 py-4"
                >
                  <Play className="w-5 h-5 mr-2" />
                  See Elite Members
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{(stats as any)?.totalUsers || 0}</div>
                  <div className="text-sm text-gray-500 font-medium">Elite Members</div>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">98%</div>
                  <div className="text-sm text-gray-500 font-medium">Prestige Rate</div>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{(stats as any)?.activeBattles || 0}</div>
                  <div className="text-sm text-gray-500 font-medium">Live Battles</div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual Elements */}
            <div className="relative lg:h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-3xl transform rotate-6"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-amber-100">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Today's Elite Challenge</h3>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">LEGENDARY</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Master Advanced Strategies</div>
                        <div className="text-sm text-gray-500">+2,500 Prestige Points</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress to Legendary</span>
                        <span className="font-medium text-amber-600">87%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full" style={{width: '87%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Elite Features Section */}
      <section id="elite" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-6 py-3 text-sm font-bold tracking-wide mb-6">
              EXCLUSIVE MEMBER BENEFITS
            </Badge>
            <h2 className="text-5xl font-black mb-6 text-gray-900">
              Elite Status Unlocks
              <span className="block bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Legendary Features
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access premium challenges, exclusive rewards, and elite recognition that separates legends from the ordinary
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Elite Challenges */}
            <Card className="relative border-2 border-amber-200 bg-gradient-to-br from-white to-amber-50/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white px-4 py-2 text-xs font-bold">
                PREMIUM
              </div>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Elite Challenges</h3>
                <p className="text-gray-600 mb-6">Exclusive high-stakes challenges designed for top performers. Prove your superiority against other elite members.</p>
                
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="text-xs text-amber-700 font-semibold mb-2 uppercase tracking-wide">Prestige Rewards</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Prestige Points</span>
                      <span className="text-amber-600 font-bold">+2,500 PP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Elite Streak</span>
                      <span className="text-orange-600 font-bold">+1 Level</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legendary Status Tracking */}
            <Card className="relative border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-600 to-indigo-600 text-white px-4 py-2 text-xs font-bold">
                EXCLUSIVE
              </div>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Legendary Analytics</h3>
                <p className="text-gray-600 mb-6">Advanced performance metrics and prestige tracking reserved for elite members only.</p>
                
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="text-xs text-purple-700 font-semibold mb-2 uppercase tracking-wide">Elite Insights</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Prestige Rank</span>
                      <span className="text-purple-600 font-bold">Real-time</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Legend Badges</span>
                      <span className="text-indigo-600 font-bold">Unlockable</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Elite Community Access */}
            <Card className="relative border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-emerald-600 to-teal-600 text-white px-4 py-2 text-xs font-bold">
                VIP ACCESS
              </div>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Elite Circle</h3>
                <p className="text-gray-600 mb-6">Join the most exclusive community of high-achievers. Network with legends and industry leaders.</p>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-600" />
                    Private mastermind groups
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-600" />
                    Direct mentor access
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-600" />
                    Legendary status verification
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Legendary Battles */}
      <section id="prestige" className="py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-0 px-6 py-3 text-sm font-bold tracking-wide mb-6">
              🔥 LEGENDARY BATTLEGROUND
            </Badge>
            <h2 className="text-5xl font-black mb-6">
              Where Legends
              <span className="block bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                CLASH FOR GLORY
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              High-stakes battles where only the elite dare compete. Spectators bet real value while champions fight for ultimate prestige.
            </p>
          </div>

          {/* Active Battles Display */}
          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-2 border-amber-500/30 max-w-5xl mx-auto shadow-2xl backdrop-blur-sm">
            <CardContent className="p-10">
              {activeBattles && Array.isArray(activeBattles) && activeBattles.length > 0 ? (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-black text-white">LIVE LEGENDARY BATTLES</h3>
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 text-sm font-bold animate-pulse">
                      <div className="w-3 h-3 bg-white rounded-full mr-2 animate-ping"></div>
                      {activeBattles.length} EPIC CLASHES
                    </Badge>
                  </div>
                  {activeBattles.slice(0, 3).map((battle: any) => (
                    <div key={battle.id} className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-2xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="text-xl font-bold text-amber-400">{battle.challengerName || 'Elite Warrior'}</div>
                          <div className="text-center">
                            <div className="text-red-500 font-black text-lg">⚔️ VS ⚔️</div>
                            <div className="text-xs text-gray-400 font-semibold">LEGENDARY CLASH</div>
                          </div>
                          <div className="text-xl font-bold text-amber-400">{battle.opponentName || 'Elite Champion'}</div>
                        </div>
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 text-lg font-bold">
                          🏆 {battle.stakeAmount || 0} PRESTIGE
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-amber-400" />
                  </div>
                  <h3 className="text-3xl font-black mb-6 text-white">THE ARENA AWAITS</h3>
                  <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto">No battles worthy of legends are happening right now. Will you be the first to step into the arena?</p>
                  <Button 
                    onClick={handleLogin}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xl px-12 py-4 shadow-2xl hover:shadow-amber-500/25 transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <Trophy className="w-6 h-6 mr-3" />
                    ENTER THE ARENA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      {/* Hall of Legends */}
      <section id="legends" className="py-32 bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0 px-6 py-3 text-sm font-bold tracking-wide mb-6">
              👑 HALL OF LEGENDS
            </Badge>
            <h2 className="text-5xl font-black mb-6 text-gray-900">
              The Most
              <span className="block bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                LEGENDARY
              </span>
              <span className="block text-gray-900">Elite Members</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Only the most exceptional individuals earn their place in our Hall of Legends. Will your name be inscribed among the elite?
            </p>
          </div>

          <Card className="bg-white border-2 border-amber-200 max-w-5xl mx-auto shadow-2xl">
            <CardContent className="p-10">
              {leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                <div className="space-y-6">
                  <div className="text-center mb-10">
                    <h3 className="text-3xl font-black mb-3 text-gray-900">LEGENDARY RANKINGS</h3>
                    <p className="text-gray-600 text-lg">Ranked by prestige points, elite challenges conquered, and legendary status achieved</p>
                  </div>
                  {leaderboard.slice(0, 5).map((user: any, index: number) => {
                    const isTopThree = index < 3;
                    const rankColors = ['from-yellow-400 to-amber-500', 'from-gray-400 to-gray-500', 'from-amber-600 to-orange-600'];
                    const rankIcons = ['👑', '🥈', '🥉'];
                    
                    return (
                      <div key={user.id} className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                        isTopThree 
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 shadow-lg' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-6">
                          <div className={`flex items-center justify-center w-16 h-16 rounded-2xl font-black text-white text-xl shadow-lg ${
                            isTopThree 
                              ? `bg-gradient-to-br ${rankColors[index]}` 
                              : 'bg-gradient-to-br from-gray-500 to-gray-600'
                          }`}>
                            {isTopThree ? rankIcons[index] : index + 1}
                          </div>
                          <div>
                            <div className="font-black text-xl text-gray-900">{user.username || 'Legendary Elite'}</div>
                            <div className="text-gray-600 font-semibold">{user.totalBattlesWon || 0} legendary victories</div>
                          </div>
                          {isTopThree && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 font-bold">
                              LEGEND
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-black text-2xl text-amber-600">{user.auraPoints || 0}</div>
                          <div className="text-gray-500 font-semibold text-sm">PRESTIGE POINTS</div>
                          <div className="text-orange-600 font-bold">{user.currentStreak || 0} day reign</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-amber-500" />
                  </div>
                  <h3 className="text-3xl font-black mb-6 text-gray-900">THE HALL AWAITS ITS FIRST LEGEND</h3>
                  <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">No one has yet achieved legendary status. Will you be the first to claim your throne?</p>
                  <Button 
                    onClick={handleLogin}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xl px-12 py-4 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <Trophy className="w-6 h-6 mr-3" />
                    CLAIM YOUR THRONE
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      {/* Elite Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-xl">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-pulse"></div>
                </div>
                <span className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  AURA
                </span>
              </div>
              <p className="text-gray-300 font-medium leading-relaxed">The most exclusive platform for elite individuals to build legendary status and compete at the highest level.</p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg flex items-center justify-center transition-colors group">
                  <svg className="w-5 h-5 text-amber-400 group-hover:text-amber-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg flex items-center justify-center transition-colors group">
                  <svg className="w-5 h-5 text-amber-400 group-hover:text-amber-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-amber-400 text-lg">ELITE ACCESS</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-amber-400 transition-colors font-medium">Elite Dashboard</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors font-medium">Legendary Challenges</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors font-medium">Prestige Battles</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors font-medium">Hall of Legends</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-amber-400 text-lg">EXCLUSIVE CIRCLE</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-amber-400 transition-colors font-medium">VIP Profiles</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors font-medium">Elite Mentorship</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors font-medium">Premium Support</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors font-medium">Legendary FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-amber-400 text-lg">PRESTIGE RESOURCES</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-amber-400 transition-colors font-medium">Elite Documentation</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors font-medium">Legend Stories</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors font-medium">Exclusive Insights</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors font-medium">Elite Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-amber-500/20 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 font-medium">&copy; 2024 AURA Platform. All rights reserved. Where legends are born.</p>
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 px-4 py-2 font-bold mt-4 md:mt-0">
                INVITE ONLY PLATFORM
              </Badge>
            </div>
          </div>
        </div>
      </footer>
      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
