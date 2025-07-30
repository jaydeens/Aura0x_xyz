import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home,
  Trophy, 
  Swords, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  Menu,
  X,
  Flame,
  Users,
  BookOpen
} from "lucide-react";
import { useState, useEffect } from "react";
// Remove Web3AuthButton import for now
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ModernNavigation() {
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch notifications count
  const { data: notificationCount = 0 } = useQuery({
    queryKey: ["/api/notifications/count"],
    enabled: isAuthenticated,
  });

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navigation = [
    { name: 'Discover', href: '/', icon: Home, current: location === '/' },
    { name: 'Battles', href: '/battles', icon: Swords, current: location.startsWith('/battles') },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy, current: location === '/leaderboard' },
  ];

  if (!isAuthenticated) {
    return (
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Aura
              </span>
            </Link>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              Connect Wallet
            </Button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Aura
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button 
                      variant={item.current ? "secondary" : "ghost"} 
                      size="sm" 
                      className={`text-gray-300 hover:text-white transition-colors ${
                        item.current 
                          ? "bg-gray-800 text-white" 
                          : "hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Aura Points */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gray-900 rounded-lg border border-gray-800">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-white">{(user as any)?.auraPoints || 0}</span>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 relative">
              <Bell className="w-4 h-4 text-gray-400" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white">
                    {(user as any)?.username || (user as any)?.twitterDisplayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(user as any)?.auraPoints || 0} Aura Points
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-gray-800" />
                <Link href="/profile">
                  <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem 
                  onClick={logout}
                  className="text-red-400 hover:text-red-300 hover:bg-gray-800"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 py-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button 
                      variant={item.current ? "secondary" : "ghost"} 
                      size="sm" 
                      className={`w-full justify-start text-gray-300 hover:text-white ${
                        item.current 
                          ? "bg-gray-800 text-white" 
                          : "hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
              
              {/* Mobile Aura Points */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-900 rounded-lg border border-gray-800 mx-3 mt-4">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-white">{(user as any)?.auraPoints || 0} Aura Points</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}