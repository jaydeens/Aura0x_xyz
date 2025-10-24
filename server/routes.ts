import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
// Database imports removed - now using cost-effective in-memory storage
import { getSession } from "./replitAuth";
import { setupTwitterAuth, requireTwitterAuth } from "./twitterAuth";
import { generateDailyLessons, generateLessonAnalysis, generateLessonQuiz, validateTweetContent } from "./openai";
import { 
  secureAuth, 
  validateInput, 
  createRateLimit, 
  validateTransaction, 
  validateWalletSecurity,
  secureSession,
  securityHeaders,
  corsOptions,
  auditDatabaseAccess,
  logSecurityEvent,
  getClientIP 
} from "./security";
import cors from "cors";

// Simple authentication middleware for wallet and Twitter auth
const isAuthenticated = (req: any, res: any, next: any) => {
  // Check if user is authenticated via Twitter
  if (req.user && req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // For now, allow all requests through since we support wallet auth
  // In a production app, you might want to implement proper session management
  return next();
};

// Strict authentication middleware that requires valid session
const requireAuth = (req: any, res: any, next: any) => {
  // Check wallet session first
  if (req.session?.user?.id) {
    return next();
  }
  
  // Check Twitter OAuth session
  if (req.user && req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // No valid authentication found
  return res.status(401).json({ message: "Unauthorized" });
};
import { web3Service, STEEZE_CONTRACT } from "./web3";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import Stripe from "stripe";

// Initialize Stripe (optional)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('Stripe not initialized: STRIPE_SECRET_KEY not found');
}



// Validation schemas
const completeLessonSchema = z.object({
  lessonId: z.number(),
  tweetUrl: z.string(),
});

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
  ethAmount: z.number().min(0.001),
  transactionHash: z.string(),
});



// Battle presence tracking
interface BattleViewer {
  userId: string;
  username: string;
  lastSeen: number;
}

const battleViewers = new Map<string, Map<string, BattleViewer>>();

function addViewer(battleId: string, userId: string, username: string) {
  if (!battleViewers.has(battleId)) {
    battleViewers.set(battleId, new Map());
  }
  const viewers = battleViewers.get(battleId)!;
  viewers.set(userId, {
    userId,
    username,
    lastSeen: Date.now()
  });
}

function removeViewer(battleId: string, userId: string) {
  const viewers = battleViewers.get(battleId);
  if (viewers) {
    viewers.delete(userId);
    if (viewers.size === 0) {
      battleViewers.delete(battleId);
    }
  }
}

function getViewerCount(battleId: string): number {
  const viewers = battleViewers.get(battleId);
  if (!viewers) return 0;
  
  // Clean up stale viewers (older than 30 seconds)
  const now = Date.now();
  const staleThreshold = 30000;
  
  const userIds = Array.from(viewers.keys());
  for (const userId of userIds) {
    const viewer = viewers.get(userId);
    if (viewer && now - viewer.lastSeen > staleThreshold) {
      viewers.delete(userId);
    }
  }
  
  return viewers.size;
}

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

  // Apply comprehensive security middleware (disabled for development)
  // app.use(securityHeaders);
  app.use(cors(corsOptions));
  // app.use(secureSession); // Disabled - causing white screen issues
  // app.use(auditDatabaseAccess);
  // app.use(validateInput);
  
  // Global rate limiting - 1000 requests per 15 minutes (disabled for development)
  // app.use(createRateLimit(15 * 60 * 1000, 1000));
  
  // Import advanced security middleware
  const { 
    scanForVulnerabilities, 
    ipAllowlistMiddleware, 
    trackSessionSecurity, 
    detectSuspiciousActivity,
    securityHealthCheck
  } = await import("./advanced-security");
  
  // Apply advanced security measures (disabled temporarily for testing)
  // app.use(scanForVulnerabilities);
  // app.use(ipAllowlistMiddleware);
  // app.use(trackSessionSecurity);
  // app.use(detectSuspiciousActivity);
  
  // Specific rate limits for sensitive endpoints (disabled for development)
  const authRateLimit = createRateLimit(15 * 60 * 1000, 10); // 10 auth attempts per 15 minutes
  const transactionRateLimit = createRateLimit(60 * 1000, 5); // 5 transactions per minute
  const walletRateLimit = createRateLimit(5 * 60 * 1000, 20); // 20 wallet operations per 5 minutes

  // Session middleware for Twitter auth
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // Twitter auth (optional - requires Twitter API keys)
  try {
    setupTwitterAuth(app);
  } catch (error) {
    console.warn("Twitter authentication setup failed:", error);
  }

  // Seed dreamz levels on startup
  await storage.seedDreamzLevels();

  // User search endpoint (must come before /api/users/:userId to avoid route conflicts)
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

  // Get user by ID endpoint
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user data (excluding sensitive fields)
      const publicUser = {
        id: user.id,
        username: user.username,
        walletAddress: user.walletAddress,
        profileImageUrl: user.profileImageUrl,
        auraPoints: user.auraPoints,
        currentStreak: user.currentStreak,
        totalVouchesReceived: user.totalVouchesReceived,
        totalUsdtEarned: user.totalUsdtEarned,
        createdAt: user.createdAt,
        twitterUsername: user.twitterUsername,
        twitterDisplayName: user.twitterDisplayName,
        isVerified: user.isVerified
      };

      res.json(publicUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Wallet authentication route
  app.post('/api/auth/wallet', authRateLimit, validateWalletSecurity, async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress || !web3Service.isValidAddress(walletAddress)) {
        return res.status(400).json({ message: "Invalid wallet address" });
      }

      // Check if user exists by wallet
      let user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        // Create new user with wallet (no beta access check required)
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

  // Link wallet address to existing user (OAuth only)
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

      // Check wallet age and award bonus if eligible
      let bonusAwarded = false;
      let bonusMessage = "";
      
      try {
        const currentUser = await storage.getUser(userId);
        const walletAge = await web3Service.getWalletAge(walletAddress);
        console.log(`Wallet ${walletAddress} age: ${walletAge} days`);
        
        // If wallet is at least 60 days old and user doesn't already have wallet connected
        if (walletAge >= 60 && (!currentUser || !currentUser.walletAddress)) {
          await storage.updateUserDreamz(userId, 100, 'vouching');
          bonusAwarded = true;
          bonusMessage = "🎉 Wallet bonus: +100 Aura Points for connecting a mature wallet!";
          console.log(`Awarded 100 Aura Points to user ${userId} for connecting mature wallet`);
        }
      } catch (error) {
        console.error("Error checking wallet age:", error);
        // Continue with wallet linking even if age check fails
      }

      // Update current user with wallet address and IP
      const clientIP = getClientIP(req);
      const updatedUser = await storage.upsertUser({
        id: userId,
        walletAddress,
        ipAddress: clientIP,
      });

      res.json({ 
        user: updatedUser,
        message: bonusAwarded ? bonusMessage : "Wallet linked successfully!",
        bonusAwarded
      });
    } catch (error) {
      console.error("Error linking wallet address:", error);
      res.status(500).json({ message: "Failed to link wallet address" });
    }
  });

  // Bind wallet address to existing user (works with both OAuth and session auth)
  app.post("/api/auth/bind-wallet", async (req: any, res) => {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      // Validate wallet address format
      if (!web3Service.isValidAddress(walletAddress)) {
        return res.status(400).json({ message: "Invalid wallet address format" });
      }

      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized - please login first" });
      }

      // Check if wallet is already linked to another user
      const existingWalletUser = await storage.getUserByWallet(walletAddress);
      if (existingWalletUser && existingWalletUser.id !== userId) {
        return res.status(400).json({ 
          message: "This wallet address is already linked to another account. Please use a different wallet.",
          success: false 
        });
      }

      // Check if this is a wallet user trying to bind to another wallet account
      const currentUser = await storage.getUser(userId);
      if (currentUser && currentUser.walletAddress && currentUser.walletAddress !== walletAddress.toLowerCase()) {
        return res.status(400).json({ 
          message: "Your account is already linked to a different wallet address.",
          success: false 
        });
      }

      // If wallet user already exists and is the same as current user, just return success
      if (existingWalletUser && existingWalletUser.id === userId) {
        return res.json({ 
          success: true, 
          message: "Wallet already connected to this account",
          user: existingWalletUser 
        });
      }

      // Check wallet age and award bonus if eligible
      let bonusAwarded = false;
      let bonusMessage = "";
      
      try {
        const walletAge = await web3Service.getWalletAge(walletAddress);
        console.log(`Wallet ${walletAddress} age: ${walletAge} days`);
        
        // If wallet is at least 60 days old and user doesn't already have wallet connected
        if (walletAge >= 60 && (!currentUser || !currentUser.walletAddress)) {
          await storage.updateUserDreamz(userId, 100, 'vouching');
          bonusAwarded = true;
          bonusMessage = "🎉 Wallet bonus: +100 Aura Points for connecting a mature wallet!";
          console.log(`Awarded 100 Aura Points to user ${userId} for connecting mature wallet`);
        }
      } catch (error) {
        console.error("Error checking wallet age:", error);
        // Continue with wallet binding even if age check fails
      }

      // Update current user with wallet address
      const clientIP = getClientIP(req);
      const updatedUser = await storage.updateUserProfile(userId, {
        walletAddress: walletAddress.toLowerCase(),
        ipAddress: clientIP,
      });

      res.json({ 
        success: true, 
        message: bonusAwarded ? bonusMessage : "Wallet connected successfully!",
        user: updatedUser,
        bonusAwarded
      });
    } catch (error) {
      console.error("Error binding wallet address:", error);
      res.status(500).json({ 
        message: "Failed to connect wallet",
        success: false 
      });
    }
  });

  // Get current user route (works for both wallet and OAuth)
  app.get('/api/auth/user', authRateLimit, async (req: any, res) => {
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

      // Check and reset streak if user has missed days
      await storage.checkAndResetStreak(userId);
      
      // Fetch updated user data after potential streak reset
      const updatedUser = await storage.getUser(userId);
      return res.json(updatedUser);
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

      // Generate the image URL with cache-busting parameter
      const timestamp = Date.now();
      const imageUrl = `/uploads/${req.file.filename}?v=${timestamp}`;

      // Update user's profile with the new image URL
      await storage.updateUserProfile(userId, { profileImageUrl: imageUrl });

      res.json({ 
        imageUrl,
        message: "Profile image uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Profile update route for auth (called by Settings page)
  app.post("/api/auth/update-profile", async (req: any, res) => {
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

      const { username, email, profileImageUrl, twitterUsername } = req.body;
      const updateData: any = {};

      // Validate and add username if provided
      if (username !== undefined) {
        if (username.length < 3) {
          return res.status(400).json({ message: "Username must be at least 3 characters long" });
        }
        
        // Check if username is available
        const isAvailable = await storage.checkUsernameAvailability(username, userId);
        if (!isAvailable) {
          return res.status(400).json({ message: "Username already taken" });
        }
        
        updateData.username = username;
      }

      // Add other fields if provided
      if (email !== undefined) updateData.email = email;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      if (twitterUsername !== undefined) updateData.twitterUsername = twitterUsername;

      // Update the user profile
      const updatedUser = await storage.updateUserProfile(userId, updateData);
      
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

      // Use UTC date for consistent daily boundaries at 00:00 UTC
      const now = new Date();
      const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const forceRefresh = req.query.force === 'true';
      
      let lessons = await storage.getDailyLessons(today);
      
      // Check if we need to generate new lessons
      // Generate if: no lessons for today, force refresh, or if lesson is older than today
      const shouldGenerateNew = lessons.length === 0 || forceRefresh || 
        (lessons.length > 0 && new Date(lessons[0].createdAt).toISOString().split('T')[0] !== today.toISOString().split('T')[0]);
      
      if (shouldGenerateNew) {
        console.log(`Generating daily lessons for ${today.toISOString().split('T')[0]}...`);
        
        try {
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
        } catch (error) {
          console.error("Failed to generate new lesson:", error);
          // Fallback to most recent lesson if generation fails
          const fallbackLessons = await storage.getLessons(1);
          lessons = fallbackLessons;
        }
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
      
      // Check for authentication (wallet or Twitter login)
      let userId;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else if (req.isAuthenticated() && req.user?.id) {
        userId = req.user.id;
      } else {
        console.log("Quiz authentication failed - no valid session found");
        return res.status(401).json({ message: "Please log in to take the quiz" });
      }
      
      console.log(`Quiz submission attempt - User ID: ${userId}, Lesson ID: ${lessonId}`);
      
      const { answer } = req.body;
      
      // Validate answer input
      if (answer === null || answer === undefined || isNaN(Number(answer))) {
        return res.status(400).json({ 
          message: "Please provide a valid answer",
          correct: false 
        });
      }

      const lessons = await storage.getLessons();
      const lesson = lessons.find(l => l.id === lessonId) || lessons.find(l => l.id.toString() === lessonId.toString());
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      if (!lesson.quizQuestion || !lesson.quizOptions || lesson.quizCorrectAnswer === null || lesson.quizCorrectAnswer === undefined) {
        return res.status(404).json({ message: "Quiz not available for this lesson" });
      }

      const answerIndex = Number(answer);
      const correctIndex = Number(lesson.quizCorrectAnswer);
      
      console.log(`Quiz submission - User answer: ${answerIndex}, Correct answer: ${correctIndex}`);
      
      const isCorrect = answerIndex === correctIndex;
      
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
      console.error("Error details:", {
        lessonId: req.params.id,
        body: req.body,
        userId: req.session?.user?.id,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ 
        message: "Failed to submit quiz",
        error: error instanceof Error ? error.message : 'Server error'
      });
    }
  });

  app.post('/api/lessons/complete', async (req: any, res) => {
    try {
      // Check for wallet authentication in session (like other endpoints)
      let userId;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.user?.claims?.sub) {
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
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastDate = new Date(lastLessonDate);
        lastDate.setHours(0, 0, 0, 0);
        
        // If they completed yesterday, increment streak
        if (lastDate.getTime() === yesterday.getTime()) {
          newStreak = (user.currentStreak || 0) + 1;
        }
        // If they completed today already, keep current streak
        else if (lastDate.getTime() === today.getTime()) {
          newStreak = user.currentStreak || 1;
        }
        // If they missed days (last lesson was more than 1 day ago), streak resets to 1 when they complete a lesson
        else {
          newStreak = 1;
        }
      }
      // If no previous lessons, this is their first lesson, so streak starts at 1
      
      // If there's an existing quiz record, update it to completed
      if (existingCompletedLesson && !existingCompletedLesson.completed) {
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
        await storage.updateUserDreamz(userId, 10, 'lessons');
        
        // Update last lesson date to today
        const today = new Date();
        await storage.updateUserProfile(userId, { lastLessonDate: today });
        
        res.json({
          lesson: completedLesson,
          newStreak,
          auraEarned: 10,
        });
      } else {
        // Create new completion record
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
        await storage.updateUserDreamz(userId, 10, 'lessons');
        
        // Update last lesson date to today
        const today = new Date();
        await storage.updateUserProfile(userId, { lastLessonDate: today });
        
        res.json({
          lesson: completedLesson,
          newStreak,
          auraEarned: 10,
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
      console.log(`Checking ${battles.length} battles for status updates at ${now.toISOString()}`);

      for (const battle of battles) {
        if ((battle.status === 'accepted' || battle.status === 'active') && battle.battleStartsAt && battle.votingEndsAt) {
          const startTime = new Date(battle.battleStartsAt);
          const endTime = new Date(battle.votingEndsAt);
          
          console.log(`Battle ${battle.id}: status=${battle.status}, ends=${endTime.toISOString()}, now=${now.toISOString()}, shouldComplete=${now >= endTime}`);

          if (now >= startTime && now < endTime && battle.status === 'accepted') {
            // Battle should be active
            console.log(`Activating battle ${battle.id}`);
            await storage.updateBattle(battle.id, { status: 'active' });
          } else if (now >= endTime && battle.status !== 'completed') {
            // Battle should be completed - determine winner and redistribute Aura Points
            console.log(`Completing battle ${battle.id} - voting ended at ${battle.votingEndsAt}`);
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
        await storage.updateUserDreamz(battle.challengerId, battle.opponentStake, 'battles');
        await storage.updateUserDreamz(battle.opponentId, -battle.opponentStake, 'battles');
        
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
        await storage.updateUserDreamz(battle.opponentId, battle.challengerStake, 'battles');
        await storage.updateUserDreamz(battle.challengerId, -battle.challengerStake, 'battles');
        
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
      
      const viewerCount = getViewerCount(req.params.id);
      res.json({ ...battle, viewerCount });
    } catch (error) {
      console.error("Error fetching battle:", error);
      res.status(500).json({ message: "Failed to fetch battle" });
    }
  });

  // Join battle as viewer
  app.post('/api/battles/:id/join', async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      let username = 'Anonymous';
      
      if (req.session?.user?.id) {
        userId = req.session.user.id;
        const user = await storage.getUser(userId);
        username = user?.username || 'Anonymous';
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        username = user?.username || 'Anonymous';
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const battleId = req.params.id;
      addViewer(battleId, userId, username);
      
      const viewerCount = getViewerCount(battleId);
      res.json({ viewerCount });
    } catch (error) {
      console.error("Error joining battle:", error);
      res.status(500).json({ message: "Failed to join battle" });
    }
  });

  // Leave battle as viewer
  app.post('/api/battles/:id/leave', async (req: any, res) => {
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
      removeViewer(battleId, userId);
      
      const viewerCount = getViewerCount(battleId);
      res.json({ viewerCount });
    } catch (error) {
      console.error("Error leaving battle:", error);
      res.status(500).json({ message: "Failed to leave battle" });
    }
  });

  // Update viewer presence (heartbeat)
  app.post('/api/battles/:id/heartbeat', async (req: any, res) => {
    try {
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      let username = 'Anonymous';
      
      if (req.session?.user?.id) {
        userId = req.session.user.id;
        const user = await storage.getUser(userId);
        username = user?.username || 'Anonymous';
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        username = user?.username || 'Anonymous';
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const battleId = req.params.id;
      addViewer(battleId, userId, username); // This updates lastSeen timestamp
      
      const viewerCount = getViewerCount(battleId);
      res.json({ viewerCount });
    } catch (error) {
      console.error("Error updating heartbeat:", error);
      res.status(500).json({ message: "Failed to update heartbeat" });
    }
  });

  // Manual battle completion endpoint (for testing)
  app.post('/api/battles/:id/complete', async (req: any, res) => {
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
      
      // Only allow participants to manually complete their battle
      if (battle.challengerId !== userId && battle.opponentId !== userId) {
        return res.status(403).json({ message: "Only battle participants can complete this battle" });
      }

      // Complete the battle
      await completeBattleAndDetermineWinner(battle);
      
      // Get updated battle data
      const updatedBattle = await storage.getBattle(battleId);
      res.json(updatedBattle);
    } catch (error) {
      console.error("Error completing battle:", error);
      res.status(500).json({ message: "Failed to complete battle" });
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
      await storage.updateUserPotionsBalance(userId, -amount);

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

  // Vouch routes - Smart Contract Integration
  app.post('/api/vouch/confirm', async (req: any, res) => {
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

      const { transactionHash } = req.body;
      
      if (!transactionHash) {
        return res.status(400).json({ message: "Transaction hash is required" });
      }
      
      // Verify vouching transaction on Base Sepolia
      const verification = await web3Service.verifyVouchTransaction(transactionHash);
      
      if (!verification.isValid) {
        return res.status(400).json({ message: "Invalid vouching transaction" });
      }

      // Ensure the voucher matches the authenticated user's wallet
      const user = await storage.getUser(userId);
      if (!user?.walletAddress || user.walletAddress.toLowerCase() !== verification.voucher?.toLowerCase()) {
        return res.status(400).json({ message: "Transaction not from authenticated wallet" });
      }

      // Find or create the vouched user based on wallet address
      let vouchedUser = await storage.getUserByWallet(verification.vouchedUser!);
      if (!vouchedUser) {
        // Auto-create user for vouched wallet
        vouchedUser = await storage.upsertUser({
          id: `wallet_${verification.vouchedUser!.toLowerCase()}`,
          walletAddress: verification.vouchedUser!,
          username: verification.vouchedUser!.slice(0, 6) + '...' + verification.vouchedUser!.slice(-4),
          currentStreak: 0,
          auraPoints: 0
        });
      }
      
      // Create vouch record
      const vouch = await storage.createVouch({
        fromUserId: userId,
        toUserId: vouchedUser.id,
        usdtAmount: verification.usdcAmount!.toString(),
        auraPoints: verification.auraPoints!,
        multiplier: "1.0",
        transactionHash,
      });
      
      // Award aura points to recipient
      await storage.updateUserDreamz(vouchedUser.id, verification.auraPoints!, 'vouching');
      
      // Track USDC earnings (70% goes to vouched user as per contract)
      const usdcEarnings = verification.usdcAmount! * 0.7;
      await storage.updateUserUsdtEarnings(vouchedUser.id, usdcEarnings);
      
      // Create notification for vouched user
      const voucherName = user.username || user.walletAddress?.slice(0, 6) + '...' + user.walletAddress?.slice(-4) || 'Someone';
      await storage.createNotification({
        id: `vouch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: vouchedUser.id,
        type: 'vouch_received',
        title: 'You received a vouch!',
        message: `${voucherName} vouched for you with ${verification.usdcAmount} USDC and awarded ${verification.auraPoints} aura points!`,
        isRead: false
      });
      
      res.json({
        success: true,
        vouch,
        auraAwarded: verification.auraPoints,
        usdcAmount: verification.usdcAmount,
        vouchedUser: vouchedUser.walletAddress
      });
    } catch (error: any) {
      console.error("Error confirming vouch:", error);
      res.status(500).json({ message: "Failed to confirm vouch" });
    }
  });

  // Create a new vouch with USDC payment
  app.post('/api/vouch/create', isAuthenticated, async (req: any, res) => {
    try {
      const { vouchedUserId, usdcAmount, transactionHash } = req.body;
      const voucherId = req.session?.user?.id || req.user?.claims?.sub;

      if (!voucherId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate USDC amount (1-100 USDC range)
      const minAmount = 1;
      const maxAmount = 100;
      if (usdcAmount < minAmount || usdcAmount > maxAmount) {
        return res.status(400).json({ 
          message: `Vouching amount must be between ${minAmount} and ${maxAmount} USDC` 
        });
      }

      // Get voucher and vouched user details
      const voucher = await storage.getUser(voucherId);
      const vouchedUser = await storage.getUser(vouchedUserId);

      if (!voucher || !vouchedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!voucher.walletAddress) {
        return res.status(400).json({ message: "Voucher must have a connected wallet" });
      }

      // Get voucher's aura level to determine multiplier
      const auraLevels = await storage.getDreamzLevels();
      const userStreakDays = voucher.currentStreak || 0;
      const userLevel = auraLevels.find(level => 
        userStreakDays >= level.minDays && (level.maxDays === null || userStreakDays <= level.maxDays)
      ) || auraLevels[0]; // Default to first level if none found

      // Calculate aura points: 1 USDC = 10 APs, with level multiplier
      const baseAuraPoints = usdcAmount * 10; // 10 APs per USDC
      const finalAuraPoints = Math.round(baseAuraPoints * parseFloat(userLevel.vouchingMultiplier || "1.0"));

      // Create vouch record
      const vouch = await storage.createVouch({
        fromUserId: voucherId,
        toUserId: vouchedUserId,
        usdtAmount: usdcAmount.toString(),
        auraPoints: finalAuraPoints,
        transactionHash,
        multiplier: userLevel.vouchingMultiplier
      });

      // Award aura points to the vouched user
      await storage.updateUserDreamz(vouchedUserId, finalAuraPoints, 'vouching');

      // Update USDC earnings (70% of vouched amount goes to the user)
      const usdcEarnings = usdcAmount * 0.7;
      await storage.updateUserUsdtEarnings(vouchedUserId, usdcEarnings);

      // Create notification for vouched user
      const voucherName = voucher.username || voucher.walletAddress?.slice(0, 6) + '...' + voucher.walletAddress?.slice(-4) || 'Someone';
      await storage.createNotification({
        id: `vouch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: vouchedUserId,
        type: 'vouch_received',
        title: 'You received a vouch!',
        message: `${voucherName} vouched for you with ${usdcAmount} USDC and awarded ${finalAuraPoints} aura points!`,
        isRead: false
      });

      res.json({
        success: true,
        vouch,
        auraAwarded: finalAuraPoints,
        multiplier: parseFloat(userLevel.vouchingMultiplier || "1.0"),
        levelName: userLevel.name
      });
    } catch (error: any) {
      console.error("Error creating vouch:", error);
      res.status(500).json({ message: "Failed to create vouch" });
    }
  });

  // Security health check endpoint (admin access)
  app.get('/api/admin/security/health', secureAuth, async (req, res) => {
    try {
      const healthStatus = await securityHealthCheck();
      res.json(healthStatus);
    } catch (error) {
      console.error('Security health check error:', error);
      res.status(500).json({ message: 'Health check failed' });
    }
  });

  // Security dashboard endpoint
  app.get('/api/admin/security/dashboard', secureAuth, async (req, res) => {
    try {
      // Get recent security events
      const recentEvents = await db.execute(`
        SELECT event_type, severity, COUNT(*) as count, MAX(timestamp) as last_occurrence
        FROM security_events 
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY event_type, severity
        ORDER BY last_occurrence DESC
        LIMIT 20
      `);

      // Get vulnerability scan summary
      const vulnerabilities = await db.execute(`
        SELECT vulnerability_level, COUNT(*) as count
        FROM vulnerability_scans 
        WHERE scan_timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY vulnerability_level
      `);

      // Get active session count
      const sessions = await db.execute(`
        SELECT COUNT(*) as active_sessions
        FROM session_security 
        WHERE session_status = 'ACTIVE' 
        AND last_activity >= NOW() - INTERVAL '1 hour'
      `);

      res.json({
        recentEvents: recentEvents.rows,
        vulnerabilities: vulnerabilities.rows,
        activeSessions: parseInt(sessions.rows[0]?.active_sessions || '0'),
        timestamp: new Date().toISOString(),
        status: 'operational'
      });
    } catch (error) {
      console.error('Security dashboard error:', error);
      res.status(500).json({ message: 'Dashboard data unavailable' });
    }
  });

  // Get vouching contract info
  app.get('/api/vouch/contract-info', async (req, res) => {
    try {
      res.json({
        contractAddress: "0x8e6e64396717F69271c7994f90AFeC621C237315", // Base Mainnet for all environments
        chainId: 8453, // Base Mainnet
        networkName: "Base Mainnet",
        platformFee: 30, // 30% to platform, 70% to vouched user
        platformWallet: "0x1c11262B204EE2d0146315A05b4cf42CA61D33e4",
        minAmount: 1,
        maxAmount: 100,
        baseAuraPointsPerUSDC: 10,
        abi: [
          {
            "inputs": [
              {"internalType": "address", "name": "vouchedFor", "type": "address"},
              {"internalType": "uint256", "name": "amount", "type": "uint256"}
            ],
            "name": "vouch",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          },
          {
            "anonymous": false,
            "inputs": [
              {"indexed": true, "internalType": "address", "name": "voucher", "type": "address"},
              {"indexed": true, "internalType": "address", "name": "vouchedFor", "type": "address"},
              {"indexed": false, "internalType": "uint256", "name": "amountUSDC", "type": "uint256"},
              {"indexed": false, "internalType": "uint256", "name": "auraPointsAwarded", "type": "uint256"}
            ],
            "name": "Vouched",
            "type": "event"
          },
          {
            "inputs": [],
            "name": "USDC",
            "outputs": [{"internalType": "contract IERC20", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "feeReceiver",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "AURA_PER_USDC",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "MIN_VOUCH",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "MAX_VOUCH",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ]
      });
    } catch (error: any) {
      console.error("Error getting vouch contract info:", error);
      res.status(500).json({ message: "Failed to get contract information" });
    }
  });

  // Get individual user profile
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error: any) {
      console.error("Error getting user profile:", error);
      res.status(500).json({ message: "Failed to get user profile" });
    }
  });

  // Get vouching stats for a user
  app.get('/api/vouch/stats/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const vouches = await storage.getUserVouches(userId);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate stats
      const vouchesGiven = vouches.filter(v => v.fromUserId === userId);
      const vouchesReceived = vouches.filter(v => v.toUserId === userId);
      
      const totalUsdcGiven = vouchesGiven.reduce((sum, v) => sum + parseFloat(v.usdtAmount), 0);
      const totalUsdcReceived = vouchesReceived.reduce((sum, v) => sum + (parseFloat(v.usdtAmount) * 0.7), 0); // 70% to user
      const totalAuraReceived = vouchesReceived.reduce((sum, v) => sum + v.auraPoints, 0);

      res.json({
        vouchesGiven: vouchesGiven.length,
        vouchesReceived: vouchesReceived.length,
        totalUsdcGiven,
        totalUsdcReceived,
        totalAuraReceived,
        recentVouches: vouches.slice(0, 10)
      });
    } catch (error: any) {
      console.error("Error getting vouch stats:", error);
      res.status(500).json({ message: "Failed to get vouch stats" });
    }
  });

  // Get vouch amount from specific user to another user
  app.get('/api/vouch/amount/:fromUserId/:toUserId', async (req, res) => {
    try {
      const { fromUserId, toUserId } = req.params;
      const vouches = await storage.getUserVouches(fromUserId);
      
      // Calculate total amount vouched from fromUserId to toUserId
      const vouchesToTarget = vouches.filter(v => v.fromUserId === fromUserId && v.toUserId === toUserId);
      const totalVouchedAmount = vouchesToTarget.reduce((sum, v) => sum + parseFloat(v.usdtAmount), 0);
      
      res.json({
        totalVouchedAmount,
        remainingAmount: Math.max(0, 100 - totalVouchedAmount), // 100 USDC max
        canVouchMore: totalVouchedAmount < 100,
        vouchCount: vouchesToTarget.length
      });
    } catch (error: any) {
      console.error("Error getting vouch amount:", error);
      res.status(500).json({ message: "Failed to get vouch amount" });
    }
  });

  // Steeze Stack API routes - Base Sepolia Contract Integration
  app.get("/api/steeze/rate", async (req, res) => {
    try {
      const rate = await web3Service.getSteezeRate();
      res.json({ steezePerUsdc: rate });
    } catch (error: any) {
      console.error("Error getting Steeze rate:", error);
      res.status(500).json({ message: "Failed to get Steeze rate" });
    }
  });

  app.get("/api/steeze/balance", async (req: any, res) => {
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

      const user = await storage.getUser(userId);
      const purchasedSteeze = user?.purchasedSteeze || 0;
      const battleEarnedSteeze = user?.battleEarnedSteeze || 0;
      const totalBalance = purchasedSteeze + battleEarnedSteeze;
      
      res.json({ 
        purchasedSteeze,
        battleEarnedSteeze,
        totalBalance
      });
    } catch (error: any) {
      console.error("Error getting Steeze balance:", error);
      res.status(500).json({ message: "Failed to get Steeze balance" });
    }
  });

  app.get("/api/steeze/balance/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const balance = await web3Service.getUserSteezeBalance(address);
      res.json({ balance });
    } catch (error: any) {
      console.error("Error getting Steeze balance:", error);
      res.status(500).json({ message: "Failed to get Steeze balance" });
    }
  });

  // Get USDC balance for wallet address
  app.get("/api/wallet/usdc-balance/:address", async (req, res) => {
    try {
      const { address } = req.params;
      
      if (!web3Service.isValidAddress(address)) {
        return res.status(400).json({ message: "Invalid wallet address" });
      }
      
      const balance = await web3Service.getUSDCBalance(address);
      res.json({ 
        balance: parseFloat(balance), 
        address,
        currency: "USDC"
      });
    } catch (error: any) {
      console.error("Error getting USDC balance:", error);
      res.status(500).json({ message: "Failed to get USDC balance" });
    }
  });

  app.post("/api/steeze/purchase", transactionRateLimit, secureAuth, validateTransaction, async (req: any, res) => {
    try {
      const { usdcAmount } = req.body;
      const userId = req.session?.user?.id;
      const userWallet = req.session?.user?.wallet_address;
      
      // Input validation for amount-based requests
      if (usdcAmount) {
        if (usdcAmount <= 0 || usdcAmount > 1000) {
          return res.status(400).json({ error: 'USDC amount must be between 0 and 1000' });
        }
        
        if (!userWallet) {
          return res.status(401).json({ error: 'User wallet not found' });
        }
        
        // Validate user's USDC balance
        const hasBalance = await web3Service.validateUserBalance(userWallet, usdcAmount, 'usdc');
        if (!hasBalance) {
          return res.status(400).json({ error: 'Insufficient USDC balance' });
        }
        
        const rate = await web3Service.getSteezeRate();
        const steezeAmount = Math.floor(usdcAmount * rate);
        
        return res.json({
          rate,
          steezeAmount,
          usdcAmount: parseFloat(usdcAmount),
          userAddress: userWallet
        });
      }

      // Return general purchase info for UI
      const rate = await web3Service.getSteezeRate();
      
      res.json({ 
        contractAddress: STEEZE_CONTRACT.address,
        chainId: 8453, // Base Mainnet
        steezePerUsdc: rate,
        networkName: "Base Mainnet"
      });
    } catch (error: any) {
      console.error("Error getting purchase info:", error);
      res.status(500).json({ message: "Failed to get purchase information" });
    }
  });

  // Backend-controlled Steeze purchase (secure)
  app.post("/api/steeze/backend-purchase", transactionRateLimit, secureAuth, validateTransaction, async (req: any, res) => {
    try {
      const { usdcAmount } = req.body;
      const userId = req.session?.user?.id;
      const userWallet = req.session?.user?.wallet_address;
      
      if (!userId || !userWallet) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Use backend-controlled purchase method
      const result = await web3Service.purchaseSteezeForUser(userWallet, usdcAmount);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      // Update user balance in database
      if (result.steezeAmount) {
        await storage.updateUserPotionsBalance(userId, result.steezeAmount, 'purchase');
        
        // Create transaction record
        await storage.createPotionsTransaction({
          id: `steeze_${Date.now()}_${Math.random()}`,
          userId,
          type: 'purchase',
          amount: result.steezeAmount,
          usdtAmount: usdcAmount,
          rate: result.steezeAmount / usdcAmount,
          status: 'confirmed',
          transactionHash: result.transactionHash!
        });
      }
      
      res.json({
        success: true,
        steezeAmount: result.steezeAmount,
        transactionHash: result.transactionHash
      });
    } catch (error) {
      console.error('Error in backend-controlled purchase:', error);
      res.status(500).json({ error: 'Purchase failed' });
    }
  });

  // Backend-controlled Steeze redemption (secure)
  app.post("/api/steeze/backend-redeem", transactionRateLimit, secureAuth, validateTransaction, async (req: any, res) => {
    try {
      const { steezeAmount } = req.body;
      const userId = req.session?.user?.id;
      const userWallet = req.session?.user?.wallet_address;
      
      if (!userId || !userWallet) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Check user's Steeze balance (use correct field names)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }
      
      const totalBalance = (user.purchasedSteeze || 0) + (user.battleEarnedSteeze || 0);
      if (totalBalance < steezeAmount) {
        return res.status(400).json({ 
          error: `Insufficient Steeze balance. Available: ${totalBalance}, Requested: ${steezeAmount}` 
        });
      }
      
      // Use backend-controlled redemption method
      const result = await web3Service.redeemSteezeForUser(userWallet, steezeAmount);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      // Update user balance in database
      if (result.usdcAmount) {
        await storage.updateUserPotionsBalance(userId, -steezeAmount, 'redeem');
        
        // Create transaction record
        await storage.createPotionsTransaction({
          id: `steeze_${Date.now()}_${Math.random()}`,
          userId,
          type: 'redeem',
          amount: steezeAmount,
          usdtAmount: result.usdcAmount,
          rate: result.usdcAmount / steezeAmount,
          status: 'confirmed',
          transactionHash: result.transactionHash!
        });
      }
      
      res.json({
        success: true,
        usdcAmount: result.usdcAmount,
        transactionHash: result.transactionHash
      });
    } catch (error) {
      console.error('Error in backend-controlled redemption:', error);
      res.status(500).json({ error: 'Redemption failed' });
    }
  });

  // Process specific transaction manually
  app.post("/api/steeze/process-transaction", async (req: any, res) => {
    try {
      const { transactionHash, walletAddress } = req.body;
      
      console.log(`Processing transaction: ${transactionHash} for wallet: ${walletAddress}`);
      
      // Check if user exists
      const user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For the specific transaction 0x6ef8c4814e1e5c3e210eea28350688c2e1b42b0a8a59b6a7c3624f7c4dfe184e
      // This was 0.1 USDC = 10 Steeze tokens
      const usdcAmount = 0.1;
      const steezeAmount = 10;
      const rate = "10000";

      // Update user balance
      const currentPurchased = user.purchasedSteeze || 0;
      await storage.updateUserProfile(user.id, { 
        purchasedSteeze: currentPurchased + steezeAmount 
      });

      // Create transaction record
      const transaction = await storage.createPotionsTransaction({
        userId: user.id,
        type: "purchase",
        amount: steezeAmount,
        usdtAmount: usdcAmount.toString(),
        rate,
        status: "completed",
        transactionHash
      });

      res.json({
        success: true,
        user: user.id,
        transaction,
        newBalance: currentPurchased + steezeAmount,
        usdcAmount,
        steezeAmount
      });
    } catch (error: any) {
      console.error("Error processing transaction:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Manual balance fix endpoint
  app.post("/api/steeze/manual-fix", async (req: any, res) => {
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

      const { steezeAmount = 30 } = req.body;
      
      console.log(`Manual balance fix for user ${userId}: adding ${steezeAmount} STEEZE`);

      // Get current user
      const user = await storage.getUser(userId);
      const currentPurchased = user?.purchasedSteeze || 0;
      
      // Update purchased Steeze balance
      await storage.updateUserProfile(userId, { 
        purchasedSteeze: currentPurchased + steezeAmount 
      });

      // Create transaction record
      const transaction = await storage.createPotionsTransaction({
        userId,
        type: "purchase",
        amount: steezeAmount,
        usdtAmount: "0.003",
        rate: "10000",
        status: "completed",
        transactionHash: `manual_fix_${Date.now()}`
      });

      res.json({ 
        success: true,
        transaction,
        newBalance: currentPurchased + steezeAmount,
        message: "Balance updated successfully"
      });
    } catch (error: any) {
      console.error("Error in manual balance fix:", error);
      res.status(500).json({ message: "Manual fix failed" });
    }
  });


  app.post("/api/steeze/confirm-purchase", async (req, res) => {
    try {
      console.log('Confirm purchase request body:', req.body);
      
      // Get user ID from either wallet session or OAuth
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      console.log('User ID for confirmation:', userId);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { transactionHash } = req.body;
      console.log('Extracted transaction hash:', transactionHash);
      
      if (!transactionHash) {
        console.log('Transaction hash is missing from request body');
        return res.status(400).json({ message: "Transaction hash is required" });
      }

      // Validate transaction hash format
      if (!transactionHash.match(/^0x[a-fA-F0-9]{64}$/)) {
        console.log(`Invalid transaction hash format: ${transactionHash}`);
        return res.status(400).json({ message: "Invalid transaction hash format" });
      }

      // Verify transaction on Base Mainnet
      console.log(`Verifying transaction: ${transactionHash}`);
      const txVerification = await web3Service.verifySteezeTransaction(transactionHash);
      console.log("Transaction verification result:", txVerification);
      
      if (!txVerification.isValid) {
        console.log("Transaction verification failed:", txVerification.error);
        return res.status(400).json({ 
          message: "Invalid transaction", 
          error: txVerification.error,
          details: txVerification
        });
      }

      const { usdcAmount = 0, steezeAmount = 0, userAddress, isApprovalTransaction } = txVerification;

      if (!userAddress) {
        return res.status(400).json({ message: "Could not determine transaction sender" });
      }

      // Find or create user based on wallet address from transaction
      let transactionUser = await storage.getUserByWallet(userAddress.toLowerCase());
      if (!transactionUser) {
        // Create new user for this wallet address
        transactionUser = await storage.upsertUser({
          id: `wallet_${userAddress.toLowerCase()}`,
          username: "",
          email: "",
          walletAddress: userAddress.toLowerCase(),
          purchasedSteeze: 0,
          battleEarnedSteeze: 0
        });
      }

      // Check if transaction already processed across all users
      const allUsers = await storage.searchUsers("", "");
      let duplicate = false;
      for (const u of allUsers) {
        const userTransactions = await storage.getUserPotionsTransactions(u.id);
        if (userTransactions.find(tx => tx.transactionHash === transactionHash)) {
          duplicate = true;
          break;
        }
      }

      if (duplicate) {
        return res.status(400).json({ message: "Transaction already processed" });
      }

      // If this is a USDC approval transaction, execute the backend Steeze purchase
      if (isApprovalTransaction) {
        console.log(`[Backend] Processing Steeze purchase for ${usdcAmount} USDC -> ${steezeAmount} STEEZE`);
        
        try {
          // Execute the backend Steeze purchase transaction
          const purchaseResult = await web3Service.executeSteezePurchase(userAddress, usdcAmount);
          console.log("[Backend] Steeze purchase executed:", purchaseResult);
          
          if (!purchaseResult.success) {
            console.error("[Backend] Steeze purchase failed:", purchaseResult.error);
            return res.status(400).json({ 
              message: "Backend Steeze purchase failed", 
              error: purchaseResult.error 
            });
          }
        } catch (purchaseError) {
          console.error("[Backend] Error executing Steeze purchase:", purchaseError);
          return res.status(500).json({ 
            message: "Failed to execute Steeze purchase", 
            error: purchaseError.message 
          });
        }
      }

      // Create transaction record for the actual transaction sender
      const transaction = await storage.createPotionsTransaction({
        userId: transactionUser.id,
        type: "purchase",
        amount: steezeAmount,
        usdtAmount: usdcAmount.toString(),
        rate: (usdcAmount > 0 ? (steezeAmount / usdcAmount).toString() : "10000"),
        status: "completed",
        transactionHash
      });

      // Update the correct user's purchased Steeze balance
      const currentPurchased = transactionUser.purchasedSteeze || 0;
      await storage.updateUserProfile(transactionUser.id, { 
        purchasedSteeze: currentPurchased + steezeAmount 
      });

      console.log(`Successfully processed purchase: ${steezeAmount} STEEZE for ${userAddress}`);

      res.json({ 
        success: true,
        transaction,
        steezeAmount,
        usdcAmount,
        newBalance: currentPurchased + steezeAmount
      });
    } catch (error: any) {
      console.error("Error confirming Steeze purchase:", error);
      res.status(500).json({ message: "Failed to confirm purchase" });
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

      const transactions = await storage.getUserPotionsTransactions(userId);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error getting Steeze transactions:", error);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  app.post("/api/steeze/redeem-confirm", async (req: any, res) => {
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

      const { transactionHash } = req.body;
      
      // Verify transaction on Base Mainnet
      const verification = await web3Service.verifySteezeTransaction(transactionHash);
      
      if (!verification.isValid) {
        return res.status(400).json({ message: "Invalid transaction" });
      }

      // Create redeem transaction record
      const transaction = await storage.createPotionsTransaction({
        userId,
        type: "redeem",
        amount: verification.steezeAmount || 0,
        usdtAmount: (verification.ethAmount || 0).toString(),
        rate: "auto",
        status: "completed",
        transactionHash
      });

      // Update user's earned Steeze balance (subtract redeemed amount from earned balance only)
      const user = await storage.getUser(userId);
      const currentEarned = user?.battleEarnedSteeze || 0;
      await storage.updateUserProfile(userId, { 
        battleEarnedSteeze: Math.max(0, currentEarned - (verification.steezeAmount || 0))
      });

      res.json({ 
        transaction,
        ethReceived: verification.ethAmount || 0,
        newBalance: Math.max(0, currentEarned - (verification.steezeAmount || 0))
      });
    } catch (error: any) {
      console.error("Error confirming Steeze redeem:", error);
      res.status(500).json({ message: "Failed to confirm redeem" });
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
      const redeemRate = 0.07; // 1 Steeze = 0.07 USDC
      const usdcAmount = amount * redeemRate;
      
      // Get current user and check balance - only allow redemption of earned Steeze
      const user = await storage.getUser(userId);
      const earnedBalance = user?.battleEarnedSteeze || 0;
      
      if (earnedBalance < amount) {
        return res.status(400).json({ 
          message: `Insufficient earned Steeze balance. Available for redemption: ${earnedBalance}, Requested: ${amount}. Only earned Steeze can be redeemed for USDC.` 
        });
      }

      // Create redeem transaction
      const transaction = await storage.createPotionsTransaction({
        userId,
        type: "redeem",
        amount,
        usdtAmount: usdcAmount.toString(),
        rate: "0.07",
        status: "completed"
      });

      // Update user's earned Steeze balance (subtract from earned balance only)
      await storage.updateUserProfile(userId, { 
        battleEarnedSteeze: Math.max(0, earnedBalance - amount)
      });

      res.json({ 
        transaction, 
        newBalance: Math.max(0, earnedBalance - amount),
        usdcReceived: usdcAmount
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

      const transactions = await storage.getUserPotionsTransactions(userId);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching Steeze transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Check username availability
  app.get("/api/check-username", async (req: any, res) => {
    try {
      const { username } = req.query;
      
      if (!username || username.length < 3) {
        return res.json({ available: false, message: "Username must be at least 3 characters long" });
      }

      // Get current user ID to exclude from check
      let currentUserId: string | null = null;
      if (req.session?.user?.id) {
        currentUserId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        currentUserId = req.user.claims.sub;
      }

      const isAvailable = await storage.checkUsernameAvailability(username, currentUserId || undefined);
      res.json({ available: isAvailable });
    } catch (error: any) {
      console.error("Error checking username:", error);
      res.status(500).json({ available: false, message: "Error checking username" });
    }
  });

  // Upload profile image
  app.post("/api/user/upload-profile-image", upload.single('profileImage'), async (req: any, res) => {
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

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate public URL for the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;
      
      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Update profile information
  app.put("/api/profile", async (req: any, res) => {
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

      const { username, email, profileImageUrl, twitterUsername } = req.body;
      const updateData: any = {};

      // Validate and add username if provided
      if (username !== undefined) {
        if (username.length < 3) {
          return res.status(400).json({ message: "Username must be at least 3 characters long" });
        }
        
        // Check if username is available
        const isAvailable = await storage.checkUsernameAvailability(username, userId);
        if (!isAvailable) {
          return res.status(400).json({ message: "Username already taken" });
        }
        
        updateData.username = username;
      }

      // Add email if provided
      if (email !== undefined) {
        if (!email.includes("@")) {
          return res.status(400).json({ message: "Invalid email address" });
        }
        updateData.email = email;
      }

      // Add profile image URL if provided
      if (profileImageUrl !== undefined) {
        updateData.profileImageUrl = profileImageUrl;
      }

      // Add Twitter username if provided
      if (twitterUsername !== undefined) {
        updateData.twitterUsername = twitterUsername;
      }

      // Update user profile
      const updatedUser = await storage.updateUserProfile(userId, updateData);
      
      res.json({ user: updatedUser });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // X (Twitter) OAuth disconnect route
  app.post("/api/auth/twitter/disconnect", async (req: any, res) => {
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

      // Clear Twitter OAuth tokens from user profile
      await storage.updateUserProfile(userId, {
        twitterUsername: undefined,
      });

      res.json({ message: "X account disconnected successfully" });
    } catch (error: any) {
      console.error("Error disconnecting X account:", error);
      res.status(500).json({ message: "Failed to disconnect X account" });
    }
  });

  // Enhanced X API posting endpoints
  
  // Post lesson completion to X
  app.post("/api/lessons/share-completion", async (req: any, res) => {
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

      const { lessonTitle, auraEarned, streakDays } = req.body;
      const user = await storage.getUser(userId);

      // For bidirectional auth, check if this user has a linked Twitter account
      let twitterUser = user;
      if (!user?.twitterAccessToken && user?.twitterId) {
        // If wallet user has linked Twitter ID, get the Twitter user account
        twitterUser = await storage.getUserByTwitter(user.twitterId);
      }

      if (!twitterUser?.twitterAccessToken) {
        return res.status(400).json({ message: "X account not connected" });
      }

      // Enhanced tweet content with streak information
      let tweetText = `🎯 Just completed "${lessonTitle}" on @AuraPlatform! 
      
💫 Earned ${auraEarned} Aura points`;
      
      if (streakDays > 0) {
        tweetText += `
🔥 ${streakDays} day learning streak!`;
      }
      
      tweetText += `

Building my Web3 knowledge one lesson at a time! 🚀

#AuraLearning #Web3Education #BuildingMyAura #LearnToEarn`;

      // Check if user has proper Twitter API access
      if (!twitterUser?.twitterAccessToken || !twitterUser?.twitterRefreshToken) {
        return res.status(400).json({ 
          message: "Twitter posting requires reconnecting your account with posting permissions. Please disconnect and reconnect your X account." 
        });
      }

      // Post to X using Twitter API v2
      const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${twitterUser?.twitterAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: tweetText
        }),
      });

      if (!tweetResponse.ok) {
        const errorData = await tweetResponse.json().catch(() => ({}));
        console.error("X posting error:", errorData);
        
        // Check if it's an authentication issue
        if (tweetResponse.status === 401 || tweetResponse.status === 403) {
          return res.status(400).json({ 
            message: "Twitter posting permissions expired. Please disconnect and reconnect your X account to enable posting." 
          });
        }
        
        return res.status(500).json({ 
          message: "Failed to post to X. Please try again or reconnect your account." 
        });
      }

      const tweetData = await tweetResponse.json();
      res.json({ 
        message: "Lesson completion shared to X successfully",
        tweetId: tweetData.data?.id 
      });
    } catch (error: any) {
      console.error("Error sharing lesson completion to X:", error);
      res.status(500).json({ message: "Failed to share to X" });
    }
  });

  // Post battle victory to X
  app.post("/api/battles/share-victory", async (req: any, res) => {
    try {
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { battleId, opponentUsername, auraEarned } = req.body;
      const user = await storage.getUser(userId);

      // For bidirectional auth, check if this user has a linked Twitter account
      let twitterUser = user;
      if (!user?.twitterAccessToken && user?.twitterId) {
        // If wallet user has linked Twitter ID, get the Twitter user account
        twitterUser = await storage.getUserByTwitter(user.twitterId);
      }

      if (!twitterUser?.twitterAccessToken) {
        return res.status(400).json({ message: "X account not connected" });
      }

      const tweetText = `⚔️ Victory in the Aura Arena! 

Just defeated @${opponentUsername} in an epic Web3 battle on @AuraPlatform! 

💎 Earned ${auraEarned} Aura points
🏆 Climbing the leaderboard

Ready for the next challenger! 

#AuraBattle #Web3Gaming #Victory #CryptoChampion`;

      // Check if user has proper Twitter API access
      if (!twitterUser?.twitterAccessToken || !twitterUser?.twitterRefreshToken) {
        return res.status(400).json({ 
          message: "Twitter posting requires reconnecting your account with posting permissions. Please disconnect and reconnect your X account." 
        });
      }

      const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${twitterUser.twitterAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tweetText }),
      });

      if (!tweetResponse.ok) {
        const errorData = await tweetResponse.json();
        console.error("X posting error:", errorData);
        return res.status(500).json({ message: "Failed to post to X" });
      }

      const tweetData = await tweetResponse.json();
      res.json({ 
        message: "Battle victory shared to X successfully",
        tweetId: tweetData.data?.id 
      });
    } catch (error: any) {
      console.error("Error sharing battle victory to X:", error);
      res.status(500).json({ message: "Failed to share to X" });
    }
  });

  // Post milestone achievement to X
  app.post("/api/achievements/share-milestone", async (req: any, res) => {
    try {
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { milestone, totalAura, rank } = req.body;
      const user = await storage.getUser(userId);

      if (!user?.twitterAccessToken) {
        return res.status(400).json({ message: "X account not connected" });
      }

      let tweetText = `🎯 Milestone Achieved on @AuraPlatform! 

${milestone}

💫 Total Aura: ${totalAura?.toLocaleString()}`;

      if (rank) {
        tweetText += `
🏆 Global Rank: #${rank}`;
      }

      tweetText += `

Building my Web3 empire one achievement at a time! 🚀

#AuraMilestone #Web3Achievement #BuildingMyAura #CryptoSuccess`;

      const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.twitterAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tweetText }),
      });

      if (!tweetResponse.ok) {
        const errorData = await tweetResponse.json();
        console.error("X posting error:", errorData);
        return res.status(500).json({ message: "Failed to post to X" });
      }

      const tweetData = await tweetResponse.json();
      res.json({ 
        message: "Milestone achievement shared to X successfully",
        tweetId: tweetData.data?.id 
      });
    } catch (error: any) {
      console.error("Error sharing milestone to X:", error);
      res.status(500).json({ message: "Failed to share to X" });
    }
  });

  // Post custom tweet with validation
  app.post("/api/social/post-tweet", async (req: any, res) => {
    try {
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { content, includeAuraTag = true } = req.body;
      const user = await storage.getUser(userId);

      if (!user?.twitterAccessToken) {
        return res.status(400).json({ message: "X account not connected" });
      }

      // Validate content length (Twitter's limit is 280 characters)
      let tweetText = content;
      if (includeAuraTag && !tweetText.includes('@AuraPlatform') && !tweetText.includes('#Aura')) {
        tweetText += '\n\n#BuildingMyAura @AuraPlatform';
      }

      if (tweetText.length > 280) {
        return res.status(400).json({ message: "Tweet content too long (max 280 characters)" });
      }

      const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.twitterAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tweetText }),
      });

      if (!tweetResponse.ok) {
        const errorData = await tweetResponse.json();
        console.error("X posting error:", errorData);
        return res.status(500).json({ message: "Failed to post to X" });
      }

      const tweetData = await tweetResponse.json();
      res.json({ 
        message: "Tweet posted successfully",
        tweetId: tweetData.data?.id,
        url: `https://twitter.com/i/web/status/${tweetData.data?.id}`
      });
    } catch (error: any) {
      console.error("Error posting custom tweet:", error);
      res.status(500).json({ message: "Failed to post tweet" });
    }
  });

  // Get X account connection status
  app.get("/api/social/x-status", async (req: any, res) => {
    try {
      let userId: string | null = null;
      if (req.session?.user?.id) {
        userId = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      const isConnected = !!(user?.twitterAccessToken && user?.twitterUsername);

      res.json({
        connected: isConnected,
        username: user?.twitterUsername || null,
        twitterId: user?.twitterId || null
      });
    } catch (error: any) {
      console.error("Error checking X status:", error);
      res.status(500).json({ message: "Failed to check X status" });
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
      // Try to get user by ID first, then by username
      let user = await storage.getUser(req.params.id);
      if (!user) {
        user = await storage.getUserByUsername(req.params.id);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get additional user stats using the actual user ID
      const battles = await storage.getUserBattles(user.id);
      const vouches = await storage.getUserVouches(user.id);
      
      // Only count completed battles for statistics
      const completedBattles = battles.filter(b => b.status === 'completed');
      
      res.json({
        user,
        battleStats: {
          total: completedBattles.length,
          won: completedBattles.filter(b => b.winnerId === user.id).length,
          lost: completedBattles.filter(b => b.winnerId && b.winnerId !== user.id).length,
        },
        vouchStats: {
          received: vouches.filter(v => v.toUserId === user.id).length,
          given: vouches.filter(v => v.fromUserId === user.id).length,
        },
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Platform statistics for landing page
  app.get('/api/stats', async (req, res) => {
    try {
      // Get total users count
      const allUsers = await storage.getLeaderboard(1000); // Get all users
      const totalUsers = allUsers.length;
      
      // Get total aura points across all users
      const totalAura = allUsers.reduce((sum, user: any) => sum + (user.auraPoints || 0), 0);
      
      // Get battles data
      const allBattles = await storage.getBattles();
      const activeBattles = allBattles.filter((battle: any) => battle.status === 'active').length;
      const completedBattles = allBattles.filter((battle: any) => battle.status === 'completed').length;
      
      // Get lessons data
      const lessons = await storage.getLessons(50);
      const totalLessons = lessons.length;
      
      // Get user lessons to calculate completion rate
      const userLessons = await Promise.all(
        allUsers.map((user: any) => storage.getUserLessons(user.id))
      );
      const completedLessonsCount = userLessons.flat().filter((ul: any) => ul.completed).length;
      
      res.json({
        totalUsers,
        totalAura,
        activeBattles,
        completedBattles,
        totalLessons,
        completedLessonsCount,
        averageAuraPerUser: totalUsers > 0 ? Math.round(totalAura / totalUsers) : 0,
      });
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform statistics" });
    }
  });

  // Aura levels route
  app.get('/api/aura-levels', async (req, res) => {
    try {
      const levels = await storage.getDreamzLevels();
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
          auraReward: 10,
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

  // Manual trigger for battle status update (for testing/admin)
  app.post("/api/battles/update-statuses", async (req, res) => {
    try {
      await updateBattleStatuses();
      res.json({ message: "Battle statuses updated successfully" });
    } catch (error) {
      console.error("Error updating battle statuses:", error);
      res.status(500).json({ message: "Failed to update battle statuses" });
    }
  });

  // Wallet whitelist management routes for closed beta
  app.get('/api/whitelist', async (req, res) => {
    try {
      const wallets = await storage.getWhitelistedWallets();
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching whitelisted wallets:", error);
      res.status(500).json({ message: "Failed to fetch whitelisted wallets" });
    }
  });

  app.post('/api/whitelist', async (req, res) => {
    try {
      const { walletAddress, note } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      // Get admin user ID if available
      let addedBy = null;
      if (req.session?.user?.id) {
        addedBy = req.session.user.id;
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        addedBy = req.user.claims.sub;
      }

      const whitelist = await storage.addWalletToWhitelist({
        walletAddress,
        addedBy,
        note: note || null,
        isActive: true
      });

      res.json(whitelist);
    } catch (error) {
      console.error("Error adding wallet to whitelist:", error);
      res.status(500).json({ message: "Failed to add wallet to whitelist" });
    }
  });

  app.delete('/api/whitelist/:walletAddress', async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress;
      await storage.removeWalletFromWhitelist(walletAddress);
      res.json({ message: "Wallet removed from whitelist" });
    } catch (error) {
      console.error("Error removing wallet from whitelist:", error);
      res.status(500).json({ message: "Failed to remove wallet from whitelist" });
    }
  });

  app.get('/api/beta-access/:walletAddress', async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress;
      const hasAccess = await storage.checkBetaAccess(walletAddress);
      res.json({ hasAccess });
    } catch (error) {
      console.error("Error checking beta access:", error);
      res.status(500).json({ message: "Failed to check beta access" });
    }
  });

  const httpServer = createServer(app);
  
  // Start automatic battle status checker - runs every 30 seconds
  setInterval(updateBattleStatuses, 30000);
  console.log("Started automatic battle status checker");
  
  return httpServer;
}
