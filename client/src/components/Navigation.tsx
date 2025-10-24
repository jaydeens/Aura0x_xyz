import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationBell from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { Zap, Home, Sword, Trophy, Coins, User, LogOut, Menu, X, Settings, Book, Brain, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = user as any;

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        window.location.href = "/";
      } else {
        toast({
          title: "Logout failed",
          description: "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed", 
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/battles", label: "Battles", icon: Sword },
    { path: "/leaderboard", label: "Rankings", icon: Trophy },
    { path: "/potions", label: "Potions", icon: Coins },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-r from-black/95 via-blue-950/90 to-black/95 backdrop-blur-xl border-b border-cyan-500/30 shadow-2xl shadow-cyan-500/20" data-testid="navbar-main">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 rounded-lg"></div>
        <div className="flex items-center justify-between h-14 sm:h-16 relative z-10">
          <Link href="/">
            <div className="flex items-center cursor-pointer space-x-2 group" data-testid="link-home">
              <div className="text-2xl sm:text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                DREAMZ
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`group flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out cursor-pointer font-bold text-sm uppercase tracking-wide ${
                      isActive(item.path)
                        ? "text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg transform scale-105"
                        : "text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:scale-102 hover:shadow-md"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4 transition-transform duration-300 ease-in-out group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            {!isLoading && isAuthenticated && currentUser && (
              <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 px-4 py-2 rounded-xl border border-cyan-500/30 backdrop-blur-sm" data-testid="display-dreamz-points">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-black text-white">
                  {currentUser.dreamzPoints?.toLocaleString() || "0"}
                </span>
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-wide">DREAMZ</span>
              </div>
            )}

            {!isLoading && isAuthenticated && <NotificationBell />}

            {!isLoading && isAuthenticated && currentUser?.walletAddress ? (
              <div className="hidden sm:flex items-center space-x-2 bg-cyan-900/30 px-3 py-2 rounded-lg border border-cyan-500/30" data-testid="display-wallet">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">
                  {currentUser.walletAddress.slice(0, 6)}...{currentUser.walletAddress.slice(-4)}
                </span>
              </div>
            ) : null}

            {isLoading ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block w-20 h-8 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-xl animate-pulse"></div>
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full animate-pulse"></div>
              </div>
            ) : isAuthenticated && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-10 w-10 border-2 border-cyan-500/30">
                      <AvatarImage
                        src={currentUser.profileImageUrl || ""}
                        alt={currentUser.firstName || currentUser.username || "User"}
                      />
                      <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                        {(currentUser.firstName?.[0] || currentUser.username?.[0] || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900 border-cyan-500/30" align="end">
                  <DropdownMenuLabel className="text-white">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {currentUser.firstName || currentUser.username || "User"}
                      </p>
                      <p className="text-xs text-gray-400">{currentUser.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-cyan-500/20" />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${currentUser.id}`} className="cursor-pointer" data-testid="link-profile">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer" data-testid="link-settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-cyan-500/20" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400" data-testid="button-logout">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                onClick={() => window.location.href = "/"}
                data-testid="button-connect"
              >
                <Zap className="w-4 h-4 mr-2" />
                Connect
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-cyan-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 border-t border-cyan-500/20">
            <div className="space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-300 ease-in-out cursor-pointer transform ${
                        mobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                      } ${
                        isActive(item.path)
                          ? "text-cyan-400 bg-cyan-500/10 scale-105"
                          : "text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/5 hover:scale-102"
                      }`}
                      style={{ transitionDelay: `${index * 50}ms` }}
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
              
              {!isAuthenticated && !currentUser && (
                <Button
                  variant="outline"
                  className="w-full mt-4 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-white"
                  onClick={() => window.location.href = '/auth'}
                  data-testid="button-mobile-connect"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
