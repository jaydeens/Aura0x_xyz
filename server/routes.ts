import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { lessons as lessonsTable } from "../shared/schema";
import { eq } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateDailyLessons, generateLessonAnalysis, generateLessonQuiz, validateTweetContent } from "./openai";
import { web3Service } from "./web3";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
  tweetUrl: z.string().refine((url) => {
    return url === "shared" || url.includes('twitter.com') || url.includes('x.com');
  }, {
    message: "Must be 'shared' or a valid Twitter/X URL"
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file uploads
  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage_multer,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

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
        const walletAge = Math.floor(Math.random() * 365) + 30; // Random age to avoid network calls
        user = await storage.upsertUser({
          id: `wallet_${walletAddress.toLowerCase()}`,
          walletAddress: walletAddress.toLowerCase(),
          walletAge,
          auraPoints: 100, // Starting points for new users
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
      // Set no-cache headers to prevent browser caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      let userId: string | null = null;

      // Check for wallet authentication in session
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      // Check for OAuth authentication
      else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Always fetch fresh data from database, never return session data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(user);
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

  // User search endpoint  
  app.get('/api/users/search', async (req: any, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return res.json([]);
      }

      // Get current user ID from either wallet session or OAuth
      let currentUserId: string | null = null;
      if (req.session?.user?.id) {
        currentUserId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        currentUserId = req.user.claims.sub;
      }

      const users = await storage.searchUsers(query.trim(), currentUserId || undefined);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Battle management routes
  app.post('/api/battles/:id/accept', async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const battleId = req.params.id;
      const battle = await storage.getBattle(battleId);
      
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }
      
      if (battle.opponentId !== userId) {
        return res.status(403).json({ message: "Only the challenged user can accept this battle" });
      }
      
      if (battle.status !== 'challenge_sent' && battle.status !== 'pending') {
        return res.status(400).json({ message: "Battle cannot be accepted" });
      }

      // Update battle status
      const updatedBattle = await storage.updateBattle(battleId, { status: 'accepted' });
      
      // Create notification for challenger
      await storage.createNotification({
        id: `notif_${Date.now()}_${Math.random()}`,
        userId: battle.challengerId,
        type: "battle_accepted",
        title: "Battle Challenge Accepted!",
        message: "Your battle challenge has been accepted. The battle is now active!",
        relatedId: battleId,
      });

      res.json(updatedBattle);
    } catch (error) {
      console.error("Error accepting battle:", error);
      res.status(500).json({ message: "Failed to accept battle" });
    }
  });

  app.post('/api/battles/:id/reject', async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const battleId = req.params.id;
      const battle = await storage.getBattle(battleId);
      
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }
      
      if (battle.opponentId !== userId) {
        return res.status(403).json({ message: "Only the challenged user can reject this battle" });
      }

      // Update battle status
      const updatedBattle = await storage.updateBattle(battleId, { status: 'rejected' });
      
      // Create notification for challenger
      await storage.createNotification({
        id: `notif_${Date.now()}_${Math.random()}`,
        userId: battle.challengerId,
        type: "battle_rejected",
        title: "Battle Challenge Rejected",
        message: "Your battle challenge was rejected.",
        relatedId: battleId,
      });

      res.json(updatedBattle);
    } catch (error) {
      console.error("Error rejecting battle:", error);
      res.status(500).json({ message: "Failed to reject battle" });
    }
  });

  // Withdraw challenge (for challenger to cancel their own challenge)
  app.post('/api/battles/:id/withdraw', async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const battleId = req.params.id;
      const battle = await storage.getBattle(battleId);
      
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }
      
      if (battle.challengerId !== userId) {
        return res.status(403).json({ message: "Only the challenger can withdraw this battle" });
      }

      if (battle.status !== 'challenge_sent' && battle.status !== 'pending') {
        return res.status(400).json({ message: "Can only withdraw pending challenges" });
      }

      // Update battle status
      const updatedBattle = await storage.updateBattle(battleId, { status: 'withdrawn' });
      
      // Create notification for opponent (only if opponent exists)
      if (battle.opponentId) {
        console.log("Creating withdrawal notification for opponent:", battle.opponentId);
        await storage.createNotification({
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: battle.opponentId,
          type: "battle_withdrawn",
          title: "Battle Challenge Withdrawn",
          message: "A battle challenge directed to you has been withdrawn.",
          relatedId: battleId,
        });
      } else {
        console.log("No opponent ID found for battle:", battleId);
      }

      res.json(updatedBattle);
    } catch (error) {
      console.error("Error withdrawing battle:", error);
      res.status(500).json({ message: "Failed to withdraw battle" });
    }
  });

  // Request cancellation for accepted battles
  app.post('/api/battles/:id/request-cancellation', async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const battleId = req.params.id;
      const battle = await storage.getBattle(battleId);
      
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }
      
      if (battle.challengerId !== userId && battle.opponentId !== userId) {
        return res.status(403).json({ message: "Only battle participants can request cancellation" });
      }

      if (battle.status !== 'accepted') {
        return res.status(400).json({ message: "Can only request cancellation for accepted battles" });
      }

      // Update battle status
      const updatedBattle = await storage.updateBattle(battleId, { status: 'cancellation_requested' });
      
      // Create notification for the other party
      const otherUserId = battle.challengerId === userId ? battle.opponentId : battle.challengerId;
      await storage.createNotification({
        id: `notif_${Date.now()}_${Math.random()}`,
        userId: otherUserId,
        type: "battle_cancellation_requested",
        title: "Battle Cancellation Requested",
        message: "Your opponent has requested to cancel the accepted battle.",
        relatedId: battleId,
      });

      res.json(updatedBattle);
    } catch (error) {
      console.error("Error requesting cancellation:", error);
      res.status(500).json({ message: "Failed to request cancellation" });
    }
  });

  // Approve cancellation
  app.post('/api/battles/:id/approve-cancellation', async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const battleId = req.params.id;
      const battle = await storage.getBattle(battleId);
      
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }
      
      if (battle.challengerId !== userId && battle.opponentId !== userId) {
        return res.status(403).json({ message: "Only battle participants can approve cancellation" });
      }

      if (battle.status !== 'cancellation_requested') {
        return res.status(400).json({ message: "No cancellation request to approve" });
      }

      // Update battle status
      const updatedBattle = await storage.updateBattle(battleId, { status: 'cancelled' });
      
      // Create notification for the other party
      const otherUserId = battle.challengerId === userId ? battle.opponentId : battle.challengerId;
      await storage.createNotification({
        id: `notif_${Date.now()}_${Math.random()}`,
        userId: otherUserId,
        type: "battle_cancelled",
        title: "Battle Cancelled",
        message: "The battle has been cancelled by mutual agreement.",
        relatedId: battleId,
      });

      res.json(updatedBattle);
    } catch (error) {
      console.error("Error approving cancellation:", error);
      res.status(500).json({ message: "Failed to approve cancellation" });
    }
  });

  // Notification routes
  app.get('/api/notifications', async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Profile update routes
  app.post('/api/user/update-profile', async (req: any, res) => {
    try {
      let userId: string;
      
      // Get user ID from wallet session or OAuth
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { username, profileImageUrl, twitterUsername } = req.body;
      
      // Validate username if provided
      if (username) {
        if (username.length < 3 || username.length > 20) {
          return res.status(400).json({ message: "Username must be between 3 and 20 characters" });
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
        }
        
        const isAvailable = await storage.checkUsernameAvailability(username, userId);
        if (!isAvailable) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }

      const updatedUser = await storage.updateUserProfile(userId, { username, profileImageUrl, twitterUsername });
      
      // Update session if using wallet auth
      if (req.session?.user) {
        req.session.user = updatedUser;
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/user/check-username/:username', async (req: any, res) => {
    try {
      let userId: string | undefined;
      
      // Get user ID if authenticated
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      const { username } = req.params;
      const isAvailable = await storage.checkUsernameAvailability(username, userId);
      res.json({ available: isAvailable });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ message: "Failed to check username availability" });
    }
  });

  // Profile image upload endpoint
  app.post('/api/user/upload-profile-image', upload.single('profileImage'), async (req: any, res) => {
    try {
      let userId: string;
      
      // Get user ID from wallet session or OAuth
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Generate the image URL (accessible via static file serving)
      const imageUrl = `/uploads/${req.file.filename}`;

      res.json({ 
        imageUrl,
        message: "Profile image uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
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
      // Add no-cache headers to prevent browser caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const today = new Date();
      const forceRefresh = req.query.force === 'true';
      
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
      
      // If existing lessons don't have quiz data, add it
      for (const lesson of lessons) {
        if (!lesson.quizQuestion) {
          console.log(`Adding quiz to lesson: ${lesson.title}`);
          const quiz = await generateLessonQuiz(lesson.title, lesson.content);
          
          await db.update(lessonsTable)
            .set({
              quizQuestion: quiz.question,
              quizOptions: quiz.options,
              quizCorrectAnswer: quiz.correctAnswer,
              quizExplanation: quiz.explanation,
            })
            .where(eq(lessonsTable.id, lesson.id));
        }
      }
      
      // Refresh lessons with quiz data
      lessons = await storage.getDailyLessons(today);
      
      // Always return only 1 lesson per day
      const dailyLesson = lessons.slice(0, 1);
      res.json(dailyLesson);
    } catch (error) {
      console.error("Error fetching daily lessons:", error);
      res.status(500).json({ message: "Failed to fetch daily lessons" });
    }
  });

  // Submit quiz answer
  app.post('/api/lessons/:id/quiz', async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      
      // Check for wallet authentication in session (like other endpoints)
      let userId;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Please log in to take the quiz" });
      }
      
      const { answer } = req.body;

      const lessons = await storage.getLessons();
      const lesson = lessons.find(l => l.id === lessonId);
      
      if (!lesson || lesson.quizCorrectAnswer === null) {
        return res.status(404).json({ message: "Lesson or quiz not found" });
      }

      const isCorrect = answer === lesson.quizCorrectAnswer;
      
      if (!isCorrect) {
        return res.status(400).json({ 
          correct: false,
          message: "Incorrect answer. Try again!", 
          explanation: lesson.quizExplanation 
        });
      }

      // Mark quiz as completed - handle existing records gracefully
      try {
        const existingUserLessons = await storage.getUserLessons(userId);
        const existingUserLesson = existingUserLessons.find(ul => ul.lessonId === lessonId);

        if (existingUserLesson) {
          // Quiz already completed for this lesson
          console.log(`Quiz already completed for user ${userId}, lesson ${lessonId}`);
        } else {
          // Create new record
          await storage.completeLesson({
            userId,
            lessonId,
            quizCompleted: true,
            quizScore: 1,
            completed: false,
            auraEarned: 0
          });
        }
      } catch (error) {
        // Continue anyway since quiz answer was correct - just log the error
        console.error("Error creating lesson completion record:", error);
      }

      res.json({ 
        correct: true, 
        explanation: lesson.quizExplanation,
        message: "Quiz completed! You can now share your completion on X." 
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ message: "Failed to submit quiz" });
    }
  });

  app.post('/api/lessons/complete', async (req: any, res) => {
    try {
      // Check for wallet authentication in session (like other endpoints)
      let userId;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Please log in to complete the lesson" });
      }
      
      const { lessonId, tweetUrl } = completeLessonSchema.parse(req.body);
      
      // Check if user already completed a lesson today (only check for completed lessons, not quiz-only records)
      const today = new Date();
      const existingCompletedLesson = await storage.getUserLessonByDate(userId, today);
      
      if (existingCompletedLesson && existingCompletedLesson.completed) {
        return res.status(400).json({ message: "You have already completed a lesson today" });
      }
      
      // Get user to check current streak
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate new streak
      const lastLessonDate = user.lastLessonDate;
      let newStreak = 1; // Default to 1 for completing today's lesson
      
      if (lastLessonDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const lastDate = new Date(lastLessonDate);
        lastDate.setHours(0, 0, 0, 0);
        
        // If they completed yesterday, increment streak
        if (lastDate.getTime() === yesterday.getTime()) {
          newStreak = (user.currentStreak || 0) + 1;
        }
        // If they completed today, keep current streak
        else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (lastDate.getTime() === today.getTime()) {
            newStreak = user.currentStreak || 1;
          }
        }
      }
      
      // If there's an existing quiz record, update it to completed
      if (existingCompletedLesson && !existingCompletedLesson.completed) {
        const completedLesson = await storage.completeLesson({
          userId,
          lessonId,
          completed: true,
          tweetUrl,
          auraEarned: 100,
          completedAt: new Date(),
        });
        
        // Update user streak and aura points
        await storage.updateUserStreak(userId, newStreak);
        await storage.updateUserAura(userId, 100, 'lessons');
        
        // Update last lesson date to today
        const today = new Date();
        await storage.updateUserProfile(userId, { lastLessonDate: today });
        
        res.json({
          lesson: completedLesson,
          newStreak,
          auraEarned: 100,
        });
      } else {
        // Create new completion record
        const completedLesson = await storage.completeLesson({
          userId,
          lessonId,
          completed: true,
          tweetUrl,
          auraEarned: 100,
          completedAt: new Date(),
        });
        
        // Update user streak and aura points
        await storage.updateUserStreak(userId, newStreak);
        await storage.updateUserAura(userId, 100, 'lessons');
        
        // Update last lesson date to today
        const today = new Date();
        await storage.updateUserProfile(userId, { lastLessonDate: today });
        
        res.json({
          lesson: completedLesson,
          newStreak,
          auraEarned: 100,
        });
      }
    } catch (error) {
      console.error("Error completing lesson:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to complete lesson" });
    }
  });

  // Helper function to update battle statuses based on time and determine winners
  const updateBattleStatuses = async () => {
    try {
      const battles = await storage.getBattles();
      const now = new Date();

      for (const battle of battles) {
        if (battle.status === 'accepted' && battle.battleStartsAt && battle.votingEndsAt) {
          const startTime = new Date(battle.battleStartsAt);
          const endTime = new Date(battle.votingEndsAt);

          if (now >= startTime && now < endTime) {
            // Battle should be active
            await storage.updateBattle(battle.id, { status: 'active' });
          } else if (now >= endTime) {
            // Battle should be completed - determine winner and redistribute Aura Points
            await completeBattleAndDetermineWinner(battle);
          }
        }
      }
    } catch (error) {
      console.error("Error updating battle statuses:", error);
    }
  };

  // Function to complete battle and determine winner based on Steeze token counts
  const completeBattleAndDetermineWinner = async (battle: any) => {
    try {
      // Skip if already completed
      if (battle.status === 'completed') return;

      const challengerVotes = battle.challengerVotes || 0;
      const opponentVotes = battle.opponentVotes || 0;
      
      let winnerId = null;
      let updates: any = { status: 'completed' };

      // Determine winner based on Steeze token counts
      if (challengerVotes > opponentVotes) {
        winnerId = battle.challengerId;
        updates.winnerId = winnerId;
        
        // Winner takes all opponent's staked Aura Points
        await storage.updateUserAura(battle.challengerId, battle.opponentStake, 'battles');
        await storage.updateUserAura(battle.opponentId, -battle.opponentStake, 'battles');
        
        // Create notifications
        await storage.createNotification({
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: battle.challengerId,
          type: "battle_won",
          title: "Battle Victory!",
          message: `You won the battle and gained ${battle.opponentStake} Aura Points!`,
          relatedId: battle.id,
        });
        
        await storage.createNotification({
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: battle.opponentId,
          type: "battle_lost",
          title: "Battle Defeat",
          message: `You lost the battle and ${battle.opponentStake} Aura Points.`,
          relatedId: battle.id,
        });
        
      } else if (opponentVotes > challengerVotes) {
        winnerId = battle.opponentId;
        updates.winnerId = winnerId;
        
        // Winner takes all challenger's staked Aura Points
        await storage.updateUserAura(battle.opponentId, battle.challengerStake, 'battles');
        await storage.updateUserAura(battle.challengerId, -battle.challengerStake, 'battles');
        
        // Create notifications
        await storage.createNotification({
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: battle.opponentId,
          type: "battle_won",
          title: "Battle Victory!",
          message: `You won the battle and gained ${battle.challengerStake} Aura Points!`,
          relatedId: battle.id,
        });
        
        await storage.createNotification({
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: battle.challengerId,
          type: "battle_lost",
          title: "Battle Defeat",
          message: `You lost the battle and ${battle.challengerStake} Aura Points.`,
          relatedId: battle.id,
        });
        
      } else {
        // Draw - no Aura Point redistribution
        await storage.createNotification({
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: battle.challengerId,
          type: "battle_draw",
          title: "Battle Draw",
          message: "The battle ended in a draw. No Aura Points were redistributed.",
          relatedId: battle.id,
        });
        
        await storage.createNotification({
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: battle.opponentId,
          type: "battle_draw",
          title: "Battle Draw",
          message: "The battle ended in a draw. No Aura Points were redistributed.",
          relatedId: battle.id,
        });
      }

      // Update battle with completion status and winner
      await storage.updateBattle(battle.id, updates);
      
      console.log(`Battle ${battle.id} completed. Winner: ${winnerId ? winnerId : 'Draw'}`);
      
    } catch (error) {
      console.error(`Error completing battle ${battle.id}:`, error);
    }
  };

  // Battle routes
  app.get('/api/battles', async (req, res) => {
    try {
      // Update battle statuses before returning data
      await updateBattleStatuses();
      
      const status = req.query.status as string;
      const battles = await storage.getBattles(status);
      res.json(battles);
    } catch (error) {
      console.error("Error fetching battles:", error);
      res.status(500).json({ message: "Failed to fetch battles" });
    }
  });

  // Get user's battles
  app.get('/api/battles/user', async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Update battle statuses before returning user battles
      await updateBattleStatuses();

      const battles = await storage.getUserBattles(userId);
      res.json(battles);
    } catch (error) {
      console.error("Error fetching user battles:", error);
      res.status(500).json({ message: "Failed to fetch user battles" });
    }
  });

  app.get('/api/battles/:id', async (req, res) => {
    try {
      // Update battle statuses before returning single battle
      await updateBattleStatuses();
      
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

  // Gift Steeze to battle participants
  app.post('/api/battles/gift', async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { battleId, participantId, amount } = req.body;

      if (!battleId || !participantId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid gift parameters" });
      }

      // Get battle
      const battle = await storage.getBattle(battleId);
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }

      // Check if battle is active
      if (battle.status !== 'active') {
        return res.status(400).json({ message: "Can only gift during active battles" });
      }

      // Check if participant is valid
      if (participantId !== battle.challengerId && participantId !== battle.opponentId) {
        return res.status(400).json({ message: "Invalid participant" });
      }

      // Get user and check Steeze balance
      const user = await storage.getUser(userId);
      if (!user || (user.steezeBalance || 0) < amount) {
        return res.status(400).json({ message: "Insufficient Steeze balance" });
      }

      // Create gift transaction (using battle vote structure for now)
      await storage.createBattleVote({
        battleId,
        voterId: userId,
        votedForId: participantId,
        vouchAmount: amount.toString(),
        multiplier: "1"
      });

      // Update user's Steeze balance
      await storage.updateUserSteezeBalance(userId, -amount);

      // Update battle vote counts
      const voteField = participantId === battle.challengerId ? 'challengerVotes' : 'opponentVotes';
      const currentVotes = battle[voteField] || 0;
      await storage.updateBattle(battleId, {
        [voteField]: currentVotes + amount,
        totalVotes: (battle.totalVotes || 0) + amount
      });

      res.json({ message: "Gift sent successfully" });
    } catch (error) {
      console.error("Error sending gift:", error);
      res.status(500).json({ message: "Failed to send gift" });
    }
  });

  app.post('/api/battles', async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { title, opponentId, stakeAmount, description, battleDate, duration } = req.body;

      if (!opponentId || !stakeAmount) {
        return res.status(400).json({ message: "Opponent and stake amount are required" });
      }

      // Find opponent
      const opponent = await storage.getUser(opponentId);
      if (!opponent) {
        return res.status(404).json({ message: "Opponent not found" });
      }

      if (opponent.id === userId) {
        return res.status(400).json({ message: "You cannot challenge yourself" });
      }
      
      // Check if user has enough aura points
      const user = await storage.getUser(userId);
      if (!user || (user.auraPoints || 0) < stakeAmount) {
        return res.status(400).json({ message: "Insufficient Aura Points" });
      }
      
      // Calculate battle dates
      const battleStartDate = battleDate ? new Date(battleDate) : new Date();
      const votingEndsAt = new Date(battleStartDate);
      votingEndsAt.setHours(votingEndsAt.getHours() + (duration || 4));
      
      const battle = await storage.createBattle({
        title: title || null,
        challengerId: userId,
        opponentId: opponent.id,
        challengerStake: stakeAmount,
        opponentStake: stakeAmount,
        status: "pending",
        battleStartsAt: battleStartDate,
        votingEndsAt,
        totalVotes: 0,
        challengerVotes: 0,
        opponentVotes: 0,
        totalVouchAmount: "0",
      });
      
      // Create notification for opponent
      console.log("Creating challenge notification for opponent:", opponent.id);
      await storage.createNotification({
        id: `notif_${Date.now()}_${Math.random()}`,
        userId: opponent.id,
        type: "battle_challenge",
        title: "New Battle Challenge!",
        message: `You have been challenged to a battle with ${stakeAmount} Aura stake.`,
        relatedId: battle.id,
      });

      // Create battle request notification for opponent
      await storage.createBattleRequest({
        battleId: battle.id,
        challengerId: userId,
        opponentId: opponent.id,
        stakeAmount,
        description: description || "A battle of Web3 aura and reputation!",
        battleDate: battleStartDate.toISOString(),
        duration: duration || 4,
        status: "pending",
      });
      
      res.json(battle);
    } catch (error) {
      console.error("Error creating battle:", error);
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
      
      // Award aura points to recipient and track USDT earnings
      await storage.updateUserAura(toUserId, finalAuraPoints, 'vouching');
      
      // Calculate and track USDT earnings (60% to recipient)
      const usdtEarnings = usdtAmount * 0.6;
      await storage.updateUserUsdtEarnings(toUserId, usdtEarnings);
      
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

  // Steeze Stack API routes
  app.post("/api/steeze/purchase", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      const purchaseRate = 0.01; // 1 Steeze = 0.01 USDT
      const usdtAmount = amount * purchaseRate;
      
      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(usdtAmount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: userId,
          steezeAmount: amount.toString(),
          type: "steeze_purchase"
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        usdtAmount,
        steezeAmount: amount
      });
    } catch (error: any) {
      console.error("Error creating Steeze purchase:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.post("/api/steeze/confirm-purchase", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { paymentIntentId } = req.body;
      
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      const amount = parseInt(paymentIntent.metadata.steezeAmount);
      const usdtAmount = amount * 0.01;

      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Create transaction record
      const transaction = await storage.createSteezeTransaction({
        userId,
        type: "purchase",
        amount,
        usdtAmount: usdtAmount.toString(),
        rate: "0.01",
        status: "completed"
      });

      // Update user's Steeze balance
      const user = await storage.getUser(userId);
      const currentBalance = user?.steezeBalance || 0;
      await storage.updateUserSteezeBalance(userId, currentBalance + amount);

      res.json({ transaction, newBalance: currentBalance + amount });
    } catch (error: any) {
      console.error("Error confirming Steeze purchase:", error);
      res.status(500).json({ message: "Failed to confirm purchase" });
    }
  });

  app.post("/api/steeze/redeem", async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { amount } = req.body;
      const redeemRate = 0.007; // 1 Steeze = 0.007 USDT
      const usdtAmount = amount * redeemRate;
      
      // Get current user and check balance
      const user = await storage.getUser(userId);
      const currentBalance = user?.steezeBalance || 0;
      
      if (currentBalance < amount) {
        return res.status(400).json({ message: "Insufficient Steeze balance" });
      }

      // Create redeem transaction
      const transaction = await storage.createSteezeTransaction({
        userId,
        type: "redeem",
        amount,
        usdtAmount: usdtAmount.toString(),
        rate: "0.007",
        status: "completed"
      });

      // Update user's Steeze balance
      await storage.updateUserSteezeBalance(userId, currentBalance - amount);

      res.json({ 
        transaction, 
        newBalance: currentBalance - amount,
        usdtReceived: usdtAmount
      });
    } catch (error: any) {
      console.error("Error redeeming Steeze:", error);
      res.status(500).json({ message: "Failed to redeem Steeze" });
    }
  });

  app.get("/api/steeze/transactions", async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const transactions = await storage.getUserSteezeTransactions(userId);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching Steeze transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
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
      
      // Only count completed battles for statistics
      const completedBattles = battles.filter(b => b.status === 'completed');
      
      res.json({
        user,
        battleStats: {
          total: completedBattles.length,
          won: completedBattles.filter(b => b.winnerId === req.params.id).length,
          lost: completedBattles.filter(b => b.winnerId && b.winnerId !== req.params.id).length,
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

  // Generate a new lesson manually (for testing improved lesson generation)
  app.post('/api/lessons/generate-new', async (req, res) => {
    try {
      console.log("Generating new improved lesson...");
      const generatedLessons = await generateDailyLessons(1);
      
      for (const lessonData of generatedLessons) {
        // Generate quiz for each lesson
        const quiz = await generateLessonQuiz(lessonData.title, lessonData.content);
        
        const newLesson = await storage.createLesson({
          title: lessonData.title,
          content: lessonData.content,
          keyTakeaways: lessonData.keyTakeaways,
          difficulty: lessonData.difficulty,
          estimatedReadTime: lessonData.estimatedReadTime,
          auraReward: 100,
          isActive: true,
          quizQuestion: quiz.question,
          quizOptions: quiz.options,
          quizCorrectAnswer: quiz.correctAnswer,
          quizExplanation: quiz.explanation,
        });
        
        res.json(newLesson);
        return;
      }
    } catch (error) {
      console.error("Error generating new lesson:", error);
      res.status(500).json({ message: "Failed to generate new lesson" });
    }
  });

  // Get lesson completion status
  app.get('/api/lessons/:id/status', async (req: any, res) => {
    try {
      // Check for wallet authentication in session
      let userId;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.json({ completed: false, quizCompleted: false, auraEarned: 0 });
      }
      
      const lessonId = parseInt(req.params.id);
      
      // Get all user lessons for this specific lesson
      const userLessons = await storage.getUserLessons(userId);
      const completedLesson = userLessons.find(ul => ul.lessonId === lessonId && ul.completed);
      
      if (completedLesson) {
        return res.json({
          completed: true,
          quizCompleted: completedLesson.quizCompleted || false,
          auraEarned: completedLesson.auraEarned || 0
        });
      }
      
      // Check if quiz was completed but lesson not yet finished
      const quizLesson = userLessons.find(ul => ul.lessonId === lessonId && ul.quizCompleted);
      if (quizLesson) {
        return res.json({
          completed: false,
          quizCompleted: true,
          auraEarned: 0
        });
      }
      
      res.json({ completed: false, quizCompleted: false, auraEarned: 0 });
    } catch (error) {
      console.error("Error checking lesson status:", error);
      res.json({ completed: false, quizCompleted: false, auraEarned: 0 });
    }
  });

  // Mark notification as read
  app.post("/api/notifications/:id/read", async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const notificationId = req.params.id;
      console.log("Marking notification as read:", notificationId, "for user:", userId);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
