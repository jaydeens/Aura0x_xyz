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
import { Zap, Home, Sword, Trophy, Coins, User, LogOut, Menu, X, Settings, Brain, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    { path: "/chat", label: "AI Chat", icon: MessageSquare },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Desktop Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`hidden md:flex fixed top-4 left-4 z-50 items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl shadow-2xl shadow-cyan-500/50 transition-all duration-300 ${
          sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        data-testid="button-desktop-sidebar-toggle"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Desktop Left Sidebar */}
      <nav className={`hidden md:flex fixed left-0 top-0 h-screen w-64 z-50 bg-gradient-to-b from-black via-blue-950/90 to-black backdrop-blur-xl border-r border-cyan-500/30 shadow-2xl shadow-cyan-500/20 flex-col transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`} data-testid="navbar-main">
        <div className="flex flex-col h-full p-6">
          {/* Logo and Close Button */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/">
              <div className="flex items-center cursor-pointer group" data-testid="link-home">
                <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                  DREAMZ
                </div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
              data-testid="button-close-sidebar"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-cyan-400" />
            </button>
          </div>

          {/* User Info Card */}
          {!isLoading && isAuthenticated && currentUser && (
            <div className="mb-6 p-4 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-xl border border-cyan-500/30 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12 border-2 border-cyan-500/50">
                  <AvatarImage
                    src={currentUser.profileImageUrl || ""}
                    alt={currentUser.firstName || currentUser.username || "User"}
                  />
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-lg font-bold">
                    {(currentUser.firstName?.[0] || currentUser.username?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {currentUser.firstName || currentUser.username || "User"}
                  </div>
                  {currentUser.walletAddress && (
                    <div className="flex items-center gap-1 text-xs text-cyan-400/80">
                      <Zap className="w-3 h-3" />
                      <span className="truncate">
                        {currentUser.walletAddress.slice(0, 6)}...{currentUser.walletAddress.slice(-4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 bg-black/30 px-3 py-2 rounded-lg" data-testid="display-dreamz-points">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span className="text-lg font-black text-white">
                  {currentUser.dreamzPoints?.toLocaleString() || "0"}
                </span>
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">DREAMZ</span>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out cursor-pointer font-bold text-sm uppercase tracking-wide ${
                      isActive(item.path)
                        ? "text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg transform scale-105"
                        : "text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:scale-102 hover:shadow-md"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="w-5 h-5 transition-transform duration-300 ease-in-out group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom Section */}
          <div className="space-y-4 border-t border-cyan-500/20 pt-4">
            {!isLoading && isAuthenticated && <NotificationBell />}
            
            {isLoading ? (
              <div className="w-full h-12 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-xl animate-pulse"></div>
            ) : isAuthenticated && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" data-testid="button-user-menu">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900 border-cyan-500/30" align="end">
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
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                onClick={() => window.location.href = "/"}
                data-testid="button-connect"
              >
                <Zap className="w-4 h-4 mr-2" />
                Connect
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <nav className="md:hidden fixed top-0 w-full z-50 bg-gradient-to-r from-black/95 via-blue-950/90 to-black/95 backdrop-blur-xl border-b border-cyan-500/30 shadow-2xl shadow-cyan-500/20" data-testid="navbar-mobile">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center cursor-pointer group" data-testid="link-home-mobile">
                <div className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                  DREAMZ
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {!isLoading && isAuthenticated && currentUser && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 px-3 py-1.5 rounded-lg border border-cyan-500/30" data-testid="display-dreamz-points-mobile">
                  <Brain className="w-3 h-3 text-cyan-400" />
                  <span className="text-sm font-black text-white">
                    {currentUser.dreamzPoints?.toLocaleString() || "0"}
                  </span>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-cyan-400"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}>
            <div className="space-y-2 pb-4">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out cursor-pointer ${
                        isActive(item.path)
                          ? "text-white bg-gradient-to-r from-cyan-500 to-blue-600"
                          : "text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium uppercase tracking-wide">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
              
              {!isLoading && isAuthenticated && currentUser && (
                <div className="pt-3 mt-3 border-t border-cyan-500/20">
                  <Link href={`/profile/${currentUser.id}`}>
                    <div
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-link-profile"
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">Profile</span>
                    </div>
                  </Link>
                  <Link href="/settings">
                    <div
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-link-settings"
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-medium">Settings</span>
                    </div>
                  </Link>
                  <div
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 cursor-pointer"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    data-testid="mobile-button-logout"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Log out</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
