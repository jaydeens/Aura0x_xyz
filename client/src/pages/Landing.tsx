import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Zap, Users, Brain, Sparkles, Play, TrendingUp, Cpu, Network, Blocks, Shield, Wallet } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function Landing() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['/api/leaderboard'],
    refetchInterval: 60000,
  });

  const { data: activeBattles } = useQuery({
    queryKey: ['/api/battles'],
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Floating Navigation - Top Right Corner */}
      <nav className="fixed top-6 right-6 z-50 flex items-center gap-4" data-testid="navbar-landing">
        <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/50 text-cyan-400 font-black text-xs px-4 py-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-shadow backdrop-blur-xl" data-testid="badge-trending">
          <Cpu className="w-3 h-3 mr-1 animate-pulse" />
          AI PROTOCOL
        </Badge>
        <Button 
          onClick={handleLogin} 
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black px-6 py-3 text-sm rounded-full shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transform hover:scale-110 transition-all duration-300 border border-cyan-400/30"
          data-testid="button-login"
        >
          <Wallet className="w-4 h-4 mr-2" />
          CONNECT
        </Button>
      </nav>
      {/* Animated Background Particles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-950/40 to-black">
          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLCAxODMsIDIzNSwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
      </div>
      {/* Hero Section - Diagonal Layout */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute top-8 left-8 z-20">
          <div className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
            DREAMZ
          </div>
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto">
            {/* Left Column - Content */}
            <div className="space-y-8 transform lg:-rotate-2">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-full px-6 py-3 backdrop-blur-xl" data-testid="badge-ai-crypto">
                <Network className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-cyan-400 font-black text-sm tracking-widest">WEB3 SOCIAL CREATOR/REPUTATION LAYER</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none" data-testid="heading-main">
                <span className="block text-white mb-2">FORGE YOUR</span>
                <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-pulse mb-2">
                  DREAMZ
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-2xl font-medium" data-testid="text-description">
                Neural-powered credibility engine 🧠 Mint reputation NFTs, 
                validate knowledge on-chain, and build unstoppable digital identity
              </p>

              {/* Vertical Stacked Buttons with Diagonal Offset */}
              <div className="flex flex-col gap-4 items-start transform lg:translate-x-12">
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-xl px-12 py-7 rounded-2xl shadow-2xl hover:shadow-cyan-500/40 transform hover:scale-105 hover:rotate-1 transition-all duration-300 border-2 border-cyan-400/30"
                  data-testid="button-connect-wallet"
                >
                  <Zap className="w-6 h-6 mr-3" />
                  INITIALIZE WALLET
                </Button>
                
                <Button 
                  onClick={handleWatchDemo}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-black/50 backdrop-blur-xl border-2 border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400 font-black text-lg px-10 py-6 rounded-2xl shadow-xl hover:shadow-cyan-500/30 transform hover:scale-105 hover:-rotate-1 transition-all duration-300"
                  data-testid="button-watch-demo"
                >
                  <Play className="w-5 h-5 mr-3" />
                  WATCH PROTOCOL DEMO
                </Button>
              </div>
            </div>

            {/* Right Column - Asymmetric Stats Cards */}
            <div className="relative lg:pl-8">
              <div className="space-y-6">
                {/* Card 1 - Offset Right */}
                <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-2 border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 transform lg:translate-x-12 hover:scale-105 transition-all duration-300" data-testid="stat-users">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                          {(stats as any)?.totalUsers || 0}
                        </div>
                        <div className="text-cyan-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          VALIDATORS
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 2 - Center */}
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-2 border-blue-500/30 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all duration-300" data-testid="stat-protocol">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                          DREAMZ
                        </div>
                        <div className="text-blue-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                          <Blocks className="w-4 h-4" />
                          NETWORK
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Network className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 3 - Offset Left */}
                <Card className="bg-gradient-to-br from-cyan-600/10 to-blue-500/10 border-2 border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 transform lg:-translate-x-8 hover:scale-105 transition-all duration-300" data-testid="stat-battles">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                          {(stats as any)?.activeBattles || 0}
                        </div>
                        <div className="text-cyan-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                          <Zap className="w-4 h-4 animate-pulse" />
                          ACTIVE PROOFS
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Brain className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Floating Cards Leaderboard Section */}
      <section id="trending" className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-full px-6 py-3 backdrop-blur-xl" data-testid="badge-leaderboard">
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-cyan-400 font-black text-sm tracking-widest">REPUTATION CONSENSUS</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight" data-testid="heading-leaderboard">
              <span className="block text-white mb-2">ELITE</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent mb-2">
                VALIDATORS
              </span>
              <span className="block text-white">ON-CHAIN</span>
            </h2>
            
            <p className="text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto font-medium leading-relaxed" data-testid="text-leaderboard-description">
              Top-ranked nodes in the reputation graph 🔗 Verify credentials, 
              stake knowledge, dominate the protocol
            </p>
          </div>

          {leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {leaderboard.slice(0, 6).map((user: any, index: number) => {
                const isTopThree = index < 3;
                const rankIcons = ['🥇', '🥈', '🥉'];
                const rotations = ['lg:rotate-1', 'lg:-rotate-1', 'lg:rotate-2', 'lg:-rotate-2', 'lg:rotate-1', 'lg:-rotate-1'];
                
                return (
                  <Card 
                    key={user.id} 
                    className={`relative overflow-hidden backdrop-blur-xl border-2 transition-all duration-500 hover:scale-105 hover:rotate-0 ${rotations[index]} ${
                      isTopThree 
                        ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50 shadow-2xl shadow-cyan-500/30' 
                        : 'bg-gradient-to-br from-gray-900/50 to-blue-950/30 border-gray-700/50 shadow-xl'
                    }`}
                    data-testid={`leaderboard-rank-${index + 1}`}
                  >
                    {/* Rank Badge - Top Right */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl ${
                        isTopThree 
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600' 
                          : 'bg-gradient-to-br from-gray-700 to-gray-800'
                      }`}>
                        {isTopThree ? rankIcons[index] : index + 1}
                      </div>
                    </div>

                    <CardContent className="p-8 pt-24">
                      <div className="space-y-4">
                        <div>
                          <div className="font-black text-2xl text-white mb-2 truncate" data-testid={`text-username-${index + 1}`}>
                            {user.username || 'Anonymous Validator'}
                          </div>
                          <div className="text-gray-400 font-bold text-base flex items-center gap-2" data-testid={`text-battles-${index + 1}`}>
                            <Trophy className="w-4 h-4 text-cyan-400" />
                            {user.totalBattlesWon || 0} proofs validated
                          </div>
                        </div>

                        <div className="pt-4 border-t border-cyan-500/30 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-black text-xs uppercase tracking-wide">DREAMZ TOKENS</span>
                            <span className="font-black text-3xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent" data-testid={`text-dreamz-${index + 1}`}>
                              {user.dreamzPoints || 0}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-black text-xs uppercase tracking-wide">STREAK</span>
                            <span className="text-cyan-400 font-black text-lg flex items-center gap-1" data-testid={`text-streak-${index + 1}`}>
                              <Zap className="w-4 h-4" />
                              {user.currentStreak || 0}d
                            </span>
                          </div>
                        </div>

                        {isTopThree && (
                          <Badge className="w-full justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-3 font-black text-sm" data-testid={`badge-top-${index + 1}`}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            ELITE NODE
                          </Badge>
                        )}
                      </div>
                    </CardContent>

                    {/* Glowing border effect for top 3 */}
                    {isTopThree && (
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 blur-xl -z-10"></div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-gray-900/50 to-blue-950/30 border-2 border-cyan-500/30 backdrop-blur-xl max-w-2xl mx-auto" data-testid="card-leaderboard">
              <CardContent className="p-16 text-center">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full flex items-center justify-center" data-testid="icon-empty-leaderboard">
                  <Trophy className="w-16 h-16 text-cyan-400 animate-pulse" />
                </div>
                <h3 className="text-4xl font-black mb-6 text-white" data-testid="heading-empty-leaderboard">GENESIS VALIDATOR</h3>
                <p className="text-xl text-gray-400 mb-8 font-medium leading-relaxed">No validators in the network yet... Become the first node to mint reputation and initialize the protocol</p>
                <Button 
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-xl px-12 py-6 rounded-2xl shadow-2xl hover:shadow-cyan-500/40 transform hover:scale-110 transition-all duration-300"
                  data-testid="button-start-journey"
                >
                  <Zap className="w-6 h-6 mr-3" />
                  DEPLOY NODE
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
      {/* Minimal Footer */}
      <footer className="relative border-t border-cyan-500/20 bg-gradient-to-br from-black via-blue-950/30 to-black py-16" data-testid="footer-landing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div className="space-y-6">
              <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                DREAMZ
              </div>
              <p className="text-gray-400 font-medium leading-relaxed">
                Neural credibility infrastructure. Validate, stake, and mint reputation tokens on-chain.
              </p>
              <div className="flex space-x-4">
                <a href="https://x.com/Dreamz_Protocol" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 rounded-xl flex items-center justify-center transition-all group hover:scale-110" data-testid="link-twitter">
                  <svg className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-cyan-500/30 rounded-xl flex items-center justify-center transition-all group hover:scale-110" data-testid="link-docs">
                  <Brain className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-black mb-6 text-cyan-400 uppercase tracking-widest text-sm">PROTOCOL</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Validator Dashboard</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Proof Arena</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Reputation Graph</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Knowledge Vaults</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-6 text-blue-400 uppercase tracking-widest text-sm">NETWORK</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors font-medium">Mint Profile NFT</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors font-medium">Stake Tokens</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors font-medium">Protocol Docs</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors font-medium">Smart Contracts</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-cyan-500/20 pt-8 text-center">
            <p className="text-gray-500 font-medium">&copy; 2025 DREAMZ Protocol. Decentralized reputation infrastructure.</p>
          </div>
        </div>
      </footer>
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
