import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
// Using X icon instead of logo for now

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

export default function LessonCard({ lesson }: LessonCardProps) {
  const [tweetUrl, setTweetUrl] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showFullLesson, setShowFullLesson] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<{correct: boolean; explanation: string} | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitQuizMutation = useMutation({
    mutationFn: async (data: { lessonId: number; answer: number }) => {
      return await apiRequest("POST", `/api/lessons/${data.lessonId}/quiz`, { answer: data.answer });
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
      // Handle 400 errors (incorrect answers) differently from other errors
      if (error.message.includes('400:')) {
        const errorData = JSON.parse(error.message.split('400: ')[1]);
        setQuizFeedback({ correct: false, explanation: errorData.explanation || errorData.message });
        toast({
          title: "Incorrect Answer",
          description: errorData.message || "Try again! Review the lesson content.",
          variant: "destructive",
        });
      } else {
        setQuizFeedback({ correct: false, explanation: error.message });
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

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
      setShowFullLesson(false);
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

  const handleSubmitQuiz = () => {
    if (!quizAnswer) {
      toast({
        title: "Select an Answer",
        description: "Please choose an option before submitting",
        variant: "destructive",
      });
      return;
    }

    submitQuizMutation.mutate({
      lessonId: lesson.id,
      answer: parseInt(quizAnswer),
    });
  };

  const handleCompleteLesson = async () => {
    if (!quizCompleted) {
      toast({
        title: "Complete Quiz First",
        description: "You need to complete the quiz before sharing on X",
        variant: "destructive",
      });
      return;
    }

    if (!tweetUrl.trim()) {
      toast({
        title: "X Post URL Required",
        description: "Please provide a valid X post URL to complete the lesson",
        variant: "destructive",
      });
      return;
    }

    if (!tweetUrl.includes("twitter.com") && !tweetUrl.includes("x.com")) {
      toast({
        title: "Invalid X Post URL",
        description: "Please provide a valid X (formerly Twitter) URL",
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

  const generateXPostText = () => {
    const text = `I just mastered "${lesson.title}" and boosted my Web3 aura! 💜 

Building my crypto reputation daily with strategic learning.

#AuraCertified #Web3Aura #CryptoLearning #DeFiEducation`;
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
              <h4 className="text-sm font-semibold text-accent mb-2">Key Aura-Building Strategies:</h4>
              <ul className="space-y-1">
                {lesson.keyTakeaways.slice(0, 2).map((takeaway, index) => (
                  <li key={index} className="text-xs text-gray-400 flex items-start">
                    <span className="text-primary mr-2">•</span>
                    {takeaway}
                  </li>
                ))}
                {lesson.keyTakeaways.length > 2 && (
                  <li className="text-xs text-gray-500">
                    +{lesson.keyTakeaways.length - 2} more strategies
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
                      Key Aura-Building Strategies:
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

                {/* Quiz Section */}
                {lesson.quizQuestion && lesson.quizOptions && !quizCompleted && showQuiz && (
                  <div className="bg-muted/50 border border-primary/20 rounded-lg p-4 space-y-4">
                    <h4 className="font-bold text-white flex items-center">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Knowledge Check
                    </h4>
                    
                    <div className="space-y-4">
                      <p className="text-gray-300">{lesson.quizQuestion}</p>
                      
                      <RadioGroup value={quizAnswer} onValueChange={setQuizAnswer}>
                        {lesson.quizOptions.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={index.toString()} 
                              id={`option-${index}`}
                              className="border-primary data-[state=checked]:bg-primary"
                            />
                            <Label 
                              htmlFor={`option-${index}`} 
                              className="text-gray-300 cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {quizFeedback && (
                        <div className={`p-3 rounded-lg ${quizFeedback.correct ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>
                          <p className={`text-sm ${quizFeedback.correct ? 'text-green-400' : 'text-red-400'}`}>
                            {quizFeedback.explanation}
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={handleSubmitQuiz}
                        disabled={!quizAnswer || submitQuizMutation.isPending}
                        className="w-full bg-primary hover:bg-primary/80"
                      >
                        {submitQuizMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Submit Answer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quiz Completed - Show X Sharing */}
                {quizCompleted && (
                  <div className="bg-muted/50 border border-primary/20 rounded-lg p-4 space-y-4">
                    <h4 className="font-bold text-white flex items-center">
                      <X className="w-4 h-4 mr-2" />
                      Share Your Achievement on X
                    </h4>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-gray-400">
                        1. Share your Web3 aura progress on X to complete this lesson:
                      </p>
                      
                      <Button
                        className="w-full bg-black hover:bg-gray-800 text-white border border-gray-600"
                        onClick={() => window.open(generateXPostText(), "_blank")}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Post on X
                      </Button>
                      
                      <p className="text-sm text-gray-400">
                        2. Paste your X post URL here to earn your aura points:
                      </p>
                      
                      <div className="flex space-x-2">
                        <Input
                          placeholder="https://x.com/username/status/... or https://twitter.com/username/status/..."
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
                )}

                {/* Show button to start quiz if lesson has no quiz section shown yet */}
                {lesson.quizQuestion && lesson.quizOptions && !quizCompleted && !showQuiz && (
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