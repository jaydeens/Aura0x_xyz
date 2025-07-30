import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Star, Play, Heart, Share2 } from "lucide-react";
import { Link } from "wouter";

export default function TikTokLanding() {
  const [, setCurrentChallenge] = useState(0);

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
      {/* Hero Section - TikTok Style */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-blue-900/30 animate-pulse"></div>
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
          </div>
          
          {/* Floating TikTok-style elements */}
          <div className="absolute top-20 right-20 text-6xl animate-bounce opacity-60">💎</div>
          <div className="absolute top-40 left-16 text-4xl animate-spin opacity-40">🔥</div>
          <div className="absolute bottom-32 right-32 text-5xl animate-pulse opacity-50">⚡</div>
          <div className="absolute bottom-20 left-20 text-3xl animate-bounce delay-500 opacity-40">🚀</div>
          <div className="absolute top-1/2 left-10 text-2xl animate-pulse delay-1000 opacity-30">✨</div>
          <div className="absolute top-1/3 right-10 text-3xl animate-bounce delay-1500 opacity-40">👑</div>
        </div>

        {/* Floating Leaderboard Button */}
        <div className="absolute top-6 right-6 z-20">
          <Link href="/leaderboard">
            <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 backdrop-blur-sm animate-pulse hover:animate-none hover:scale-105 transition-all">
              🏆 Leaderboard
            </Button>
          </Link>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-none">
            Your Reputation 
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              Is Your Edge
            </span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-300 font-bold mb-12 animate-bounce">
            Earn Steeze • Conquer Challenges • Dominate Web3 💫
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-12 py-6 text-xl font-black rounded-full shadow-2xl shadow-purple-500/25 hover:scale-110 transition-all duration-300 animate-pulse hover:animate-none">
                🚀 Join Beta
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-purple-500 text-purple-400 hover:bg-purple-500/20 px-12 py-6 text-xl font-bold rounded-full hover:scale-105 transition-all duration-300">
              💰 Connect Wallet
            </Button>
          </div>

          {/* TikTok-style stats ticker */}
          <div className="flex justify-center items-center space-x-8 text-lg font-bold text-gray-400">
            <div className="flex items-center space-x-2 animate-pulse">
              <span className="text-2xl">👥</span>
              <span>54 Creators</span>
            </div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
            <div className="flex items-center space-x-2 animate-pulse delay-300">
              <span className="text-2xl">⚡</span>
              <span>5.1K Aura Earned</span>
            </div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-ping delay-500"></div>
            <div className="flex items-center space-x-2 animate-pulse delay-700">
              <span className="text-2xl">🎯</span>
              <span>Live Challenges</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Mobile Scroller Style */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-white text-center mb-16">
            How It Works 📱
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { emoji: "🎯", title: "Complete a Web3 Challenge", desc: "Pick your challenge & show your skills" },
              { emoji: "⚡", title: "Receive Steeze from Supporters", desc: "Community validates your expertise" },
              { emoji: "💰", title: "Redeem Steeze for ETH", desc: "Turn reputation into real rewards" },
              { emoji: "👑", title: "Climb Leaderboard & Build Aura", desc: "Become a Web3 legend" }
            ].map((step, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 hover:scale-105 transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4 group-hover:animate-bounce">{step.emoji}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges Feed Preview - TikTok Style */}
      <section className="py-20 px-6 bg-gray-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl md:text-6xl font-black text-white">
              🔥 Trending Challenges
            </h2>
            <div className="flex space-x-4">
              {["Trending", "New", "Educational", "Top Aura"].map((filter) => (
                <Button key={filter} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/20">
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {challenges.map((challenge, index) => (
              <Card key={challenge.id} className="bg-black border-gray-800 hover:border-purple-500/50 hover:scale-105 transition-all duration-300 group overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[9/16] bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center">
                    <div className="text-8xl group-hover:animate-bounce">{challenge.thumbnail}</div>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    <Button className="absolute bottom-4 right-4 rounded-full w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm">
                      <Play className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        {challenge.difficulty}
                      </Badge>
                      <div className="flex items-center space-x-3 text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">{challenge.likes}</span>
                        </div>
                        <Share2 className="w-4 h-4 cursor-pointer hover:text-white" />
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-white mb-1">{challenge.title}</h3>
                    <p className="text-purple-400 text-sm">@{challenge.creator}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400 font-bold">{challenge.aura} Aura</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Spotlight Carousel */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-white text-center mb-16">
            🌟 Top Creators
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {topCreators.map((creator, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 hover:scale-105 transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4 group-hover:animate-bounce">{creator.avatar}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{creator.name}</h3>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-4">
                    {creator.badge}
                  </Badge>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="text-xl font-bold text-orange-400">{creator.aura} Aura</span>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full">
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