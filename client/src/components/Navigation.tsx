import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { Zap, Home, Sword, Trophy, Coins, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = user as any;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };



  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/battles", label: "Battles", icon: Sword },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/vouch", label: "Vouch", icon: Coins },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="h-10 flex items-center justify-center">
                <img src="/logo.png" alt="Aura Logo" className="h-8" />
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      isActive(item.path)
                        ? "text-primary bg-primary/10"
                        : "text-gray-300 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {/* Aura Points Display */}
            {isAuthenticated && currentUser && (
              <div className="hidden sm:flex items-center space-x-2 bg-card px-3 py-2 rounded-lg border border-primary/20">
                <Coins className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">
                  {currentUser.auraPoints?.toLocaleString() || "0"}
                </span>
                <span className="text-xs text-gray-400">Aura</span>
              </div>
            )}

            {/* Notification Bell */}
            {isAuthenticated && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => {
                  // Navigate to My Battles tab when clicked
                  window.location.href = '/battles?tab=my-battles';
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  1
                </Badge>
              </Button>
            )}

            {/* Wallet Status */}
            {isAuthenticated && currentUser?.walletAddress ? (
              <div className="hidden sm:flex items-center space-x-2 bg-card px-3 py-2 rounded-lg border border-green-500/30">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">
                  {currentUser.walletAddress.slice(0, 6)}...{currentUser.walletAddress.slice(-4)}
                </span>
              </div>
            ) : null}

            {/* User Menu */}
            {isAuthenticated && currentUser ? (
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
                onClick={() => (window.location.href = "/api/login")}
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
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary/20">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors cursor-pointer ${
                        isActive(item.path)
                          ? "text-primary bg-primary/10"
                          : "text-gray-300 hover:text-primary hover:bg-primary/5"
                      }`}
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
        )}
      </div>
    </nav>
  );
}
