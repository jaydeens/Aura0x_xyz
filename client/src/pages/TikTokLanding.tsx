import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Star, Play, Heart, Share2, ArrowRight, Zap, Trophy, Users } from "lucide-react";
import { Link } from "wouter";

export default function TikTokLanding() {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const challenges = [
    {
      id: 1,
      title: "DeFi Yield Farming 101",
      creator: "CryptoNinja",
      aura: 1250,
      likes: 432,
      thumbnail: "🌾",
      difficulty: "Beginner"
    },
    {
      id: 2,
      title: "NFT Market Analysis",
      creator: "Web3Queen",
      aura: 2100,
      likes: 678,
      thumbnail: "🎨",
      difficulty: "Advanced"
    },
    {
      id: 3,
      title: "Smart Contract Security",
      creator: "BlockchainBoss",
      aura: 3200,
      likes: 891,
      thumbnail: "🔒",
      difficulty: "Expert"
    }
  ];

  const topCreators = [
    { name: "CryptoNinja", aura: 15420, avatar: "🥷", badge: "DeFi Master" },
    { name: "Web3Queen", aura: 12890, avatar: "👑", badge: "NFT Expert" },
    { name: "BlockchainBoss", aura: 11650, avatar: "💼", badge: "Security Pro" }
  ];

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Hero Section - Ultra Modern TikTok Style */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Clean Animated Background */}
        <div className="absolute inset-0">
          {/* Primary gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/15 via-pink-600/10 to-black"></div>
          
          {/* Simplified mesh gradient */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-bl from-pink-500/15 to-transparent rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
          
          {/* Minimal floating elements */}
          <div className="absolute top-32 right-20 text-3xl animate-bounce opacity-40 hover:scale-110 transition-transform cursor-default">💎</div>
          <div className="absolute bottom-40 left-20 text-2xl animate-pulse delay-1000 opacity-30 hover:scale-110 transition-transform cursor-default">⚡</div>
          <div className="absolute top-1/2 right-12 text-2xl animate-bounce delay-1500 opacity-35 hover:scale-110 transition-transform cursor-default">✨</div>
        </div>

        {/* Floating Leaderboard Button */}
        <div className="absolute top-8 right-8 z-20">
          <Link href="/leaderboard">
            <Button 
              variant="outline" 
              className="border-2 border-purple-400/60 text-purple-300 hover:bg-purple-500/30 backdrop-blur-md bg-black/20 px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
          </Link>
        </div>

        <div className={`relative z-10 max-w-5xl mx-auto px-8 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Main Headline */}
          <div className="mb-8">
            <h1 className="text-7xl md:text-9xl font-black text-white mb-4 leading-[0.9] tracking-tight">
              Your Reputation 
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent relative">
                Is Your Edge
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-400/15 to-pink-400/15 blur-xl -z-10"></div>
              </span>
            </h1>
            
            <p className="text-3xl md:text-4xl text-gray-200 font-bold mb-6 bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">
              Earn Steeze • Conquer Challenges • Dominate Web3
            </p>
            
            <div className="flex items-center justify-center space-x-3 mb-12">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping"></div>
              <span className="text-xl text-purple-300 font-semibold">Live Now</span>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-ping delay-300"></div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Link href="/dashboard">
              <Button 
                size="lg" 
                className="group relative w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-16 py-8 text-2xl font-black rounded-2xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 border-2 border-white/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Zap className="w-6 h-6 mr-3" />
                Join Beta
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto border-3 border-purple-400 text-purple-300 hover:bg-purple-500/20 backdrop-blur-md bg-black/30 px-16 py-8 text-2xl font-bold rounded-2xl hover:scale-105 transition-all duration-300 hover:border-purple-300"
            >
              💰 Connect Wallet
            </Button>
          </div>

          {/* Clean stats ticker */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-xl font-bold">
            <div className="flex items-center space-x-3 px-6 py-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
              <Users className="w-6 h-6 text-purple-400" />
              <span className="text-white">54</span>
              <span className="text-gray-400">Creators</span>
            </div>
            <div className="flex items-center space-x-3 px-6 py-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
              <Flame className="w-6 h-6 text-pink-400" />
              <span className="text-white">5.1K</span>
              <span className="text-gray-400">Aura Earned</span>
            </div>
            <div className="flex items-center space-x-3 px-6 py-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
              <Star className="w-6 h-6 text-purple-300" />
              <span className="text-white">Active</span>
              <span className="text-gray-400">Challenges</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Premium Mobile Scroller Style */}
      <section className="py-32 px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/80"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight">
              How It Works
            </h2>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
              Four simple steps to become a Web3 reputation legend
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                emoji: "🎯", 
                title: "Complete a Web3 Challenge", 
                desc: "Pick your challenge & show your skills"
              },
              { 
                emoji: "⚡", 
                title: "Receive Steeze from Supporters", 
                desc: "Community validates your expertise"
              },
              { 
                emoji: "💰", 
                title: "Redeem Steeze for ETH", 
                desc: "Turn reputation into real rewards"
              },
              { 
                emoji: "👑", 
                title: "Climb Leaderboard & Build Aura", 
                desc: "Become a Web3 legend"
              }
            ].map((step, index) => (
              <Card key={index} className="group relative bg-black/60 border-2 border-gray-800 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 overflow-hidden backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="relative p-10 text-center h-full flex flex-col justify-center">
                  <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-500">{step.emoji}</div>
                  <h3 className="text-2xl font-bold text-white mb-4 leading-tight">{step.title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">{step.desc}</p>
                  <div className="absolute top-4 right-4 text-gray-600 font-black text-xl">0{index + 1}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges Feed Preview - Premium TikTok Style */}
      <section className="py-32 px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-black to-pink-900/5"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between mb-16">
            <div>
              <h2 className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tight">
                Trending Challenges
              </h2>
              <p className="text-2xl text-gray-400">Where legends are born</p>
            </div>
            <div className="flex flex-wrap gap-3 mt-8 lg:mt-0">
              {["🔥 Trending", "✨ New", "📚 Educational", "👑 Top Aura"].map((filter, index) => (
                <Button 
                  key={filter} 
                  variant="outline" 
                  className={`border-2 text-lg px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 ${
                    index === 0 
                      ? 'border-purple-500 text-purple-300 bg-purple-500/20' 
                      : 'border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {challenges.map((challenge, index) => (
              <Card key={challenge.id} className="group relative bg-black/80 border-2 border-gray-800 hover:border-purple-500/60 transition-all duration-500 hover:scale-105 overflow-hidden backdrop-blur-xl">
                <CardContent className="p-0">
                  <div className="relative aspect-[9/16] bg-gradient-to-br from-purple-600/15 to-pink-600/10 flex items-center justify-center overflow-hidden">
                    <div className="text-9xl group-hover:scale-110 transition-transform duration-500">{challenge.thumbnail}</div>
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-500"></div>
                    
                    {/* Floating interaction buttons */}
                    <div className="absolute bottom-6 right-6 flex flex-col space-y-3">
                      <Button className="rounded-full w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-110">
                        <Heart className="w-6 h-6 text-white" />
                      </Button>
                      <Button className="rounded-full w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-110">
                        <Share2 className="w-6 h-6 text-white" />
                      </Button>
                    </div>
                    
                    {/* Play button overlay */}
                    <Button className="absolute inset-0 w-full h-full bg-transparent hover:bg-black/10 transition-colors duration-300 group">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </Button>
                  </div>
                  
                  <div className="p-6 bg-black/60">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 text-sm font-semibold">
                        {challenge.difficulty}
                      </Badge>
                      <div className="flex items-center space-x-1 text-gray-400">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm font-medium">{challenge.likes}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">{challenge.title}</h3>
                    <p className="text-purple-400 text-sm mb-3 font-medium">@{challenge.creator}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Flame className="w-5 h-5 text-pink-400" />
                        <span className="text-pink-400 font-bold text-lg">{challenge.aura}</span>
                        <span className="text-gray-400 text-sm">Aura</span>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full px-4 py-2 text-sm font-bold">
                        Challenge
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Spotlight Carousel - Ultra Premium */}
      <section className="py-32 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-black to-pink-900/5"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight">
              Creator Legends
            </h2>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
              Meet the minds shaping Web3's future, one challenge at a time
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {topCreators.map((creator, index) => (
              <Card key={index} className="group relative bg-black/80 border-2 border-gray-800 hover:border-purple-500/60 transition-all duration-500 hover:scale-105 overflow-hidden backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="relative p-10 text-center">
                  {/* Rank indicator */}
                  <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-black text-white text-lg">
                    #{index + 1}
                  </div>
                  
                  {/* Avatar with glow effect */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative text-8xl group-hover:scale-110 transition-transform duration-500">{creator.avatar}</div>
                  </div>
                  
                  <h3 className="text-3xl font-black text-white mb-3">{creator.name}</h3>
                  
                  <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 px-4 py-2 text-sm font-bold mb-6">
                    {creator.badge}
                  </Badge>
                  
                  <div className="flex items-center justify-center space-x-3 mb-8 p-4 bg-black/40 rounded-2xl border border-white/10">
                    <Flame className="w-6 h-6 text-pink-400" />
                    <span className="text-3xl font-black text-pink-400">{creator.aura.toLocaleString()}</span>
                    <span className="text-gray-400 text-lg">Aura</span>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-2xl text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25">
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Aura Section */}
      <section className="py-20 px-6 bg-gray-950/50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-16">
            Why Aura? 🤔
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              { icon: "✅", title: "No more fake engagement", desc: "Real skills, real validation" },
              { icon: "🌍", title: "Community-first economy", desc: "Powered by creators, for creators" },
              { icon: "📚", title: "Crypto fluency > hype", desc: "Knowledge beats speculation" },
              { icon: "⚡", title: "Earn from support, not VC handouts", desc: "Direct creator-to-fan economy" }
            ].map((point, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform">
                <div className="text-5xl mb-4 group-hover:animate-bounce">{point.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{point.title}</h3>
                <p className="text-gray-400">{point.desc}</p>
              </div>
            ))}
          </div>
          
          <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            "Reputation is the new alpha." 📈
          </p>
        </div>
      </section>

      {/* Education Section - Duolingo Style */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-white text-center mb-16">
            🎓 Learn & Earn
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Intro to DeFi", icon: "🌾", level: "Beginner", xp: 100 },
              { title: "What is Governance?", icon: "🗳️", level: "Intermediate", xp: 250 },
              { title: "Web3 Wallet Safety", icon: "🔒", level: "Essential", xp: 150 },
              { title: "NFT Fundamentals", icon: "🎨", level: "Beginner", xp: 200 },
              { title: "Smart Contract Basics", icon: "📝", level: "Advanced", xp: 300 },
              { title: "Yield Farming Deep Dive", icon: "⚡", level: "Expert", xp: 500 }
            ].map((module, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 hover:scale-105 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl group-hover:animate-bounce">{module.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{module.title}</h3>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs border-gray-600">
                          {module.level}
                        </Badge>
                        <div className="flex items-center space-x-1 text-orange-400">
                          <Star className="w-3 h-3" />
                          <span className="text-sm font-bold">+{module.xp} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-12 py-6 text-xl font-bold rounded-full hover:scale-105 transition-all">
              🚀 Start Learning
            </Button>
          </div>
        </div>
      </section>

      {/* Global Leaderboard Preview */}
      <section className="py-20 px-6 bg-gray-950/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-white text-center mb-16">
            🏆 Global Leaderboard
          </h2>
          
          <Card className="bg-gray-900/50 border-gray-800 mb-8">
            <CardContent className="p-8">
              <div className="space-y-4">
                {[
                  { rank: 1, name: "CryptoNinja", aura: 15420, badge: "🥇" },
                  { rank: 2, name: "Web3Queen", aura: 12890, badge: "🥈" },
                  { rank: 3, name: "BlockchainBoss", aura: 11650, badge: "🥉" },
                  { rank: 4, name: "DeFiMaster", aura: 9840, badge: "🏅" },
                  { rank: 5, name: "NFTGuru", aura: 8920, badge: "🏅" }
                ].map((user) => (
                  <div key={user.rank} className="flex items-center justify-between p-4 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{user.badge}</span>
                      <div>
                        <p className="font-bold text-white">#{user.rank} {user.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span className="text-xl font-bold text-orange-400">{user.aura}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center">
            <Link href="/leaderboard">
              <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/20 px-8 py-4 text-lg font-bold rounded-full">
                View Full Leaderboard
              </Button>
            </Link>
            
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-white mb-4">🆔 Aura Identity Layer</h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Your on-chain resume of reputation, verified by the community. 
                Build trust, unlock opportunities, and showcase your Web3 expertise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">About Aura</h4>
              <div className="space-y-2 text-gray-400">
                <p>Mission</p>
                <p>Team</p>
                <p>Careers</p>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Resources</h4>
              <div className="space-y-2 text-gray-400">
                <p>Docs (GitBook)</p>
                <p>Smart Contracts</p>
                <p>API</p>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Community</h4>
              <div className="space-y-2 text-gray-400">
                <p>𝕏 Twitter</p>
                <p>TikTok</p>
                <p>Discord</p>
                <p>Mirror</p>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <div className="space-y-2 text-gray-400">
                <p>Terms</p>
                <p>Privacy</p>
                <p>Powered by Base</p>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-gray-800">
            <p className="text-gray-400">© 2025 Aura. Building the future of Web3 reputation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}