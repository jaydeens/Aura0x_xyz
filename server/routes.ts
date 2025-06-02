import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateDailyLessons, generateLessonAnalysis, generateLessonQuiz, validateTweetContent } from "./openai";
import { web3Service } from "./web3";
import { z } from "zod";

// Validation schemas
const createBattleSchema = z.object({
  opponentId: z.string(),
  stakeAmount: z.number().min(1),
});

const voteSchema = z.object({
  battleId: z.string(),
  votedForId: z.string(),
  vouchAmount: z.number().min(1),
});

const vouchSchema = z.object({
  toUserId: z.string(),
  usdtAmount: z.number().min(1),
  transactionHash: z.string(),
});

const completeLessonSchema = z.object({
  lessonId: z.number(),
  tweetUrl: z.string().url(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Twitter auth (optional - requires Twitter API keys)
  // setupTwitterAuth(app);

  // Seed aura levels on startup
  await storage.seedAuraLevels();

  // Wallet authentication route
  app.post('/api/auth/wallet', async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress || !web3Service.isValidAddress(walletAddress)) {
        return res.status(400).json({ message: "Invalid wallet address" });
      }

      // Check if user exists by wallet
      let user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        // Create new user with wallet
        const walletAge = await web3Service.getWalletAge(walletAddress);
        user = await storage.upsertUser({
          id: `wallet_${walletAddress.toLowerCase()}`,
          walletAddress: walletAddress.toLowerCase(),
          walletAge,
          auraPoints: 100, // Starting points
          currentStreak: 0,
          totalBattlesWon: 0,
          totalBattlesLost: 0,
          portfolioGrowth: "0",
          totalVouchesReceived: "0",
        });
      }

      // Store user in session
      (req as any).session.user = user;
      res.json(user);
    } catch (error) {
      console.error("Error authenticating wallet:", error);
      res.status(500).json({ message: "Failed to authenticate wallet" });
    }
  });

  // Link Twitter account to existing user
  app.post("/api/auth/link-twitter", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { twitterId, twitterUsername, twitterDisplayName } = req.body;

      if (!twitterId) {
        return res.status(400).json({ message: "Twitter ID is required" });
      }

      // Check if Twitter account is already linked to another user
      const existingUser = await storage.getUserByTwitter(twitterId);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "This Twitter account is already linked to another user" });
      }

      // Update current user with Twitter info
      const updatedUser = await storage.upsertUser({
        id: userId,
        twitterId,
        twitterUsername,
        twitterDisplayName,
      });

      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Error linking Twitter account:", error);
      res.status(500).json({ message: "Failed to link Twitter account" });
    }
  });

  // Link wallet address to existing user
  app.post("/api/auth/link-wallet", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { walletAddress } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({ message: "Invalid wallet address format" });
      }

      // Check if wallet is already linked to another user
      const existingUser = await storage.getUserByWallet(walletAddress);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "This wallet address is already linked to another user" });
      }

      // Update current user with wallet address
      const updatedUser = await storage.upsertUser({
        id: userId,
        walletAddress,
      });

      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Error linking wallet address:", error);
      res.status(500).json({ message: "Failed to link wallet address" });
    }
  });

  // Get current user route (works for both wallet and OAuth)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check for wallet authentication in session
      if (req.session?.user) {
        return res.json(req.session.user);
      }

      // Check for OAuth authentication
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        return res.json(user);
      }

      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Already logged out" });
    }
  });

  // Lesson routes
  app.get('/api/lessons', async (req, res) => {
    try {
      const lessons = await storage.getLessons(10);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.get('/api/lessons/daily', async (req, res) => {
    try {
      const today = new Date();
      let lessons = await storage.getDailyLessons(today);
      
      // If no lessons for today, generate new ones
      if (lessons.length === 0) {
        console.log("Generating daily lessons...");
        const generatedLessons = await generateDailyLessons(1);
        
        for (const lessonData of generatedLessons) {
          // Generate quiz for each lesson
          const quiz = await generateLessonQuiz(lessonData.title, lessonData.content);
          
          await storage.createLesson({
            title: lessonData.title,
            content: lessonData.content,
            keyTakeaways: lessonData.keyTakeaways,
            difficulty: lessonData.difficulty,
            estimatedReadTime: lessonData.estimatedReadTime,
            auraReward: 10,
            isActive: true,
            quizQuestion: quiz.question,
            quizOptions: quiz.options,
            quizCorrectAnswer: quiz.correctAnswer,
            quizExplanation: quiz.explanation,
          });
        }
        
        lessons = await storage.getDailyLessons(today);
      }
      
      // Always return only 1 lesson per day
      const dailyLesson = lessons.slice(0, 1);
      res.json(dailyLesson);
    } catch (error) {
      console.error("Error fetching daily lessons:", error);
      res.status(500).json({ message: "Failed to fetch daily lessons" });
    }
  });

  app.post('/api/lessons/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { lessonId, tweetUrl } = completeLessonSchema.parse(req.body);
      
      // Check if user already completed a lesson today
      const today = new Date();
      const existingLesson = await storage.getUserLessonByDate(userId, today);
      
      if (existingLesson) {
        return res.status(400).json({ message: "You have already completed a lesson today" });
      }
      
      // Get user to check current streak
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate new streak
      const lastLessonDate = user.lastLessonDate;
      let newStreak = 1;
      
      if (lastLessonDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const lastDate = new Date(lastLessonDate);
        lastDate.setHours(0, 0, 0, 0);
        
        if (lastDate.getTime() === yesterday.getTime()) {
          newStreak = (user.currentStreak || 0) + 1;
        }
      }
      
      // Complete the lesson
      const completedLesson = await storage.completeLesson({
        userId,
        lessonId,
        completed: true,
        tweetUrl,
        auraEarned: 10,
        completedAt: new Date(),
      });
      
      // Update user streak and aura points
      await storage.updateUserStreak(userId, newStreak);
      await storage.updateUserAura(userId, 10);
      
      res.json({
        lesson: completedLesson,
        newStreak,
        auraEarned: 10,
      });
    } catch (error) {
      console.error("Error completing lesson:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to complete lesson" });
    }
  });

  // Battle routes
  app.get('/api/battles', async (req, res) => {
    try {
      const status = req.query.status as string;
      const battles = await storage.getBattles(status);
      res.json(battles);
    } catch (error) {
      console.error("Error fetching battles:", error);
      res.status(500).json({ message: "Failed to fetch battles" });
    }
  });

  // Get user's battles
  app.get('/api/battles/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const battles = await storage.getUserBattles(userId);
      res.json(battles);
    } catch (error) {
      console.error("Error fetching user battles:", error);
      res.status(500).json({ message: "Failed to fetch battle" });
    }
  });

  app.get('/api/battles/:id', async (req, res) => {
    try {
      const battle = await storage.getBattle(req.params.id);
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }
      res.json(battle);
    } catch (error) {
      console.error("Error fetching battle:", error);
      res.status(500).json({ message: "Failed to fetch battle" });
    }
  });

  app.post('/api/battles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { opponentId, stakeAmount } = createBattleSchema.parse(req.body);
      
      // Check if user has enough aura points
      const user = await storage.getUser(userId);
      if (!user || (user.auraPoints || 0) < stakeAmount) {
        return res.status(400).json({ message: "Insufficient Aura Points" });
      }
      
      // Create battle
      const votingEndsAt = new Date();
      votingEndsAt.setHours(votingEndsAt.getHours() + 4); // 4 hour voting window
      
      const battle = await storage.createBattle({
        challengerId: userId,
        opponentId,
        challengerStake: stakeAmount,
        opponentStake: stakeAmount,
        status: "pending",
        votingEndsAt,
      });
      
      // Deduct stake from challenger
      await storage.updateUserAura(userId, -stakeAmount);
      
      res.json(battle);
    } catch (error) {
      console.error("Error creating battle:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create battle" });
    }
  });

  app.post('/api/battles/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { battleId, votedForId, vouchAmount } = voteSchema.parse(req.body);
      
      // Get user to check streak for multiplier
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate multiplier based on streak
      const { multiplier } = web3Service.applyStreakMultiplier(10, user.currentStreak || 0);
      
      // Create vote
      const vote = await storage.createBattleVote({
        battleId,
        voterId: userId,
        votedForId,
        vouchAmount: vouchAmount.toString(),
        multiplier: multiplier.toString(),
      });
      
      res.json(vote);
    } catch (error) {
      console.error("Error creating vote:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vote" });
    }
  });

  // Vouch routes
  app.post('/api/vouch', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { toUserId, usdtAmount, transactionHash } = vouchSchema.parse(req.body);
      
      // Verify transaction
      const txVerification = await web3Service.verifyTransaction(transactionHash);
      if (!txVerification.isValid) {
        return res.status(400).json({ message: "Invalid transaction" });
      }
      
      // Get user for multiplier calculation
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate aura points with multiplier
      const basePoints = web3Service.calculateVouchDistribution(usdtAmount).auraPoints;
      const { finalAuraPoints, multiplier } = web3Service.applyStreakMultiplier(basePoints, user.currentStreak || 0);
      
      // Create vouch record
      const vouch = await storage.createVouch({
        fromUserId: userId,
        toUserId,
        usdtAmount: usdtAmount.toString(),
        auraPoints: finalAuraPoints,
        multiplier: multiplier.toString(),
        transactionHash,
      });
      
      // Award aura points to recipient
      await storage.updateUserAura(toUserId, finalAuraPoints);
      
      res.json({
        vouch,
        auraAwarded: finalAuraPoints,
        multiplier,
      });
    } catch (error) {
      console.error("Error creating vouch:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vouch" });
    }
  });

  // Leaderboard routes
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // User profile routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get additional user stats
      const battles = await storage.getUserBattles(req.params.id);
      const vouches = await storage.getUserVouches(req.params.id);
      
      res.json({
        user,
        battleStats: {
          total: battles.length,
          won: battles.filter(b => b.winnerId === req.params.id).length,
          lost: battles.filter(b => b.winnerId && b.winnerId !== req.params.id).length,
        },
        vouchStats: {
          received: vouches.filter(v => v.toUserId === req.params.id).length,
          given: vouches.filter(v => v.fromUserId === req.params.id).length,
        },
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Aura levels route
  app.get('/api/aura-levels', async (req, res) => {
    try {
      const levels = await storage.getAuraLevels();
      res.json(levels);
    } catch (error) {
      console.error("Error fetching aura levels:", error);
      res.status(500).json({ message: "Failed to fetch aura levels" });
    }
  });

  // Web3 utility routes
  app.get('/api/web3/config', (req, res) => {
    try {
      const config = web3Service.getWalletConnectConfig();
      res.json(config);
    } catch (error) {
      console.error("Error getting web3 config:", error);
      res.status(500).json({ message: "Failed to get web3 config" });
    }
  });

  app.post('/api/web3/verify-transaction', async (req, res) => {
    try {
      const { transactionHash } = req.body;
      const verification = await web3Service.verifyTransaction(transactionHash);
      res.json(verification);
    } catch (error) {
      console.error("Error verifying transaction:", error);
      res.status(500).json({ message: "Failed to verify transaction" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
