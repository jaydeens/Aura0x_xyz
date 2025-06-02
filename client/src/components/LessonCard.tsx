import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Zap, Clock, BookOpen, X, ExternalLink, CheckCircle, HelpCircle } from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  content: string;
  keyTakeaways: string[];
  auraReward: number;
  difficulty: string;
  estimatedReadTime: number;
  isActive: boolean;
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectAnswer?: number;
  quizExplanation?: string;
  createdAt: string;
}

interface LessonCardProps {
  lesson: Lesson;
}

interface LessonStatus {
  completed: boolean;
  quizCompleted: boolean;
  auraEarned: number;
}

export default function LessonCard({ lesson }: LessonCardProps) {
  const [showFullLesson, setShowFullLesson] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [tweetUrl, setTweetUrl] = useState("");
  const [quizFeedback, setQuizFeedback] = useState<{correct: boolean; explanation: string} | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if lesson is already completed today
  const { data: lessonStatus } = useQuery({
    queryKey: [`/api/lessons/${lesson.id}/status`],
    enabled: showFullLesson, // Only check when user opens the lesson
  }) as { data: LessonStatus | undefined };

  const submitQuizMutation = useMutation({
    mutationFn: async (data: { lessonId: number; answer: number }) => {
      const response = await fetch(`/api/lessons/${data.lessonId}/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ answer: data.answer }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(JSON.stringify(result));
      }
      
      return result;
    },
    onSuccess: (data) => {
      console.log("Quiz response:", data); // Debug log
      if (data.correct) {
        setQuizCompleted(true);
        setShowQuiz(false); // Hide quiz form
        setQuizFeedback({ correct: true, explanation: data.explanation });
        toast({
          title: "Quiz Completed!",
          description: "You can now share your achievement on X to complete the lesson.",
        });
      } else {
        // For incorrect answers, clear the selection so user can try again
        setQuizAnswer(null);
        setQuizFeedback({ correct: false, explanation: data.explanation || data.message });
        toast({
          title: "Incorrect Answer",
          description: data.message || "Try again! Review the lesson content.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.log("Quiz error:", error); // Debug log
      toast({
        title: "Quiz Error",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeLesson = useMutation({
    mutationFn: async (data: { lessonId: number; tweetUrl: string }) => {
      setIsCompleting(true);
      const response = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setIsCompleting(false);
        console.error("Lesson completion error:", errorData);
        throw new Error(errorData.message || "Failed to complete lesson");
      }
      
      const result = await response.json();
      setIsCompleting(false);
      return result;
    },
    onSuccess: (data) => {
      setIsCompleting(false);
      toast({
        title: "Lesson Completed!",
        description: `You earned ${data.auraEarned} aura points!`,
      });
      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons/daily"] });
      setShowFullLesson(false);
    },
    onError: (error: any) => {
      setIsCompleting(false);
      console.error("Complete lesson error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete lesson",
        variant: "destructive",
      });
    },
  });

  const handleSubmitQuiz = () => {
    console.log("Submit quiz clicked, quizAnswer:", quizAnswer); // Debug log
    if (quizAnswer === null || quizAnswer === undefined) {
      toast({
        title: "Please select an answer",
        description: "Choose one of the options before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitQuizMutation.mutate({
      lessonId: lesson.id,
      answer: Number(quizAnswer),
    });
  };

  const handleCompleteLesson = () => {
    if (!tweetUrl.trim()) {
      toast({
        title: "Tweet URL Required",
        description: "Please paste the URL of your tweet to complete the lesson.",
        variant: "destructive",
      });
      return;
    }

    completeLesson.mutate({
      lessonId: lesson.id,
      tweetUrl: tweetUrl.trim(),
    });
  };

  const copyTweetText = () => {
    const tweetText = `Just completed "${lesson.title}" on Aura! 🚀\n\nKey Web3 insights gained today. Building my aura in the decentralized future! 💪\n\n#Web3 #Aura #DeFi #Learning`;
    navigator.clipboard.writeText(tweetText);
    toast({
      title: "Copied!",
      description: "Tweet text copied to clipboard.",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/40';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold text-white mb-2 leading-tight">
              {lesson.title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{lesson.estimatedReadTime} min read</span>
              </div>
              <Badge variant="outline" className={`text-xs ${getDifficultyColor(lesson.difficulty)}`}>
                {lesson.difficulty}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1 text-accent font-semibold">
              <Zap className="w-4 h-4" />
              <span>+100</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
            {lesson.content.slice(0, 150)}...
          </p>
          
          <Dialog open={showFullLesson} onOpenChange={setShowFullLesson}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary" />
                  {lesson.title}
                </DialogTitle>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{lesson.estimatedReadTime} min read</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getDifficultyColor(lesson.difficulty)}`}>
                    {lesson.difficulty}
                  </Badge>
                  <div className="flex items-center gap-1 text-accent font-semibold">
                    <Zap className="w-4 h-4" />
                    <span>+100 Aura Points</span>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6 mt-6">
                <div className="prose prose-invert max-w-none">
                  <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                    {lesson.content}
                  </div>
                </div>

                {/* Key Takeaways */}
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent" />
                    Key Takeaways
                  </h3>
                  <ul className="space-y-2">
                    {lesson.keyTakeaways.map((takeaway, index) => (
                      <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-accent font-bold mt-0.5">•</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator className="bg-slate-700" />

                {/* Show lesson completion status */}
                {lessonStatus?.completed && (
                  <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-green-400">Lesson Completed!</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-300">+{lessonStatus.auraEarned} Aura Points</p>
                      </div>
                    </div>
                    <p className="text-sm text-green-300">
                      You've successfully completed today's lesson and shared it on X. Come back tomorrow for your next Web3 aura building lesson!
                    </p>
                  </div>
                )}

                {/* Show button to start quiz if lesson has no quiz section shown yet and not completed */}
                {lesson.quizQuestion && lesson.quizOptions && !quizCompleted && !showQuiz && !lessonStatus?.completed && (
                  <div className="text-center">
                    <Button
                      onClick={() => setShowQuiz(true)}
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white"
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Take Knowledge Check
                    </Button>
                  </div>
                )}

                {/* Quiz Section */}
                {showQuiz && lesson.quizQuestion && lesson.quizOptions && !quizCompleted && !lessonStatus?.completed && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-accent" />
                      Knowledge Check
                    </h3>
                    
                    <div className="space-y-4">
                      <p className="text-slate-300 font-medium">{lesson.quizQuestion}</p>
                      
                      <RadioGroup 
                        value={quizAnswer?.toString() || ""} 
                        onValueChange={(value) => {
                          console.log("Radio selection changed:", value); // Debug log
                          setQuizAnswer(Number(value));
                        }}
                        className="space-y-3"
                      >
                        {lesson.quizOptions.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition-colors">
                            <RadioGroupItem value={index.toString()} id={`option-${index}`} className="text-accent" />
                            <Label htmlFor={`option-${index}`} className="text-slate-300 cursor-pointer flex-1">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {quizFeedback && !quizFeedback.correct && (
                        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <X className="w-3 h-3 text-white" />
                            </div>
                            <h4 className="font-semibold text-red-400">Incorrect Answer</h4>
                          </div>
                          <p className="text-sm text-red-300">
                            {quizFeedback.explanation}
                          </p>
                          <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                            <p className="text-xs text-red-200">
                              💡 Tip: Review the lesson content above and try again. The correct answer demonstrates deep Web3 knowledge.
                            </p>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleSubmitQuiz}
                        disabled={quizAnswer === null || quizAnswer === undefined || submitQuizMutation.isPending}
                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white disabled:opacity-50"
                      >
                        {submitQuizMutation.isPending ? "Checking..." : "Submit Answer"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* X (Twitter) Sharing Section */}
                {quizCompleted && !lessonStatus?.completed && (
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <X className="w-5 h-5 text-blue-400" />
                      Share on X
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                        <p className="text-slate-300 text-sm mb-3">
                          Share your completion on X to unlock your aura points:
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={copyTweetText}
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-300 hover:bg-slate-800"
                          >
                            Copy Tweet Text
                          </Button>
                          <Button
                            onClick={() => {
                              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just completed "${lesson.title}" on Aura! 🚀\n\nKey Web3 insights gained today. Building my aura in the decentralized future! 💪\n\n#Web3 #Aura #DeFi #Learning`)}`);
                            }}
                            size="sm"
                            className="bg-black hover:bg-gray-800 text-white"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Post Now
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg p-3 space-y-3">
                        <p className="text-amber-300 text-sm text-center">
                          After posting, claim your aura points below:
                        </p>
                        <Button
                          onClick={() => {
                            completeLesson.mutate({
                              lessonId: lesson.id,
                              tweetUrl: "shared",
                            });
                          }}
                          disabled={isCompleting}
                          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                        >
                          {isCompleting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Claiming...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Claim +100 APs
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white"
            onClick={() => setShowFullLesson(true)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Build Aura
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}