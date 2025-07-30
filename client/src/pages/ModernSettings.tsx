import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ModernNavigation from "@/components/ModernNavigation";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Wallet,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  X,
  Edit3
} from "lucide-react";

export default function ModernSettings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const queryClient = useQueryClient();
  
  // Form states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [usernameMessage, setUsernameMessage] = useState("");
  
  // Settings states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [battleNotifications, setBattleNotifications] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState("public");

  const currentUser = user as any;

  // Username validation
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setIsUsernameValid(false);
      setUsernameMessage("Username must be at least 3 characters long");
      return;
    }

    if (username === currentUser?.username) {
      setIsUsernameValid(true);
      setUsernameMessage("This is your current username");
      return;
    }

    try {
      const response = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      
      if (data.available) {
        setIsUsernameValid(true);
        setUsernameMessage("Username is available");
      } else {
        setIsUsernameValid(false);
        setUsernameMessage("Username is already taken");
      }
    } catch (error) {
      setIsUsernameValid(false);
      setUsernameMessage("Error checking username availability");
    }
  };

  // Update username mutation
  const updateUsernameMutation = useMutation({
    mutationFn: (username: string) => 
      fetch('/api/users/update-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditingUsername(false);
      toast({
        title: "Username Updated",
        description: "Your username has been updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update username",
      });
    },
  });

  const handleUsernameEdit = () => {
    setNewUsername(currentUser?.username || '');
    setIsEditingUsername(true);
  };

  const handleUsernameSubmit = () => {
    if (isUsernameValid && newUsername.trim()) {
      updateUsernameMutation.mutate(newUsername.trim());
    }
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <ModernNavigation />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account preferences and privacy settings</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <Label className="text-white font-semibold">Username</Label>
                <div className="flex items-center gap-3">
                  {isEditingUsername ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={newUsername}
                        onChange={(e) => {
                          setNewUsername(e.target.value);
                          checkUsernameAvailability(e.target.value);
                        }}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                        placeholder="Enter new username"
                      />
                      {usernameMessage && (
                        <p className={`text-sm ${isUsernameValid ? 'text-green-400' : 'text-red-400'}`}>
                          {usernameMessage}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUsernameSubmit}
                          disabled={!isUsernameValid || updateUsernameMutation.isPending}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setIsEditingUsername(false)}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                        <p className="text-white font-medium">{currentUser?.username || 'Not set'}</p>
                      </div>
                      <Button
                        onClick={handleUsernameEdit}
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <Label className="text-white font-semibold">Wallet Address</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                    <p className="text-white font-mono">
                      {currentUser?.walletAddress || 'Not connected'}
                    </p>
                  </div>
                  {currentUser?.walletAddress && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      onClick={() => window.open(`https://basescan.org/address/${currentUser.walletAddress}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Profile Visibility */}
              <div className="space-y-2">
                <Label className="text-white font-semibold">Profile Visibility</Label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant={profileVisibility === 'public' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProfileVisibility('public')}
                    className={profileVisibility === 'public' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                    }
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Public
                  </Button>
                  <Button
                    variant={profileVisibility === 'private' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProfileVisibility('private')}
                    className={profileVisibility === 'private' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                    }
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Private
                  </Button>
                </div>
                <p className="text-sm text-gray-400">
                  {profileVisibility === 'public' 
                    ? 'Your profile is visible to everyone' 
                    : 'Only you can see your profile'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Email Notifications</Label>
                  <p className="text-sm text-gray-400">Receive updates via email</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator className="bg-gray-800" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Push Notifications</Label>
                  <p className="text-sm text-gray-400">Get notified in your browser</p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <Separator className="bg-gray-800" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Battle Notifications</Label>
                  <p className="text-sm text-gray-400">Get alerts about battles and challenges</p>
                </div>
                <Switch
                  checked={battleNotifications}
                  onCheckedChange={setBattleNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white font-semibold">Data Export</Label>
                <p className="text-sm text-gray-400">Download a copy of your data</p>
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  Export Data
                </Button>
              </div>

              <Separator className="bg-gray-800" />

              <div className="space-y-2">
                <Label className="text-white font-semibold">Delete Account</Label>
                <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Sign Out</p>
                  <p className="text-sm text-gray-400">Sign out of your account on this device</p>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}