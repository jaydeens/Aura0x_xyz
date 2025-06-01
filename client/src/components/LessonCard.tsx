import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Zap, Clock, BookOpen, Twitter, ExternalLink, CheckCircle } from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  content: string;
  keyTakeaways: string[];
  auraReward: number;
  difficulty: string;
  estimatedReadTime: number;
  isActive: boolean;
  createdAt: string;
}

interface LessonCardProps {
  lesson: Lesson;
}

export default function LessonCard({ lesson }: LessonCardProps) {
  const [tweetUrl, setTweetUrl] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showFullLesson, setShowFullLesson] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeLessonMutation = useMutation({
    mutationFn: async (data: { lessonId: number; tweetUrl: string }) => {
      return await apiRequest("POST", "/api/lessons/complete", data);
    },
    onSuccess: () => {
      toast({
        title: "Lesson Completed!",
        description: `You earned ${lesson.auraReward} Aura Points and extended your streak!`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsCompleting(false);
      setTweetUrl("");
    },
    onError: (error) => {
      toast({
        title: "Failed to Complete Lesson",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setIsCompleting(false);
    },
  });

  const handleCompleteLesson = async () => {
    if (!tweetUrl.trim()) {
      toast({
        title: "Tweet URL Required",
        description: "Please provide a valid tweet URL to complete the lesson",
        variant: "destructive",
      });
      return;
    }

    if (!tweetUrl.includes("twitter.com") && !tweetUrl.includes("x.com")) {
      toast({
        title: "Invalid Tweet URL",
        description: "Please provide a valid Twitter/X URL",
        variant: "destructive",
      });
      return;
    }

    setIsCompleting(true);
    completeLessonMutation.mutate({
      lessonId: lesson.id,
      tweetUrl: tweetUrl.trim(),
    });
  };

  const generateTweetText = () => {
    const text = `I just completed "${lesson.title}" on @AuraPlatform 💜 Building my crypto knowledge daily! #AuraCertified #Web3Learning #CryptoEducation`;
    const encodedText = encodeURIComponent(text);
    return `https://twitter.com/intent/tweet?text=${encodedText}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-500/20 text-green-400 border-green-500/40";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      default:
        return "bg-primary/20 text-primary border-primary/40";
    }
  };

  return (
    <Card className="bg-card border-primary/20 hover:border-primary/40 transition-all duration-300 card-hover">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-white mb-2">
              {lesson.title}
            </CardTitle>
            <div className="flex items-center space-x-3 text-sm text-gray-400">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {lesson.estimatedReadTime} min read
              </div>
              <Badge variant="outline" className={getDifficultyColor(lesson.difficulty)}>
                {lesson.difficulty}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Zap className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-warning">
              {lesson.auraReward} Aura
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lesson Preview */}
        <div className="space-y-3">
          <p className="text-gray-300 text-sm line-clamp-3">
            {lesson.content.substring(0, 200)}...
          </p>
          
          {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-accent mb-2">Key Takeaways:</h4>
              <ul className="space-y-1">
                {lesson.keyTakeaways.slice(0, 2).map((takeaway, index) => (
                  <li key={index} className="text-xs text-gray-400 flex items-start">
                    <span className="text-primary mr-2">•</span>
                    {takeaway}
                  </li>
                ))}
                {lesson.keyTakeaways.length > 2 && (
                  <li className="text-xs text-gray-500">
                    +{lesson.keyTakeaways.length - 2} more takeaways
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <Separator className="bg-primary/20" />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={showFullLesson} onOpenChange={setShowFullLesson}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 border-primary/40 text-primary hover:bg-primary hover:text-white">
                <BookOpen className="w-4 h-4 mr-2" />
                Read Full Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card border-primary/20">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">
                  {lesson.title}
                </DialogTitle>
                <DialogDescription className="flex items-center space-x-4 text-gray-400">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {lesson.estimatedReadTime} min read
                  </div>
                  <Badge variant="outline" className={getDifficultyColor(lesson.difficulty)}>
                    {lesson.difficulty}
                  </Badge>
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-1 text-warning" />
                    <span className="text-warning">{lesson.auraReward} Aura</span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-6">
                <div className="prose prose-invert max-w-none">
                  <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {lesson.content}
                  </div>
                </div>

                {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="font-bold mb-3 text-accent flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Key Takeaways:
                    </h4>
                    <ul className="space-y-2">
                      {lesson.keyTakeaways.map((takeaway, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start">
                          <span className="text-primary mr-2 font-bold">•</span>
                          {takeaway}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Complete Lesson Section */}
                <div className="bg-muted/50 border border-primary/20 rounded-lg p-4 space-y-4">
                  <h4 className="font-bold text-white">Complete This Lesson</h4>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">
                      1. First, tweet about completing this lesson to earn your certification:
                    </p>
                    
                    <Button
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => window.open(generateTweetText(), "_blank")}
                    >
                      <Twitter className="w-4 h-4 mr-2" />
                      Tweet Certification
                    </Button>
                    
                    <p className="text-sm text-gray-400">
                      2. Then paste your tweet URL here to complete the lesson:
                    </p>
                    
                    <div className="flex space-x-2">
                      <Input
                        placeholder="https://twitter.com/username/status/..."
                        value={tweetUrl}
                        onChange={(e) => setTweetUrl(e.target.value)}
                        className="flex-1 bg-background border-primary/30 focus:border-primary"
                      />
                      <Button
                        onClick={handleCompleteLesson}
                        disabled={!tweetUrl.trim() || isCompleting}
                        className="bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white"
                      >
                        {isCompleting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white"
            onClick={() => setShowFullLesson(true)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Start Learning
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
