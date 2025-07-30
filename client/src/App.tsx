import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import BetaIndicator from "@/components/BetaIndicator";
import TikTokLanding from "@/pages/TikTokLanding";
import NewDashboard from "@/pages/NewDashboard";
import ModernBattles from "@/pages/ModernBattles";
import ModernLeaderboard from "@/pages/ModernLeaderboard";
import LiveBattle from "@/pages/LiveBattle";
import ModernProfile from "@/pages/ModernProfile";
import SteezeStack from "@/pages/SteezeStack";
import ModernSettings from "@/pages/ModernSettings";
import WhitelistAdmin from "@/pages/WhitelistAdmin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading during authentication check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-2xl font-black bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent animate-pulse">
            LOADING AURA...
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, only show landing page
  if (!isAuthenticated || !user) {
    return (
      <Switch>
        <Route path="*" component={TikTokLanding} />
      </Switch>
    );
  }

  // If authenticated, show app routes
  return (
    <Switch>
      <Route path="/" component={NewDashboard} />
      <Route path="/battles" component={ModernBattles} />
      <Route path="/battles/:id" component={LiveBattle} />
      <Route path="/arena" component={ModernBattles} />
      <Route path="/leaderboard" component={ModernLeaderboard} />
      <Route path="/profile" component={ModernProfile} />
      <Route path="/profile/:userId" component={ModernProfile} />
      <Route path="/user/:userId" component={ModernProfile} />
      <Route path="/steeze-stack" component={SteezeStack} />
      <Route path="/settings" component={ModernSettings} />
      <Route path="/admin/whitelist" component={WhitelistAdmin} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <BetaIndicator />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
