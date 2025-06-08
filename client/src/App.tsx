import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Battles from "@/pages/Battles";
import LiveBattle from "@/pages/LiveBattle";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import SteezeStack from "@/pages/SteezeStack";
import Settings from "@/pages/Settings";
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
        <Route path="*" component={Landing} />
      </Switch>
    );
  }

  // If authenticated, show app routes
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/battles" component={Battles} />
      <Route path="/battle/:id" component={LiveBattle} />
      <Route path="/arena" component={Battles} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/:id" component={Profile} />
      <Route path="/steeze-stack" component={SteezeStack} />
      <Route path="/settings" component={Settings} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
