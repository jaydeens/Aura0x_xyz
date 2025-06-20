import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Shield, Users, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WhitelistEntry {
  id: number;
  walletAddress: string;
  addedBy?: string;
  note?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WhitelistAdmin() {
  const [newWallet, setNewWallet] = useState("");
  const [newNote, setNewNote] = useState("");
  const [checkAddress, setCheckAddress] = useState("");
  const [accessStatus, setAccessStatus] = useState<boolean | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch whitelist entries
  const { data: whitelist = [], isLoading } = useQuery({
    queryKey: ['/api/whitelist'],
    queryFn: async (): Promise<WhitelistEntry[]> => {
      const response = await fetch('/api/whitelist');
      if (!response.ok) throw new Error('Failed to fetch whitelist');
      return await response.json();
    }
  });

  // Add wallet mutation
  const addWalletMutation = useMutation({
    mutationFn: async (data: { walletAddress: string; note?: string }) => {
      const response = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to add wallet');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whitelist'] });
      setNewWallet("");
      setNewNote("");
      toast({
        title: "Success",
        description: "Wallet added to whitelist successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add wallet to whitelist",
        variant: "destructive"
      });
    }
  });

  // Remove wallet mutation
  const removeWalletMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      const response = await fetch(`/api/whitelist/${walletAddress}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove wallet');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whitelist'] });
      toast({
        title: "Success",
        description: "Wallet removed from whitelist successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove wallet from whitelist",
        variant: "destructive"
      });
    }
  });

  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWallet.trim()) return;

    addWalletMutation.mutate({
      walletAddress: newWallet.trim(),
      note: newNote.trim() || undefined
    });
  };

  const handleRemoveWallet = (walletAddress: string) => {
    removeWalletMutation.mutate(walletAddress);
  };

  const checkBetaAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAddress.trim()) return;

    try {
      const response = await fetch(`/api/beta-access/${checkAddress.trim()}`);
      const data = await response.json();
      setAccessStatus(data.hasAccess);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check beta access",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Beta Access Management
            </h1>
          </div>
          <p className="text-gray-300">
            Manage wallet addresses for closed beta access to the Aura platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Wallet */}
          <Card className="bg-black/20 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Plus className="w-5 h-5" />
                Add Wallet to Whitelist
              </CardTitle>
              <CardDescription className="text-gray-300">
                Add a new wallet address to grant beta access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddWallet} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wallet-address" className="text-white">Wallet Address</Label>
                  <Input
                    id="wallet-address"
                    type="text"
                    placeholder="0x..."
                    value={newWallet}
                    onChange={(e) => setNewWallet(e.target.value)}
                    className="font-mono text-sm bg-black/30 border-purple-500/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-white">Note (Optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Reason for whitelisting..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="bg-black/30 border-purple-500/30 text-white"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!newWallet.trim() || addWalletMutation.isPending}
                >
                  {addWalletMutation.isPending ? "Adding..." : "Add to Whitelist"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Check Beta Access */}
          <Card className="bg-black/20 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="w-5 h-5" />
                Check Beta Access
              </CardTitle>
              <CardDescription className="text-gray-300">
                Verify if a wallet address has beta access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={checkBetaAccess} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="check-address" className="text-white">Wallet Address</Label>
                  <Input
                    id="check-address"
                    type="text"
                    placeholder="0x..."
                    value={checkAddress}
                    onChange={(e) => setCheckAddress(e.target.value)}
                    className="font-mono text-sm bg-black/30 border-blue-500/30 text-white"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!checkAddress.trim()}
                >
                  Check Access
                </Button>
                
                {accessStatus !== null && (
                  <Alert className={`border-2 ${accessStatus ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
                    <div className="flex items-center gap-2">
                      {accessStatus ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <AlertDescription className={accessStatus ? 'text-green-300' : 'text-red-300'}>
                        {accessStatus 
                          ? "This wallet has beta access" 
                          : "This wallet does not have beta access"
                        }
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Whitelist Entries */}
        <Card className="bg-black/20 border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5" />
              Whitelisted Wallets ({whitelist.length})
            </CardTitle>
            <CardDescription className="text-gray-300">
              Current list of wallet addresses with beta access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                <p className="text-gray-300 mt-4">Loading whitelist...</p>
              </div>
            ) : whitelist.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No whitelisted wallets yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {whitelist.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-purple-500/20"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-sm font-mono text-purple-300 bg-purple-900/30 px-2 py-1 rounded">
                          {entry.walletAddress}
                        </code>
                        <Badge variant={entry.isActive ? "default" : "secondary"}>
                          {entry.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-gray-400 mb-1">{entry.note}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Added {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveWallet(entry.walletAddress)}
                      disabled={removeWalletMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}