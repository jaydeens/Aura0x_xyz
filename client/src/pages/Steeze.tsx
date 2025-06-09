import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import SteezePurchase from "@/components/SteezePurchase";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, History, ExternalLink, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function Steeze() {
  const { user } = useAuth();
  const currentUser = user as any;

  // Get user's Steeze transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/steeze/transactions"],
    enabled: !!currentUser?.id,
  });

  // Get Steeze rate
  const { data: rateInfo } = useQuery({
    queryKey: ["/api/steeze/rate"],
  });

  // Get contract balance if user has a wallet
  const { data: contractBalance } = useQuery({
    queryKey: ["/api/steeze/balance", currentUser?.walletAddress],
    enabled: !!currentUser?.walletAddress,
  });

  const formatTransactionHash = (hash: string) => {
    if (!hash) return "N/A";
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "failed": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-full blur-xl animate-bounce-slow"></div>
      </div>
      
      <Navigation />
      <main className="relative pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
              Steeze Tokens
            </h1>
            <p className="text-white/60 text-lg">
              Purchase and manage your Steeze tokens on Base Sepolia
            </p>
          </div>

          <Tabs defaultValue="purchase" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 bg-black/20 border border-white/10">
              <TabsTrigger value="purchase" className="data-[state=active]:bg-purple-600/50">
                Purchase
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-purple-600/50">
                Transaction History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="purchase" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Purchase Component */}
                <div className="lg:col-span-2">
                  <SteezePurchase
                    userWalletAddress={currentUser?.walletAddress}
                    currentBalance={currentUser?.steezeBalance || 0}
                    onPurchaseComplete={() => {
                      // Refresh user data after successful purchase
                      window.location.reload();
                    }}
                  />
                </div>

                {/* Stats Sidebar */}
                <div className="space-y-6">
                  {/* Balance Card */}
                  <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Your Balance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-white/60">Platform Balance</p>
                          <p className="text-2xl font-bold text-white">
                            {(currentUser?.steezeBalance || 0).toLocaleString()} STEEZE
                          </p>
                        </div>
                        
                        {contractBalance && (
                          <div>
                            <p className="text-sm text-white/60">Contract Balance</p>
                            <p className="text-lg font-semibold text-white">
                              {contractBalance.balance.toLocaleString()} STEEZE
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rate Info */}
                  {rateInfo && (
                    <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Current Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-semibold text-white">
                          1 ETH = {rateInfo.steezePerEth.toLocaleString()} STEEZE
                        </p>
                        <p className="text-sm text-white/60 mt-1">
                          Base Sepolia Network
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Stats */}
                  <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-white">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/60">Total Transactions</span>
                        <span className="text-white">{transactions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Network</span>
                        <span className="text-white">Base Sepolia</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Chain ID</span>
                        <span className="text-white">84532</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="bg-gradient-to-br from-purple-800/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Transaction History
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Your Steeze purchase and transaction history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                      <p className="text-white/60 mt-2">Loading transactions...</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <Zap className="w-12 h-12 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60">No transactions yet</p>
                      <p className="text-white/40 text-sm">Make your first Steeze purchase to see transactions here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((tx: any) => (
                        <div 
                          key={tx.id} 
                          className="p-4 bg-black/20 rounded-xl border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-semibold capitalize">{tx.type}</p>
                                <p className="text-white/60 text-sm">
                                  {format(new Date(tx.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(tx.status)}>
                              {tx.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-white/60 text-sm">Amount</p>
                              <p className="text-white">{tx.amount.toLocaleString()} STEEZE</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-sm">ETH Paid</p>
                              <p className="text-white">{parseFloat(tx.usdtAmount).toFixed(4)} ETH</p>
                            </div>
                          </div>

                          {tx.transactionHash && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <div className="flex items-center justify-between">
                                <span className="text-white/60 text-sm">Transaction Hash</span>
                                <a
                                  href={`https://sepolia-explorer.base.org/tx/${tx.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors text-sm"
                                >
                                  {formatTransactionHash(tx.transactionHash)}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}