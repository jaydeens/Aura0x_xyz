import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import TwitterConnect from "@/components/TwitterConnect";
import WalletConnect from "@/components/WalletConnect";
import { Zap, Users, Trophy, TrendingUp } from "lucide-react";

export default function Auth() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <Zap className="h-12 w-12 text-yellow-400" fill="currentColor" />
              <div className="absolute inset-0 blur-lg bg-yellow-400 opacity-50"></div>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
              AURA
            </h1>
          </div>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The Web3 social platform where you build your reputation through daily learning, 
            community vouching, and epic 1v1 battles.
          </p>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Community Vouching</h3>
              <p className="text-gray-300 text-sm">Stake USDT to vouch for your favorite KOLs and earn Aura Points</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Epic Battles</h3>
              <p className="text-gray-300 text-sm">Challenge others to 1v1 battles and let the community vote</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Daily Learning</h3>
              <p className="text-gray-300 text-sm">Complete AI-generated Web3 lessons to build your knowledge</p>
            </div>
          </div>
        </div>

        {/* Authentication Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Join the Aura Community</CardTitle>
              <CardDescription className="text-gray-300">
                Connect your Twitter and wallet to start building your Web3 reputation
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
          <h2 className="text-3xl font-bold text-white mb-8">Your Journey to Aura Vader</h2>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            {["Clout Chaser", "Meme Lord", "Degen King", "Alpha Chad", "Aura Vader"].map((level, index) => (
              <div key={level} className="flex items-center">
                <div className="bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 border border-white/20">
                  <span className="text-white font-medium">{level}</span>
                </div>
                {index < 4 && (
                  <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}