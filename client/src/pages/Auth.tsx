import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import TwitterConnect from "@/components/TwitterConnect";
import WalletConnect from "@/components/WalletConnect";
import { Brain, Users, Trophy, TrendingUp } from "lucide-react";

export default function Auth() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1929] via-[#0D1F2D] to-black relative overflow-hidden">
      {/* Circuit Board Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <Brain className="h-12 w-12 text-[#00D9FF]" />
              <div className="absolute inset-0 blur-lg bg-[#00D9FF] opacity-50 animate-pulse"></div>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-[#00D9FF] via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              DREAMZ
            </h1>
          </div>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The Web3 social platform where you build your reputation through daily learning, 
            community vouching, and epic 1v1 battles.
          </p>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-lg rounded-lg p-6 border border-cyan-400/30 hover:border-cyan-400/50 transition-all">
              <Users className="h-8 w-8 text-[#00D9FF] mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Community Vouching</h3>
              <p className="text-gray-300 text-sm">Stake USDT to vouch for your favorite KOLs and earn Dreamz Points</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-lg rounded-lg p-6 border border-cyan-400/30 hover:border-cyan-400/50 transition-all">
              <Trophy className="h-8 w-8 text-[#FFD700] mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Epic Battles</h3>
              <p className="text-gray-300 text-sm">Challenge others to 1v1 battles and let the community vote</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-lg rounded-lg p-6 border border-cyan-400/30 hover:border-cyan-400/50 transition-all">
              <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Daily Learning</h3>
              <p className="text-gray-300 text-sm">Complete AI-generated Web3 lessons to build your knowledge</p>
            </div>
          </div>
        </div>

        {/* Authentication Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-lg border border-cyan-400/30">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Join the Dreamz Community</CardTitle>
              <CardDescription className="text-gray-300">
                Connect your Twitter and CARV SVM wallet to start building your Web3 reputation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Twitter Authentication */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Step 1: Verify Identity</h3>
                    <p className="text-sm text-gray-300 mb-4">
                      Connect your Twitter account to prove your identity and build trust
                    </p>
                  </div>
                  <TwitterConnect />
                </div>

                {/* Wallet Connection */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Step 2: Connect Wallet</h3>
                    <p className="text-sm text-gray-300 mb-4">
                      Link your Web3 wallet to participate in vouching and battles
                    </p>
                  </div>
                  <WalletConnect />
                </div>
              </div>

              <div className="text-center">
                <Separator className="my-6 bg-white/20" />
                <p className="text-xs text-gray-400">
                  By connecting, you agree to our terms of service and privacy policy
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress System Preview */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#00D9FF] to-cyan-300 bg-clip-text text-transparent mb-8">Your Journey to Neural Master</h2>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            {["Dream Seeker", "Sleep Chaser", "Dream Weaver", "Neural Architect", "Neural Master"].map((level, index) => (
              <div key={level} className="flex items-center">
                <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-lg rounded-lg px-4 py-2 border border-cyan-400/30 hover:border-cyan-400/50 transition-all">
                  <span className="text-white font-medium">{level}</span>
                </div>
                {index < 4 && (
                  <div className="w-8 h-0.5 bg-gradient-to-r from-[#00D9FF] to-cyan-300 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}