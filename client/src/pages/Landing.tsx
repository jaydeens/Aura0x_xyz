import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Coins, Sword, Trophy, Zap, Clock, Flame, Star } from "lucide-react";

export default function Landing() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // User is on landing page, this is expected
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleWatchDemo = () => {
    toast({
      title: "Demo Coming Soon",
      description: "Battle demos will be available once you join the platform!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-br from-[#8000FF] to-[#9933FF] rounded-2xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#8000FF]/10 to-[#0A0A0B] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0A0A0B]/90 backdrop-blur-md border-b border-[#8000FF]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#8000FF] to-[#9933FF] rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#8000FF] to-[#9933FF] bg-clip-text text-transparent">
                Aura
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-[#8000FF] transition-colors">Features</a>
              <a href="#battles" className="text-gray-300 hover:text-[#8000FF] transition-colors">Battles</a>
              <a href="#leaderboard" className="text-gray-300 hover:text-[#8000FF] transition-colors">Leaderboard</a>
            </div>

            <div className="flex items-center space-x-4">
              <Button onClick={handleLogin} className="bg-gradient-to-r from-[#8000FF] to-[#9933FF] hover:from-[#6B00E6] hover:to-[#8000FF] text-white font-medium px-6 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Connect & Start
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#8000FF]/5 to-[#9933FF]/5"></div>
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#8000FF]/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-[#9933FF]/10 rounded-full blur-2xl animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-[#8000FF] to-[#9933FF] bg-clip-text text-transparent">
              Build Your Aura
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              The ultimate Web3 platform where KOLs battle for dominance through daily lessons, USDT vouching, and epic 1v1 Aura Battles.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                onClick={handleLogin}
                className="bg-gradient-to-r from-[#8000FF] to-[#9933FF] hover:from-[#6B00E6] hover:to-[#8000FF] text-white font-semibold text-lg px-8 py-4 h-auto"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Your Journey
              </Button>
              <Button 
                variant="outline" 
                onClick={handleWatchDemo}
                className="border-2 border-[#8000FF]/50 text-[#8000FF] hover:bg-[#8000FF]/10 font-semibold text-lg px-8 py-4 h-auto"
              >
                <Clock className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#8000FF]">12,547</div>
                <div className="text-sm text-gray-400">Active KOLs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#9933FF]">3,821</div>
                <div className="text-sm text-gray-400">Battles Fought</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#00FF88]">$284K</div>
                <div className="text-sm text-gray-400">USDT Vouched</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#FFD700]">45,923</div>
                <div className="text-sm text-gray-400">Lessons Completed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gradient-to-b from-[#0A0A0B] to-[#1A1A1B]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#8000FF] to-[#9933FF] bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Four core pillars that define your Aura journey and reputation in the Web3 space
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Daily Lessons */}
            <Card className="bg-[#1A1A1B] border-[#8000FF]/20 hover:border-[#8000FF]/40 transition-all hover:scale-105">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#8000FF] to-[#6B00E6] rounded-lg flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Daily Lessons</h3>
                <p className="text-gray-400 mb-4">Complete AI-powered lessons and tweet your certification to earn Aura Points and maintain your streak.</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Clout Chaser</span>
                    <Badge variant="secondary" className="bg-[#8000FF]/20 text-[#8000FF]">0-4 days</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Attention Seeker</span>
                    <Badge variant="secondary" className="bg-[#9933FF]/20 text-[#9933FF]">5-14 days</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Grinder</span>
                    <Badge variant="secondary" className="bg-[#00FF88]/20 text-[#00FF88]">15-29 days</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Aura Vader</span>
                    <Badge variant="secondary" className="bg-[#FFD700]/20 text-[#FFD700]">30+ days</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* USDT Vouching */}
            <Card className="bg-[#1A1A1B] border-[#9933FF]/20 hover:border-[#9933FF]/40 transition-all hover:scale-105">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#9933FF] to-[#00D4FF] rounded-lg flex items-center justify-center mb-6">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">USDT Vouching</h3>
                <p className="text-gray-400 mb-4">Vouch for others with USDT. Higher streak levels provide multiplier bonuses for both giver and receiver.</p>
                
                <div className="bg-[#0A0A0B] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-2">1 USDT = 10 Base Aura Points</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Aura Vader</span>
                      <span className="text-[#00FF88]">2x multiplier</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grinder</span>
                      <span className="text-[#FFD700]">1.5x multiplier</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aura Battles */}
            <Card className="bg-[#1A1A1B] border-[#FFD700]/20 hover:border-[#FFD700]/40 transition-all hover:scale-105">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FFD700] to-[#FF8800] rounded-lg flex items-center justify-center mb-6">
                  <Sword className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Aura Battles</h3>
                <p className="text-gray-400 mb-4">Challenge others to 1v1 battles. Stake Aura Points and let the community vote on the winner.</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-400">
                    <Clock className="w-4 h-4 mr-2 text-[#9933FF]" />
                    3-5 hour voting window
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Trophy className="w-4 h-4 mr-2 text-[#FFD700]" />
                    Winner takes all stakes + vouches
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Crown className="w-4 h-4 mr-2 text-[#FFD700]" />
                    Top 3 must battle weekly
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="bg-[#1A1A1B] border-[#00FF88]/20 hover:border-[#00FF88]/40 transition-all hover:scale-105">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00FF88] to-[#00D4FF] rounded-lg flex items-center justify-center mb-6">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Global Ranking</h3>
                <p className="text-gray-400 mb-4">Compete for the top spot on the global leaderboard with portfolio analytics and battle stats.</p>
                
                <div className="bg-[#0A0A0B] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-2">Ranking Factors</div>
                  <div className="space-y-1 text-sm">
                    <div>• Total Aura Points</div>
                    <div>• Battle Win/Loss Ratio</div>
                    <div>• Wallet Age & Growth</div>
                    <div>• Vouches Received</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Live Battle Preview */}
      <section id="battles" className="py-16 bg-gradient-to-b from-[#1A1A1B]/20 to-[#0A0A0B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#8000FF] to-[#9933FF] bg-clip-text text-transparent">
              Aura Battles
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Challenge other KOLs to epic 1v1 battles and stake your Aura Points for victory
            </p>
          </div>

          {/* Mock Live Battle */}
          <Card className="bg-gradient-to-r from-[#1A1A1B] to-[#8000FF]/5 border-[#8000FF]/30 max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Live Battle</h3>
                <Badge className="bg-red-500/20 text-red-400 animate-pulse">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                  LIVE
                </Badge>
              </div>

              <div className="grid md:grid-cols-3 gap-6 items-center">
                {/* Challenger */}
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#8000FF] to-[#6B00E6] rounded-full flex items-center justify-center border-4 border-[#8000FF]">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <Badge className="absolute -bottom-2 -right-2 bg-[#FFD700]/20 text-[#FFD700]">
                      Grinder
                    </Badge>
                  </div>
                  <h4 className="font-bold text-lg">CryptoKing</h4>
                  <p className="text-sm text-gray-400">3,245 Aura</p>
                  <Badge variant="outline" className="mt-2 border-[#8000FF] text-[#8000FF]">
                    Staked: 500 Aura
                  </Badge>
                </div>

                {/* VS + Timer */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#9933FF] mb-4">VS</div>
                  <Card className="bg-[#1A1A1B] border-[#8000FF]/20">
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-400 mb-1">Voting ends in</div>
                      <div className="text-2xl font-bold text-[#8000FF]">02:47:32</div>
                      <div className="text-xs text-gray-500">Total Votes: 127</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Opponent */}
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#9933FF] to-[#00D4FF] rounded-full flex items-center justify-center border-4 border-[#9933FF]">
                      <Flame className="w-8 h-8 text-white" />
                    </div>
                    <Badge className="absolute -bottom-2 -right-2 bg-[#9933FF]/20 text-[#9933FF]">
                      Aura Vader
                    </Badge>
                  </div>
                  <h4 className="font-bold text-lg">DeFiWizard</h4>
                  <p className="text-sm text-gray-400">8,921 Aura</p>
                  <Badge variant="outline" className="mt-2 border-[#9933FF] text-[#9933FF]">
                    Staked: 500 Aura
                  </Badge>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Button 
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-[#FFD700] to-[#FF8800] hover:from-[#FFD700]/80 hover:to-[#FF8800]/80 text-black font-bold"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Join to Vote & Battle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section id="leaderboard" className="py-16 bg-gradient-to-b from-[#0A0A0B] to-[#8000FF]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#8000FF] to-[#9933FF] bg-clip-text text-transparent">
              Global Leaderboard
            </h2>
            <p className="text-xl text-gray-300">The most influential KOLs in the Web3 space</p>
          </div>

          <Card className="bg-[#1A1A1B] border-[#8000FF]/20 max-w-4xl mx-auto">
            <CardContent className="p-0">
              {/* Top 3 Podium */}
              <div className="bg-gradient-to-r from-[#8000FF]/10 to-[#9933FF]/10 p-8">
                <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  {/* 2nd Place */}
                  <div className="text-center order-2 md:order-1">
                    <div className="relative mx-auto w-20 h-20 mb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg">CryptoQueen</h3>
                    <p className="text-[#9933FF] font-semibold">15,423 Aura</p>
                    <div className="text-sm text-gray-400">47 battles won</div>
                  </div>

                  {/* 1st Place */}
                  <div className="text-center order-1 md:order-2">
                    <div className="relative mx-auto w-28 h-28 mb-4">
                      <div className="w-28 h-28 bg-gradient-to-br from-[#FFD700] to-[#FF8800] rounded-full flex items-center justify-center animate-pulse">
                        <Crown className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center">
                        <Crown className="w-5 h-5 text-black" />
                      </div>
                    </div>
                    <h3 className="font-bold text-xl bg-gradient-to-r from-[#FFD700] to-[#FF8800] bg-clip-text text-transparent">
                      AuraKing
                    </h3>
                    <p className="text-[#FFD700] font-bold text-lg">23,892 Aura</p>
                    <div className="text-sm text-gray-300">73 battles won</div>
                    <Badge className="mt-2 bg-[#FFD700]/20 text-[#FFD700]">
                      AURA KING
                    </Badge>
                  </div>

                  {/* 3rd Place */}
                  <div className="text-center order-3">
                    <div className="relative mx-auto w-20 h-20 mb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                        <Flame className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg">TokenMaster</h3>
                    <p className="text-orange-400 font-semibold">12,156 Aura</p>
                    <div className="text-sm text-gray-400">31 battles won</div>
                  </div>
                </div>
              </div>

              <div className="p-6 text-center">
                <Button 
                  onClick={handleLogin}
                  className="border border-[#8000FF] text-[#8000FF] hover:bg-[#8000FF] hover:text-white"
                  variant="outline"
                >
                  Join the Leaderboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1B] border-t border-[#8000FF]/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#8000FF] to-[#9933FF] rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-[#8000FF] to-[#9933FF] bg-clip-text text-transparent">
                  Aura
                </span>
              </div>
              <p className="text-gray-400 mb-4">The ultimate Web3 platform for KOL battles and Aura building.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-[#8000FF] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#8000FF] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9460 2.4189-2.1568 2.4189Z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-[#8000FF] transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-[#8000FF] transition-colors">Daily Lessons</a></li>
                <li><a href="#" className="hover:text-[#8000FF] transition-colors">Aura Battles</a></li>
                <li><a href="#" className="hover:text-[#8000FF] transition-colors">Leaderboard</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-[#8000FF] transition-colors">KOL Profiles</a></li>
                <li><a href="#" className="hover:text-[#8000FF] transition-colors">Vouching</a></li>
                <li><a href="#" className="hover:text-[#8000FF] transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-[#8000FF] transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-[#8000FF] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#8000FF] transition-colors">API</a></li>
                <li><a href="#" className="hover:text-[#8000FF] transition-colors">Whitepaper</a></li>
                <li><a href="#" className="hover:text-[#8000FF] transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#8000FF]/20 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Aura Platform. All rights reserved. Built on Polygon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
