import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import BetaIndicator from "@/components/BetaIndicator";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Battles from "@/pages/Battles";
import LiveBattle from "@/pages/LiveBattle";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import UserProfilePage from "@/pages/UserProfilePage";
import SteezeStack from "@/pages/SteezeStack";
import Settings from "@/pages/Settings";
import WhitelistAdmin from "@/pages/WhitelistAdmin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading during authentication check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
        {/* Animated Neural Network Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black"></div>
          {/* Hexagonal Grid Pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                  <polygon points="24.8,22 37.3,29.2 37.3,43.7 24.8,50.9 12.3,43.7 12.3,29.2" fill="none" stroke="rgba(0, 217, 255, 0.1)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hexagons)" />
            </svg>
          </div>
          {/* Scanning Lines */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[scan_3s_ease-in-out_infinite]"></div>
            <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scan_4s_ease-in-out_infinite_1s]"></div>
            <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[scan_3.5s_ease-in-out_infinite_0.5s]"></div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="relative z-10 text-center px-4">
          {/* Hexagonal Spinner */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            {/* Rotating Hexagons */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill="none" stroke="url(#grad1)" strokeWidth="2" className="opacity-80" />
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#00D9FF', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#0099FF', stopOpacity: 0.5 }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="absolute inset-4 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill="none" stroke="url(#grad2)" strokeWidth="1.5" className="opacity-60" />
                <defs>
                  <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#0066FF', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#00D9FF', stopOpacity: 0.5 }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {/* Center Pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-cyan-400 rounded-full shadow-[0_0_20px_rgba(0,217,255,0.8)] animate-pulse"></div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-wider">
              <span className="inline-block bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                INITIALIZING
              </span>
            </h2>
            <div className="flex items-center justify-center gap-2 font-mono text-cyan-400/80">
              <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              <span className="text-sm tracking-widest">NEURAL NETWORK SYNC</span>
              <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></span>
            </div>
            {/* Loading Bar */}
            <div className="w-64 mx-auto mt-6">
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
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
      <Route path="/battles/:id" component={LiveBattle} />
      <Route path="/arena" component={Battles} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/:userId" component={UserProfilePage} />
      <Route path="/user/:userId" component={UserProfilePage} />
      <Route path="/potions" component={SteezeStack} />
      <Route path="/settings" component={Settings} />
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
