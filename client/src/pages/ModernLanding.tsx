import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Flame, 
  Trophy, 
  Users, 
  Swords, 
  Target, 
  BookOpen, 
  ArrowRight,
  Star,
  Zap,
  Github,
  Twitter,
  MessageCircle
} from "lucide-react";

export default function ModernLanding() {
  const { connectWallet, connectTwitter } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTwitterConnect = async () => {
    setIsConnecting(true);
    try {
      await connectTwitter();
    } catch (error) {
      console.error('Twitter connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: "Daily Learning",
      description: "Master Web3 concepts with AI-generated lessons tailored to your level",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Swords,
      title: "1v1 Battles",
      description: "Challenge others in knowledge battles and prove your expertise",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: Users,
      title: "Community Vouching",
      description: "Stake ETH to vouch for others and build your reputation network",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Trophy,
      title: "Competitive Rankings",
      description: "Climb the leaderboard and showcase your Web3 knowledge",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const stats = [
    { label: "Active Users", value: "50+", icon: Users },
    { label: "Daily Battles", value: "100+", icon: Swords },
    { label: "Aura Earned", value: "5K+", icon: Flame },
    { label: "Lessons Completed", value: "200+", icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Aura
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleWalletConnect}
                disabled={isConnecting}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
              <Button
                onClick={handleTwitterConnect}
                disabled={isConnecting}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Connect Twitter
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <Badge variant="outline" className="mb-6 border-purple-500/30 text-purple-400">
            🎉 Platform now open to everyone!
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Build Your{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
              Aura
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            The ultimate Web3 learning and reputation platform. Master blockchain concepts through 
            interactive battles, daily lessons, and community engagement.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              onClick={handleWalletConnect}
              disabled={isConnecting}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8 py-4"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Building Aura
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 text-lg px-8 py-4"
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-950/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How Aura Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Four core pillars that make learning Web3 engaging and rewarding
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors group">
                  <CardContent className="p-8">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-12">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join the community and start building your Web3 reputation today
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleWalletConnect}
                disabled={isConnecting}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8 py-4"
              >
                <Flame className="w-5 h-5 mr-2" />
                Connect & Start Learning
              </Button>
              <Button
                onClick={handleTwitterConnect}
                disabled={isConnecting}
                variant="outline"
                size="lg"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 text-lg px-8 py-4"
              >
                <Twitter className="w-5 h-5 mr-2" />
                Connect Twitter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Aura
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <a
                href="https://x.com/Aura_0x"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://discord.gg/uyWWJPMmWx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400">
              © 2025 Aura. Building the future of Web3 education.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}