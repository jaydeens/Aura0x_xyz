import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Twitter, ExternalLink, Share, Trophy, Target, Zap } from "lucide-react";

interface XStatus {
  connected: boolean;
  username: string | null;
  twitterId: string | null;
}

export default function SocialSharing() {
  const [customTweet, setCustomTweet] = useState("");
  const [includeAuraTag, setIncludeAuraTag] = useState(true);
  const [characterCount, setCharacterCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch X connection status
  const { data: xStatus, isLoading: statusLoading } = useQuery<XStatus>({
    queryKey: ["/api/social/x-status"],
  });

  // Post custom tweet mutation
  const postTweetMutation = useMutation({
    mutationFn: async (data: { content: string; includeAuraTag: boolean }) => {
      const response = await fetch("/api/social/post-tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Tweet Posted!",
        description: "Your tweet has been shared successfully.",
      });
      setCustomTweet("");
      setCharacterCount(0);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Post",
        description: error.message || "Unable to post tweet. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Share lesson completion mutation
  const shareLessonMutation = useMutation({
    mutationFn: async (data: { lessonTitle: string; auraEarned: number; streakDays?: number }) => {
      const response = await fetch("/api/lessons/share-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Achievement Shared!",
        description: "Your lesson completion has been posted to X.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Share",
        description: error.message || "Unable to share achievement.",
        variant: "destructive",
      });
    },
  });

  // Share milestone mutation
  const shareMilestoneMutation = useMutation({
    mutationFn: async (data: { milestone: string; totalAura: number; rank?: number }) => {
      const response = await fetch("/api/achievements/share-milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Milestone Shared!",
        description: "Your achievement has been posted to X.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Share",
        description: error.message || "Unable to share milestone.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    let finalText = customTweet;
    if (includeAuraTag && customTweet && !customTweet.includes('@AuraPlatform') && !customTweet.includes('#Aura')) {
      finalText += '\n\n#BuildingMyAura @AuraPlatform';
    }
    setCharacterCount(finalText.length);
  }, [customTweet, includeAuraTag]);

  const handleCustomTweet = () => {
    if (!customTweet.trim()) {
      toast({
        title: "Empty Tweet",
        description: "Please enter some content for your tweet.",
        variant: "destructive",
      });
      return;
    }

    if (characterCount > 280) {
      toast({
        title: "Tweet Too Long",
        description: "Your tweet exceeds the 280 character limit.",
        variant: "destructive",
      });
      return;
    }

    postTweetMutation.mutate({
      content: customTweet,
      includeAuraTag,
    });
  };

  const handleShareSampleLesson = () => {
    shareLessonMutation.mutate({
      lessonTitle: "DeFi Fundamentals: Understanding Liquidity Pools",
      auraEarned: 50,
      streakDays: 7,
    });
  };

  const handleShareSampleMilestone = () => {
    shareMilestoneMutation.mutate({
      milestone: "🎯 Reached 1,000 Aura Points!",
      totalAura: 1000,
      rank: 25,
    });
  };

  if (statusLoading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border-pink-500/30 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-pink-500/20 rounded w-1/4 mb-4"></div>
            <div className="h-20 bg-pink-500/10 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border-pink-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Twitter className="w-5 h-5 text-blue-400" />
            <span>X (Twitter) Integration</span>
          </CardTitle>
          <CardDescription className="text-gray-300">
            Connect your X account to share achievements and build your Aura reputation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {xStatus?.connected ? (
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-white font-medium">Connected to X</p>
                  <p className="text-gray-400 text-sm">@{xStatus.username}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                Active
              </Badge>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-white font-medium">X Account Not Connected</p>
                  <p className="text-gray-400 text-sm">Connect to start sharing achievements</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                onClick={() => window.open('/api/auth/twitter', '_blank')}
              >
                <Twitter className="w-4 h-4 mr-2" />
                Connect X
              </Button>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Custom Tweet Composer */}
      {xStatus?.connected && (
        <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border-pink-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Zap className="w-5 h-5 text-pink-400" />
              <span>Custom Tweet</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Share your thoughts about Aura and the creator community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="What's happening in your creator journey?"
                value={customTweet}
                onChange={(e) => setCustomTweet(e.target.value)}
                className="min-h-[100px] bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 resize-none"
                maxLength={280}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={includeAuraTag}
                    onCheckedChange={setIncludeAuraTag}
                    className="data-[state=checked]:bg-pink-500"
                  />
                  <span className="text-sm text-gray-300">Include Aura tag</span>
                </div>
                <span className={`text-sm ${characterCount > 280 ? 'text-red-400' : characterCount > 250 ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {characterCount}/280
                </span>
              </div>
            </div>

            <Button
              onClick={handleCustomTweet}
              disabled={postTweetMutation.isPending || !customTweet.trim() || characterCount > 280}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              {postTweetMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Posting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Twitter className="w-4 h-4" />
                  <span>Post Tweet</span>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}