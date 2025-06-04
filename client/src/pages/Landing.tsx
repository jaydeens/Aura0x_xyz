import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Star, Users, BookOpen, Play, CheckCircle, TrendingUp, Award, Target } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function Landing() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch real-time platform statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['/api/leaderboard'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: activeBattles } = useQuery({
    queryKey: ['/api/battles'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // User is on landing page, this is expected
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleWatchDemo = () => {
    toast({
      title: "Demo Coming Soon",
      description: "Battle demos will be available once you join the platform!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-semibold text-foreground">
                LearnHub
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#challenges" className="text-muted-foreground hover:text-foreground transition-colors">Challenges</a>
              <a href="#leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">Leaderboard</a>
            </div>

            <div className="flex items-center space-x-4">
              <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="pt-16 pb-24 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
              Master Skills Through
              <span className="text-primary block">Interactive Learning</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Complete daily lessons, track your progress, and compete with others in knowledge challenges. Build expertise through consistent learning and friendly competition.
            </p>
            

            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="text-lg px-8 py-4"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Learning
              </Button>
              <Button 
                variant="outline" 
                onClick={handleWatchDemo}
                size="lg"
                className="text-lg px-8 py-4"
              >
                <Clock className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{(stats as any)?.totalUsers || 0}</div>
                <div className="text-sm text-muted-foreground">Active Learners</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{(stats as any)?.totalAura || 0}</div>
                <div className="text-sm text-muted-foreground">Points Earned</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{(stats as any)?.activeBattles || 0}</div>
                <div className="text-sm text-muted-foreground">Active Challenges</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">99%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>


          </div>
        </div>
      </section>
      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Everything You Need to Learn
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive learning platform with interactive lessons, progress tracking, and community challenges
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Daily Lessons */}
            <Card className="border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Daily Lessons</h3>
                <p className="text-muted-foreground mb-4">Complete interactive lessons with quizzes. Earn 10 points per completion and build your learning streak.</p>
                
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-2">Rewards per lesson</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Learning Points</span>
                      <span className="text-primary font-medium">+10 LP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Streak</span>
                      <span className="text-success font-medium">+1 day</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Tracking */}
            <Card className="border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-success/10 rounded-lg flex items-center justify-center mb-6">
                  <TrendingUp className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Progress Tracking</h3>
                <p className="text-muted-foreground mb-4">Monitor your learning journey with detailed analytics. Track completion rates, streak milestones, and skill development.</p>
                
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-2">Tracking features</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Daily Progress</span>
                      <span className="text-success font-medium">Real-time</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Achievement Badges</span>
                      <span className="text-warning font-medium">Unlockable</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Challenges */}
            <Card className="border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-warning/10 rounded-lg flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-warning" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Knowledge Challenges</h3>
                <p className="text-muted-foreground mb-4">Participate in timed challenges and compete with other learners. Test your knowledge in real-time competitions.</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2 text-primary" />
                    Real-time competitions
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Trophy className="w-4 h-4 mr-2 text-warning" />
                    Ranked leaderboards
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Award className="w-4 h-4 mr-2 text-success" />
                    Skill-based matching
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Features */}
            <Card className="border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Learning Community</h3>
                <p className="text-muted-foreground mb-4">Connect with fellow learners, share achievements, and support each other's learning journey.</p>
                
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-2">Community features</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Study Groups</span>
                      <span className="text-primary font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Active Challenges */}
      <section id="challenges" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Live Learning Challenges
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join real-time knowledge competitions and test your skills against other learners
            </p>
          </div>

          {/* Active Challenges Display */}
          <Card className="border border-border max-w-4xl mx-auto shadow-lg">
            <CardContent className="p-8">
              {activeBattles && Array.isArray(activeBattles) && activeBattles.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-semibold text-foreground">Active Challenges</h3>
                    <Badge className="bg-success/10 text-success border-success/20">
                      <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                      {activeBattles.length} Live
                    </Badge>
                  </div>
                  {activeBattles.slice(0, 3).map((battle: any) => (
                    <div key={battle.id} className="bg-muted/30 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-lg font-medium text-foreground">{battle.challengerName || 'Anonymous'}</div>
                          <span className="text-primary font-medium">VS</span>
                          <div className="text-lg font-medium text-foreground">{battle.opponentName || 'Anonymous'}</div>
                        </div>
                        <Badge variant="outline" className="border-primary text-primary">
                          Stakes: {battle.stakeAmount || 0} Points
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <Target className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-foreground">No Active Challenges</h3>
                  <p className="text-muted-foreground mb-6">Be the first to start a learning challenge and test your knowledge</p>
                  <Button 
                    onClick={handleLogin}
                    className="font-medium"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Join Challenge
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      {/* Leaderboard Preview */}
      <section id="leaderboard" className="py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Top Learners
            </h2>
            <p className="text-xl text-muted-foreground">See how you rank among our learning community</p>
          </div>

          <Card className="border border-border max-w-4xl mx-auto shadow-lg">
            <CardContent className="p-8">
              {leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Current Rankings</h3>
                    <p className="text-muted-foreground">Based on learning points and consistency</p>
                  </div>
                  {leaderboard.slice(0, 5).map((user: any, index: number) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{user.username || 'Anonymous'}</div>
                          <div className="text-sm text-muted-foreground">{user.totalBattlesWon || 0} challenges completed</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">{user.auraPoints || 0} Points</div>
                        <div className="text-sm text-muted-foreground">{user.currentStreak || 0} day streak</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-foreground">No Rankings Yet</h3>
                  <p className="text-muted-foreground mb-6">Be the first to complete lessons and climb the leaderboard</p>
                  <Button 
                    onClick={handleLogin}
                    className="font-medium"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Start Learning
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold text-foreground">
                  LearnHub
                </span>
              </div>
              <p className="text-muted-foreground mb-4">The comprehensive learning platform for skill development and knowledge mastery.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-foreground">Platform</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Daily Lessons</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Challenges</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Leaderboard</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-foreground">Community</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">User Profiles</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Study Groups</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 LearnHub. All rights reserved. Empowering learners worldwide.</p>
          </div>
        </div>
      </footer>
      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
