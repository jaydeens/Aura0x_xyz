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
import { Zap, Home, Sword, Trophy, Coins, User, LogOut, Menu, X, Settings, Book } from "lucide-react";
import { useState } from "react";
import auraLogo from "@assets/AURA PNG (1)_1749403291114.png";
import auraTextLogo from "@assets/FULL AURA (1)_1749403707745.png";

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
        // Redirect to home page after successful logout
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
    { path: "/battles", label: "Live Battles", icon: Sword },
    { path: "/leaderboard", label: "Trending", icon: Trophy },
    { path: "/steeze-stack", label: "Steeze Recharge", icon: Coins },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-xl border-b border-pink-500/30">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer space-x-3">
              <div className="relative">
                <img 
                  src={auraLogo} 
                  alt="AURA Logo" 
                  className="w-10 h-10 rounded-xl shadow-lg animate-pulse"
                />
              </div>
              <img 
                src={auraTextLogo} 
                alt="AURA" 
                className="h-6 w-auto"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`group flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 ease-in-out cursor-pointer font-bold text-sm uppercase tracking-wide ${
                      isActive(item.path)
                        ? "text-white bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg transform scale-105"
                        : "text-gray-300 hover:text-pink-400 hover:bg-pink-500/10 hover:scale-102 hover:shadow-md"
                    }`}
                  >
                    <Icon className="w-4 h-4 transition-transform duration-300 ease-in-out group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {/* Social Links */}
            <div className="hidden md:flex items-center space-x-2">
              {/* X (Twitter) Logo */}
              <a
                href="https://x.com/aura"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
                title="Follow us on X"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* Gitbook Logo */}
              <a
                href="https://aura-13.gitbook.io/aura/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
                title="Read Documentation"
              >
                <Book className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            </div>

            {/* Aura Points Display */}
            {!isLoading && isAuthenticated && currentUser && (
              <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-pink-500/20 to-purple-600/20 px-4 py-2 rounded-2xl border border-pink-500/30 backdrop-blur-sm">
                <Coins className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-black text-white">
                  {currentUser.auraPoints?.toLocaleString() || "0"}
                </span>
                <span className="text-xs text-pink-400 font-bold uppercase tracking-wide">AURA</span>
              </div>
            )}

            {/* Notification Bell */}
            {!isLoading && isAuthenticated && <NotificationBell />}

            {/* Wallet Status */}
            {!isLoading && isAuthenticated && currentUser?.walletAddress ? (
              <div className="hidden sm:flex items-center space-x-2 bg-card px-3 py-2 rounded-lg border border-green-500/30">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">
                  {currentUser.walletAddress.slice(0, 6)}...{currentUser.walletAddress.slice(-4)}
                </span>
              </div>
            ) : null}

            {/* User Menu */}
            {isLoading ? (
              // Show loading skeleton during auth check
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block w-20 h-8 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-2xl animate-pulse"></div>
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-full animate-pulse"></div>
              </div>
            ) : isAuthenticated && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage
                        src={currentUser.profileImageUrl || ""}
                        alt={currentUser.firstName || currentUser.username || "User"}
                      />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {(currentUser.firstName?.[0] || currentUser.username?.[0] || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card border-primary/20" align="end">
                  <DropdownMenuLabel className="text-white">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {currentUser.firstName || currentUser.username || "User"}
                      </p>
                      <p className="text-xs text-gray-400">{currentUser.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-primary/20" />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${currentUser.id}`} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary/20" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white"
                onClick={() => window.location.href = "/"}
              >
                <Zap className="w-4 h-4 mr-2" />
                Connect
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 border-t border-primary/20">
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
                          ? "text-primary bg-primary/10 scale-105"
                          : "text-gray-300 hover:text-primary hover:bg-primary/5 hover:scale-102"
                      }`}
                      style={{ transitionDelay: `${index * 50}ms` }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
              
              {/* Mobile Wallet Connect - only show if not authenticated */}
              {!isAuthenticated && !currentUser && (
                <Button
                  variant="outline"
                  className="w-full mt-4 border-primary/50 text-primary hover:bg-primary hover:text-white"
                  onClick={() => window.location.href = '/auth'}
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
