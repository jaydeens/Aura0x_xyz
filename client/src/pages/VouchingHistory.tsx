import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, TrendingUp, TrendingDown, ExternalLink, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Vouch {
  id: string;
  fromUserId: string;
  toUserId: string;
  usdtAmount: string;
  dreamzPoints: number;
  transactionHash: string;
  createdAt: string;
  fromUsername?: string;
  toUsername?: string;
}

interface VouchStats {
  vouchesGiven: number;
  vouchesReceived: number;
  totalUsdcGiven: number;
  totalUsdcReceived: number;
  totalDreamzReceived: number;
  recentVouches: Vouch[];
}

export default function VouchingHistory() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"all" | "given" | "received">("all");

  const { data: stats, isLoading } = useQuery<VouchStats>({
    queryKey: [`/api/vouch/stats/${user?.id}`],
    enabled: !!user?.id,
  });

  const filteredVouches = stats?.recentVouches?.filter((vouch) => {
    if (selectedTab === "given") return vouch.fromUserId === user?.id;
    if (selectedTab === "received") return vouch.toUserId === user?.id;
    return true;
  }) || [];

  const getSolscanUrl = (txHash: string) => {
    return `https://explorer.carv.io/tx/${txHash}?network=testnet`;
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1929] via-[#0D1F2D] to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00D9FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1929] via-[#0D1F2D] to-black text-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600/20 to-red-600/20 border border-pink-500/30 rounded-full px-6 py-2 mb-4">
              <Heart className="w-5 h-5 text-pink-400" />
              <span className="text-pink-400 font-bold text-sm uppercase tracking-wider">Vouching System</span>
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-pink-400 via-red-400 to-pink-500 bg-clip-text text-transparent mb-4" data-testid="heading-vouching-history">
              Vouching History
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto" data-testid="text-description">
              Track your reputation network and USDT vouches on CARV SVM
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-green-900/20 to-green-950/20 border-green-500/30" data-testid="card-vouches-given">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/40">Given</Badge>
                  </div>
                  <div className="text-3xl font-black text-green-400 mb-1" data-testid="text-vouches-given-count">{stats.vouchesGiven}</div>
                  <div className="text-sm text-gray-400">Vouches Given</div>
                  <div className="text-xl font-bold text-green-300 mt-2" data-testid="text-usdt-given">{stats.totalUsdcGiven.toFixed(2)} USDT</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border-blue-500/30" data-testid="card-vouches-received">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingDown className="w-5 h-5 text-blue-400" />
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">Received</Badge>
                  </div>
                  <div className="text-3xl font-black text-blue-400 mb-1" data-testid="text-vouches-received-count">{stats.vouchesReceived}</div>
                  <div className="text-sm text-gray-400">Vouches Received</div>
                  <div className="text-xl font-bold text-blue-300 mt-2" data-testid="text-usdt-received">{stats.totalUsdcReceived.toFixed(2)} USDT</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-950/20 border-cyan-500/30" data-testid="card-dreamz-earned">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40">Points</Badge>
                  </div>
                  <div className="text-3xl font-black text-cyan-400 mb-1" data-testid="text-dreamz-earned">{stats.totalDreamzReceived}</div>
                  <div className="text-sm text-gray-400">Dreamz Points</div>
                  <div className="text-xl font-bold text-cyan-300 mt-2">From Vouches</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-900/20 to-pink-950/20 border-pink-500/30" data-testid="card-total-vouches">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Heart className="w-5 h-5 text-pink-400" />
                    <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/40">Total</Badge>
                  </div>
                  <div className="text-3xl font-black text-pink-400 mb-1" data-testid="text-total-vouches">{stats.vouchesGiven + stats.vouchesReceived}</div>
                  <div className="text-sm text-gray-400">Total Vouches</div>
                  <div className="text-xl font-bold text-pink-300 mt-2">Network</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transaction History */}
          <Card className="bg-black/40 border-[#00D9FF]/30" data-testid="card-transaction-history">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-[#00D9FF]">
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-black/60 border border-[#00D9FF]/20">
                  <TabsTrigger value="all" className="data-[state=active]:bg-[#00D9FF] data-[state=active]:text-black" data-testid="tab-all">
                    All Vouches
                  </TabsTrigger>
                  <TabsTrigger value="given" className="data-[state=active]:bg-green-500 data-[state=active]:text-black" data-testid="tab-given">
                    Given
                  </TabsTrigger>
                  <TabsTrigger value="received" className="data-[state=active]:bg-blue-500 data-[state=active]:text-black" data-testid="tab-received">
                    Received
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={selectedTab} className="mt-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-black/40 border border-[#00D9FF]/20 rounded-lg p-4 animate-pulse" data-testid={`skeleton-vouch-${i}`}>
                          <div className="h-4 bg-[#00D9FF]/20 rounded w-2/3 mb-2"></div>
                          <div className="h-3 bg-[#00D9FF]/20 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredVouches.length > 0 ? (
                    <div className="space-y-3">
                      {filteredVouches.map((vouch) => {
                        const isGiven = vouch.fromUserId === user?.id;
                        const otherUsername = isGiven ? (vouch.toUsername || vouch.toUserId.slice(0, 8)) : (vouch.fromUsername || vouch.fromUserId.slice(0, 8));
                        
                        return (
                          <div
                            key={vouch.id}
                            className={cn(
                              "bg-black/40 border rounded-lg p-4 transition-all hover:border-[#00D9FF]/60 hover:shadow-[0_0_15px_#00D9FF]/20",
                              isGiven ? "border-green-500/30" : "border-blue-500/30"
                            )}
                            data-testid={`vouch-item-${vouch.id}`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={cn(
                                    "text-xs",
                                    isGiven 
                                      ? "bg-green-500/20 text-green-400 border-green-500/40" 
                                      : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                                  )} data-testid={`badge-direction-${vouch.id}`}>
                                    {isGiven ? "↑ Given" : "↓ Received"}
                                  </Badge>
                                  <span className="text-white font-bold" data-testid={`text-other-user-${vouch.id}`}>{otherUsername}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <span className="text-pink-400 font-bold" data-testid={`text-usdt-${vouch.id}`}>{parseFloat(vouch.usdtAmount).toFixed(2)} USDT</span>
                                  <span className="text-cyan-400" data-testid={`text-dreamz-${vouch.id}`}>{vouch.dreamzPoints} DRMZ</span>
                                  <span className="text-gray-500" data-testid={`text-date-${vouch.id}`}>
                                    {new Date(vouch.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <a
                                href={getSolscanUrl(vouch.transactionHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[#00D9FF] hover:text-[#00B8E6] transition-colors text-sm font-medium"
                                data-testid={`link-solscan-${vouch.id}`}
                              >
                                <ExternalLink className="w-4 h-4" />
                                View on Explorer
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12" data-testid="empty-vouches">
                      <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No vouches yet</p>
                      <p className="text-gray-500 text-sm mt-2">
                        {selectedTab === "given" 
                          ? "You haven't vouched for anyone yet" 
                          : selectedTab === "received"
                          ? "You haven't received any vouches yet"
                          : "No vouching activity yet"}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
