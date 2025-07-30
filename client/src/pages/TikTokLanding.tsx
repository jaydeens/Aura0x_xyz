import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Star, Play, Heart, Share2, ArrowRight, Zap, Trophy, Users, LogIn, Wallet } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import auraLogo from "@assets/FULL AURA_1753876565281.png";

export default function TikTokLanding() {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Close login menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (!target.closest('.login-menu-container')) {
        setShowLoginMenu(false);
      }
    }

    if (showLoginMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLoginMenu]);

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
      {/* Hero Section - Ultra Modern TikTok Style with Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.4) saturate(1.3)' }}
          >
            <source src="/attached_assets/Fun,_vibrant_scene_where_the_following_texts_pop_up__Challenge,_Learn,_Farm_Aura,_Earn._Using_Purple_seed2620036643_1753876415396.mp4" type="video/mp4" />
            {/* Fallback for when video doesn't load */}
          </video>
          
          {/* Video overlay gradients - lighter to show more of your custom video */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/20 to-pink-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30"></div>
        </div>

        {/* Fallback animated background (shown if video fails) */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-600/20 via-pink-600/15 to-black">
          {/* Animated mesh gradient fallback */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/25 to-transparent rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-32 right-20 text-3xl animate-bounce opacity-40 hover:scale-110 transition-transform cursor-default">💎</div>
          <div className="absolute bottom-40 left-20 text-2xl animate-pulse delay-1000 opacity-30 hover:scale-110 transition-transform cursor-default">⚡</div>
          <div className="absolute top-1/2 right-12 text-2xl animate-bounce delay-1500 opacity-35 hover:scale-110 transition-transform cursor-default">✨</div>
        </div>

        {/* Logo and Navigation */}
        <div className="absolute top-8 left-8 z-30">
          <Link href="/">
            <img 
              src={auraLogo} 
              alt="Aura Logo" 
              className="h-12 sm:h-16 w-auto hover:scale-105 transition-transform duration-300 drop-shadow-lg"
            />
          </Link>
        </div>

        {/* Login/Profile Button */}
        <div className="absolute top-8 right-8 z-30">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                className="border-2 border-purple-400/60 text-purple-300 hover:bg-purple-500/30 backdrop-blur-md bg-black/20 px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <Users className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <div className="relative login-menu-container">
              <Button 
                onClick={() => setShowLoginMenu(!showLoginMenu)}
                variant="outline" 
                className="border-2 border-purple-400/60 text-purple-300 hover:bg-purple-500/30 backdrop-blur-md bg-black/20 px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>

              {showLoginMenu && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-black/90 backdrop-blur-md border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-4 space-y-3">
                    <p className="text-purple-300 text-sm font-medium text-center">Choose your login method</p>
                    
                    <Button 
                      onClick={() => {
                        window.location.href = '/api/auth/twitter';
                        setShowLoginMenu(false);
                      }}
                      className="w-full bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold py-3 rounded-xl transition-all duration-300"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Continue with X
                    </Button>
                    
                    <Button 
                      onClick={async () => {
                        try {
                          if (window.ethereum) {
                            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                            if (accounts.length > 0) {
                              window.location.href = '/dashboard';
                            }
                          } else {
                            alert('Please install MetaMask to connect your wallet');
                          }
                        } catch (error) {
                          console.error('Wallet connection failed:', error);
                        }
                        setShowLoginMenu(false);
                      }}
                      variant="outline"
                      className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/20 font-bold py-3 rounded-xl transition-all duration-300"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`relative z-20 max-w-6xl mx-auto px-4 sm:px-8 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Main Headline - Better Mobile Layout */}
          <div className="mb-12 space-y-6 overflow-visible">
            <h1 className="text-5xl sm:text-7xl lg:text-9xl font-black leading-[1.2] tracking-tight">
              <span className="block text-white drop-shadow-2xl mb-2">Your Creativity</span>
              <span className="block relative pt-4 pb-8 mb-4" style={{
                background: 'linear-gradient(to right, #c084fc, #f472b6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Is Your Edge
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-2xl -z-10"></div>
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-200 font-semibold max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
              Earn Steeze • Conquer Challenges • Dominate Web3
            </p>
            
            
          </div>

          {/* Improved CTA Section */}
          <div className="mb-16 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="group relative w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-12 py-6 text-xl font-bold rounded-full shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Join Beta
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Enhanced stats grid with better contrast */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-black/50 backdrop-blur-md rounded-2xl border border-white/20 hover:border-purple-500/50 transition-colors shadow-xl">
              <Users className="w-8 h-8 text-purple-400 mb-2" />
              <span className="text-3xl font-black text-white drop-shadow-lg">54</span>
              <span className="text-gray-300 font-medium">Creators</span>
            </div>
            <div className="flex flex-col items-center p-6 bg-black/50 backdrop-blur-md rounded-2xl border border-white/20 hover:border-pink-500/50 transition-colors shadow-xl">
              <Flame className="w-8 h-8 text-pink-400 mb-2" />
              <span className="text-3xl font-black text-white drop-shadow-lg">5.1K</span>
              <span className="text-gray-300 font-medium">Aura Earned</span>
            </div>
            <div className="flex flex-col items-center p-6 bg-black/50 backdrop-blur-md rounded-2xl border border-white/20 hover:border-purple-500/50 transition-colors shadow-xl">
              <Star className="w-8 h-8 text-purple-300 mb-2" />
              <span className="text-3xl font-black text-white drop-shadow-lg">∞</span>
              <span className="text-gray-300 font-medium">Challenges</span>
            </div>
          </div>
        </div>
      </section>
      {/* How It Works - Mobile-First Layout */}
      <section className="py-20 lg:py-32 px-4 sm:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950/80 to-black"></div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16 lg:mb-24">
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 max-w-2xl mx-auto">
              Four steps to Web3 reputation mastery
            </p>
          </div>
          
          <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8 xl:grid-cols-4">
            {[
              { 
                emoji: "🎯", 
                title: "Complete Challenges", 
                desc: "Pick your battle & showcase skills"
              },
              { 
                emoji: "⚡", 
                title: "Earn Community Steeze", 
                desc: "Get validated by peers"
              },
              { 
                emoji: "💰", 
                title: "Convert to ETH", 
                desc: "Turn reputation into rewards"
              },
              { 
                emoji: "👑", 
                title: "Climb Rankings", 
                desc: "Become a Web3 legend"
              }
            ].map((step, index) => (
              <Card key={index} className="group relative bg-gray-950/60 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="relative mb-6">
                    <div className="text-5xl lg:text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">{step.emoji}</div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 leading-tight">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Challenges Feed - Improved Layout */}
      <section className="py-20 lg:py-32 px-4 sm:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/10 to-black"></div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center lg:text-left lg:flex lg:items-end lg:justify-between mb-12 lg:mb-16">
            <div className="mb-8 lg:mb-0">
              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-2 tracking-tight">
                Trending Challenges
              </h2>
              <p className="text-lg sm:text-xl text-gray-400">Where legends are born</p>
            </div>
            <div className="flex flex-wrap justify-center lg:justify-end gap-3">
              {["🔥 Hot", "✨ New", "📚 Learn", "👑 Elite"].map((filter, index) => (
                <Button 
                  key={filter} 
                  variant="outline" 
                  size="sm"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    index === 0 
                      ? 'border-purple-500 text-purple-300 bg-purple-500/20' 
                      : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                  }`}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {challenges.map((challenge, index) => (
              <Card key={challenge.id} className="group relative bg-gray-950/80 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] overflow-hidden backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-purple-600/10 to-pink-600/5 flex items-center justify-center overflow-hidden">
                    <div className="text-6xl lg:text-7xl group-hover:scale-110 transition-transform duration-300">{challenge.thumbnail}</div>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    
                    {/* Simplified interaction */}
                    <div className="absolute bottom-4 right-4 flex space-x-2">
                      <Button size="sm" className="rounded-full w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm">
                        <Heart className="w-4 h-4 text-white" />
                      </Button>
                      <Button size="sm" className="rounded-full w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm">
                        <Share2 className="w-4 h-4 text-white" />
                      </Button>
                    </div>
                    
                    {/* Play button */}
                    <Button className="absolute inset-0 w-full h-full bg-transparent hover:bg-black/5 transition-colors group">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </Button>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
                        {challenge.difficulty}
                      </Badge>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Heart className="w-3 h-3" />
                        <span className="text-xs">{challenge.likes}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-1 leading-tight">{challenge.title}</h3>
                    <p className="text-purple-400 text-sm mb-3">@{challenge.creator}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Flame className="w-4 h-4 text-pink-400" />
                        <span className="text-pink-400 font-bold">{challenge.aura}</span>
                        <span className="text-gray-500 text-sm">Aura</span>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full px-3 py-1 text-xs font-bold">
                        Try It
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Creator Spotlight - Refined Layout */}
      <section className="py-20 lg:py-32 px-4 sm:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950/50 to-black"></div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight">
              Top Creators
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              The legends building Web3's reputation economy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {topCreators.map((creator, index) => (
              <Card key={index} className="group relative bg-gray-950/80 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] overflow-hidden backdrop-blur-sm">
                <CardContent className="relative p-8 text-center">
                  {/* Rank badge */}
                  <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-white text-sm">
                    {index + 1}
                  </div>
                  
                  {/* Avatar */}
                  <div className="mb-6">
                    <div className="text-6xl group-hover:scale-110 transition-transform duration-300">{creator.avatar}</div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{creator.name}</h3>
                  
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-sm mb-4">
                    {creator.badge}
                  </Badge>
                  
                  <div className="flex items-center justify-center space-x-2 mb-6 p-3 bg-black/30 rounded-xl">
                    <Flame className="w-5 h-5 text-pink-400" />
                    <span className="text-2xl font-bold text-pink-400">{creator.aura.toLocaleString()}</span>
                    <span className="text-gray-400">Aura</span>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-xl transition-all duration-300">
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