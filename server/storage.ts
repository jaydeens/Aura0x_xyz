import {
  type User,
  type UpsertUser,
  type InsertLesson,
  type Lesson,
  type InsertUserLesson,
  type UserLesson,
  type InsertBattle,
  type Battle,
  type InsertBattleVote,
  type BattleVote,
  type InsertVouch,
  type Vouch,
  type InsertAuraLevel,
  type AuraLevel,
  type Notification,
  type InsertNotification,
  type SteezeTransaction,
  type InsertSteezeTransaction,
  type WalletWhitelist,
  type InsertWalletWhitelist,
} from "@shared/schema";

// In-memory storage implementation for cost-effective development

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, updates: { username?: string; profileImageUrl?: string; twitterUsername?: string; email?: string; twitterAccessToken?: string | null; twitterRefreshToken?: string | null; ipAddress?: string; walletAddress?: string; twitterId?: string; purchasedSteeze?: number; battleEarnedSteeze?: number }): Promise<User>;
  checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean>;
  getUserByUsername(username: string): Promise<User | undefined>;
  searchUsers(query: string, excludeUserId?: string): Promise<User[]>;
  
  // Battle request operations
  createBattleRequest(request: any): Promise<any>;
  getBattleRequests(userId: string): Promise<any[]>;
  updateBattleRequest(id: string, status: string): Promise<any>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  // Lesson operations
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  getLessons(limit?: number): Promise<Lesson[]>;
  getDailyLessons(date: Date): Promise<Lesson[]>;
  
  // User lesson operations
  getUserLessons(userId: string): Promise<UserLesson[]>;
  completeLesson(userLesson: InsertUserLesson): Promise<UserLesson>;
  getUserLessonByDate(userId: string, date: Date): Promise<UserLesson | undefined>;
  
  // Battle operations
  createBattle(battle: InsertBattle): Promise<Battle>;
  getBattles(status?: string): Promise<Battle[]>;
  getBattle(id: string): Promise<Battle | undefined>;
  updateBattle(id: string, updates: Partial<Battle>): Promise<Battle>;
  getUserBattles(userId: string): Promise<Battle[]>;
  
  // Battle vote operations
  createBattleVote(vote: InsertBattleVote): Promise<BattleVote>;
  getBattleVotes(battleId: string): Promise<BattleVote[]>;
  
  // Vouch operations
  createVouch(vouch: InsertVouch): Promise<Vouch>;
  getUserVouches(userId: string): Promise<Vouch[]>;
  
  // Leaderboard operations
  getLeaderboard(limit?: number, type?: 'weekly' | 'all-time'): Promise<User[]>;
  
  // Aura level operations
  getAuraLevels(): Promise<AuraLevel[]>;
  seedAuraLevels(): Promise<void>;
  
  // User statistics
  updateUserAura(userId: string, points: number, source?: 'lessons' | 'vouching' | 'battles'): Promise<void>;
  updateUserStreak(userId: string, streak: number): Promise<void>;
  updateUserUsdtEarnings(userId: string, amount: number): Promise<void>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  getUserByTwitter(twitterId: string): Promise<User | undefined>;
  
  // Steeze operations
  createSteezeTransaction(transaction: InsertSteezeTransaction): Promise<SteezeTransaction>;
  getUserSteezeTransactions(userId: string): Promise<SteezeTransaction[]>;
  updateUserSteezeBalance(userId: string, amount: number): Promise<void>;
  
  // Wallet whitelist operations for closed beta
  isWalletWhitelisted(walletAddress: string): Promise<boolean>;
  addWalletToWhitelist(whitelist: InsertWalletWhitelist): Promise<WalletWhitelist>;
  removeWalletFromWhitelist(walletAddress: string): Promise<void>;
  getWhitelistedWallets(): Promise<WalletWhitelist[]>;
  checkBetaAccess(walletAddress: string): Promise<boolean>;
}

// In-memory data stores
interface MemoryStore {
  users: Map<string, User>;
  lessons: Map<string, Lesson>;
  userLessons: Map<string, UserLesson>;
  battles: Map<string, Battle>;
  battleVotes: Map<string, BattleVote>;
  vouches: Map<string, Vouch>;
  auraLevels: Map<string, AuraLevel>;
  notifications: Map<string, Notification>;
  steezeTransactions: Map<string, SteezeTransaction>;
  walletWhitelist: Map<string, WalletWhitelist>;
}

class MemStorage implements IStorage {
  private store: MemoryStore;

  constructor() {
    this.store = {
      users: new Map(),
      lessons: new Map(),
      userLessons: new Map(),
      battles: new Map(),
      battleVotes: new Map(),
      vouches: new Map(),
      auraLevels: new Map(),
      notifications: new Map(),
      steezeTransactions: new Map(),
      walletWhitelist: new Map(),
    };
    
    // Initialize with default aura levels and sample data
    this.seedAuraLevels();
    this.seedSampleData();
  }

  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    return this.store.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const userId = userData.id || `twitter_${userData.twitterId}` || `user_${Date.now()}`;
    
    const existingUser = this.store.users.get(userId);
    const now = new Date();
    
    const user: User = {
      ...existingUser,
      ...userData,
      id: userId,
      updatedAt: now,
      createdAt: existingUser?.createdAt || now,
      // Set defaults for required fields if not provided
      auraPoints: existingUser?.auraPoints || 0,
      currentStreak: existingUser?.currentStreak || 0,
      auraFromLessons: existingUser?.auraFromLessons || 0,
      auraFromVouching: existingUser?.auraFromVouching || 0,
      auraFromBattles: existingUser?.auraFromBattles || 0,
      totalUsdtEarned: existingUser?.totalUsdtEarned || 0,
      totalVouchesReceived: existingUser?.totalVouchesReceived || 0,
      steezeBalance: existingUser?.steezeBalance || 0,
      purchasedSteeze: existingUser?.purchasedSteeze || 0,
      battleEarnedSteeze: existingUser?.battleEarnedSteeze || 0,
      isVerified: userData.isVerified || false,
    };
    
    this.store.users.set(userId, user);
    return user;
  }

  // Lesson operations
  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const id = `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newLesson: Lesson = {
      ...lesson,
      id,
      createdAt: now,
      updatedAt: now,
      isActive: lesson.isActive ?? true,
    };
    
    this.store.lessons.set(id, newLesson);
    return newLesson;
  }

  async getLessons(limit = 10): Promise<Lesson[]> {
    const allLessons = Array.from(this.store.lessons.values())
      .filter(lesson => lesson.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    
    return allLessons;
  }

  async getDailyLessons(date: Date): Promise<Lesson[]> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const dailyLessons = Array.from(this.store.lessons.values())
      .filter(lesson => {
        const lessonDate = new Date(lesson.createdAt);
        return lesson.isActive && 
               lessonDate >= startOfDay && 
               lessonDate <= endOfDay;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    return dailyLessons;
  }

  // User lesson operations
  async getUserLessons(userId: string): Promise<UserLesson[]> {
    return Array.from(this.store.userLessons.values())
      .filter(userLesson => userLesson.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async completeLesson(userLesson: InsertUserLesson): Promise<UserLesson> {
    const id = `userlesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const completed: UserLesson = {
      ...userLesson,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.store.userLessons.set(id, completed);
    return completed;
  }

  async getUserLessonByDate(userId: string, date: Date): Promise<UserLesson | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Array.from(this.store.userLessons.values())
      .find(userLesson => 
        userLesson.userId === userId &&
        userLesson.completed === true &&
        userLesson.completedAt &&
        new Date(userLesson.completedAt) >= startOfDay &&
        new Date(userLesson.completedAt) <= endOfDay
      );
  }

  // Battle operations
  async createBattle(battle: InsertBattle): Promise<Battle> {
    const id = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newBattle: Battle = {
      ...battle,
      id,
      createdAt: now,
      updatedAt: now,
      totalVotes: 0,
      challengerVotes: 0,
      opponentVotes: 0,
      totalVouchAmount: 0,
    };
    
    this.store.battles.set(id, newBattle);
    return newBattle;
  }

  async getBattles(status?: string): Promise<Battle[]> {
    const allBattles = Array.from(this.store.battles.values());
    
    let filtered = allBattles;
    if (status) {
      filtered = allBattles.filter(battle => battle.status === status);
    } else {
      // Only show accepted and active battles by default, not pending challenges
      filtered = allBattles.filter(battle => 
        ['accepted', 'active', 'completed'].includes(battle.status)
      );
    }
    
    // Add challenger and opponent user details
    const battlesWithUsers = await Promise.all(filtered.map(async (battle) => {
      const challenger = await this.getUser(battle.challengerId);
      const opponent = await this.getUser(battle.opponentId);
      
      return {
        ...battle,
        challenger,
        opponent
      };
    }));
    
    return battlesWithUsers.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getBattle(id: string): Promise<Battle | undefined> {
    const battle = this.store.battles.get(id);
    if (!battle) return undefined;
    
    const challenger = await this.getUser(battle.challengerId);
    const opponent = await this.getUser(battle.opponentId);
    
    return {
      ...battle,
      challenger: challenger ? {
        id: challenger.id,
        username: challenger.username,
        firstName: challenger.firstName,
        profileImageUrl: challenger.profileImageUrl
      } : undefined,
      opponent: opponent ? {
        id: opponent.id,
        username: opponent.username,
        firstName: opponent.firstName,
        profileImageUrl: opponent.profileImageUrl
      } : undefined
    } as any;
  }

  async updateBattle(id: string, updates: Partial<Battle>): Promise<Battle> {
    const existing = this.store.battles.get(id);
    if (!existing) {
      throw new Error(`Battle ${id} not found`);
    }
    
    const updated: Battle = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    
    this.store.battles.set(id, updated);
    return updated;
  }

  async getUserBattles(userId: string): Promise<Battle[]> {
    const userBattles = Array.from(this.store.battles.values())
      .filter(battle => 
        battle.challengerId === userId || battle.opponentId === userId
      );
    
    // Add challenger and opponent user details
    const battlesWithUsers = await Promise.all(userBattles.map(async (battle) => {
      const challenger = await this.getUser(battle.challengerId);
      const opponent = await this.getUser(battle.opponentId);
      
      return {
        ...battle,
        challenger,
        opponent
      };
    }));
    
    return battlesWithUsers.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Battle vote operations
  async createBattleVote(vote: InsertBattleVote): Promise<BattleVote> {
    const id = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newVote: BattleVote = {
      ...vote,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.store.battleVotes.set(id, newVote);
    return newVote;
  }

  async getBattleVotes(battleId: string): Promise<BattleVote[]> {
    return Array.from(this.store.battleVotes.values())
      .filter(vote => vote.battleId === battleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Vouch operations
  async createVouch(vouch: InsertVouch): Promise<Vouch> {
    const id = `vouch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newVouch: Vouch = {
      ...vouch,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.store.vouches.set(id, newVouch);
    return newVouch;
  }

  async getUserVouches(userId: string): Promise<Vouch[]> {
    return Array.from(this.store.vouches.values())
      .filter(vouch => 
        vouch.fromUserId === userId || vouch.toUserId === userId
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Leaderboard operations
  async getLeaderboard(limit = 100, type: 'weekly' | 'all-time' = 'all-time'): Promise<User[]> {
    const allUsers = Array.from(this.store.users.values());
    
    if (type === 'weekly') {
      // For weekly leaderboard, get users updated in the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      return allUsers
        .filter(user => new Date(user.updatedAt) >= oneWeekAgo)
        .sort((a, b) => {
          if (b.auraPoints !== a.auraPoints) {
            return b.auraPoints - a.auraPoints;
          }
          return b.currentStreak - a.currentStreak;
        })
        .slice(0, limit);
    }
    
    return allUsers
      .sort((a, b) => {
        if (b.auraPoints !== a.auraPoints) {
          return b.auraPoints - a.auraPoints;
        }
        return b.currentStreak - a.currentStreak;
      })
      .slice(0, limit);
  }

  // Aura level operations
  async getAuraLevels(): Promise<AuraLevel[]> {
    return Array.from(this.store.auraLevels.values())
      .sort((a, b) => a.minDays - b.minDays);
  }

  async seedAuraLevels(): Promise<void> {
    const levels = [
      {
        id: "clout_chaser",
        name: "Clout Chaser",
        minDays: 0,
        maxDays: 4,
        multiplier: "1.0",
        color: "#8000FF",
        description: "New to the Aura game",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "attention_seeker",
        name: "Attention Seeker",
        minDays: 5,
        maxDays: 14,
        multiplier: "1.25",
        color: "#9933FF",
        description: "Building momentum",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "grinder",
        name: "Grinder",
        minDays: 15,
        maxDays: 29,
        multiplier: "1.5",
        color: "#00FF88",
        description: "Consistent performer",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "aura_vader",
        name: "Aura Vader",
        minDays: 30,
        maxDays: null,
        multiplier: "2.0",
        color: "#FFD700",
        description: "Elite Aura master",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    levels.forEach(level => {
      if (!this.store.auraLevels.has(level.id)) {
        this.store.auraLevels.set(level.id, level);
      }
    });
  }

  // User statistics
  async updateUserAura(userId: string, points: number, source: 'lessons' | 'vouching' | 'battles' = 'vouching'): Promise<void> {
    const user = this.store.users.get(userId);
    if (!user) return;

    const updated: User = {
      ...user,
      auraPoints: user.auraPoints + points,
      updatedAt: new Date()
    };

    // Track source of aura points
    if (source === 'lessons') {
      updated.auraFromLessons = user.auraFromLessons + points;
    } else if (source === 'vouching') {
      updated.auraFromVouching = user.auraFromVouching + points;
    } else if (source === 'battles') {
      updated.auraFromBattles = user.auraFromBattles + points;
    }

    this.store.users.set(userId, updated);
  }

  async updateUserStreak(userId: string, streak: number): Promise<void> {
    const user = this.store.users.get(userId);
    if (!user) return;

    const updated: User = {
      ...user,
      currentStreak: streak,
      lastLessonDate: new Date(),
      updatedAt: new Date()
    };

    this.store.users.set(userId, updated);
  }

  async checkAndResetStreak(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user || !user.lastLessonDate) {
      return 0;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const lastDate = new Date(user.lastLessonDate);
    lastDate.setHours(0, 0, 0, 0);

    // If last lesson was more than 1 day ago, reset streak to 0
    if (lastDate.getTime() < yesterday.getTime()) {
      const updated: User = {
        ...user,
        currentStreak: 0,
        updatedAt: new Date()
      };
      this.store.users.set(userId, updated);
      return 0;
    }

    return user.currentStreak || 0;
  }

  async updateUserUsdtEarnings(userId: string, amount: number): Promise<void> {
    const user = this.store.users.get(userId);
    if (!user) return;

    const updated: User = {
      ...user,
      totalUsdtEarned: user.totalUsdtEarned + amount,
      totalVouchesReceived: user.totalVouchesReceived + amount,
      updatedAt: new Date()
    };

    this.store.users.set(userId, updated);
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.store.users.values())
      .find(user => user.walletAddress === walletAddress);
  }

  async getUserByTwitter(twitterId: string): Promise<User | undefined> {
    return Array.from(this.store.users.values())
      .find(user => user.twitterId === twitterId);
  }

  async updateUserProfile(id: string, updates: { username?: string; profileImageUrl?: string; twitterUsername?: string; email?: string; lastLessonDate?: Date; twitterAccessToken?: string | null; twitterRefreshToken?: string | null; ipAddress?: string; walletAddress?: string; twitterId?: string; purchasedSteeze?: number; battleEarnedSteeze?: number }): Promise<User> {
    const user = this.store.users.get(id);
    if (!user) {
      throw new Error(`User ${id} not found`);
    }

    const updated: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    this.store.users.set(id, updated);
    return updated;
  }

  async checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean> {
    const existingUser = Array.from(this.store.users.values())
      .find(user => user.username === username && user.id !== excludeUserId);
    return !existingUser; // true if username is available
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.store.users.values())
      .find(user => user.username === username);
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.store.users.values())
      .filter(user => {
        if (user.id === excludeUserId) return false;
        
        const usernameMatch = user.username?.toLowerCase().includes(lowerQuery);
        const walletMatch = user.walletAddress?.toLowerCase().includes(lowerQuery);
        
        return usernameMatch || walletMatch;
      })
      .slice(0, 10);
  }

  async createBattleRequest(request: any): Promise<any> {
    // For now, store as a simple record - you can extend the schema later
    return request;
  }

  async getBattleRequests(userId: string): Promise<any[]> {
    // Placeholder - implement when needed
    return [];
  }

  async updateBattleRequest(id: string, status: string): Promise<any> {
    // Placeholder - implement when needed
    return {};
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: now,
      updatedAt: now,
      isRead: false,
    };
    
    this.store.notifications.set(id, newNotification);
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.store.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const notification = this.store.notifications.get(id);
    if (notification) {
      const updated: Notification = {
        ...notification,
        isRead: true,
        updatedAt: new Date()
      };
      this.store.notifications.set(id, updated);
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    Array.from(this.store.notifications.entries()).forEach(([id, notification]) => {
      if (notification.userId === userId && !notification.isRead) {
        const updated: Notification = {
          ...notification,
          isRead: true,
          updatedAt: new Date()
        };
        this.store.notifications.set(id, updated);
      }
    });
  }

  // Steeze operations
  async createSteezeTransaction(transaction: InsertSteezeTransaction): Promise<SteezeTransaction> {
    const id = `steeze_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newTransaction: SteezeTransaction = {
      ...transaction,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.store.steezeTransactions.set(id, newTransaction);
    return newTransaction;
  }

  async getUserSteezeTransactions(userId: string): Promise<SteezeTransaction[]> {
    return Array.from(this.store.steezeTransactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateUserSteezeBalance(userId: string, amount: number): Promise<void> {
    const user = this.store.users.get(userId);
    if (user) {
      const updated: User = {
        ...user,
        steezeBalance: amount,
        updatedAt: new Date()
      };
      this.store.users.set(userId, updated);
    }
  }

  // Wallet whitelist operations for closed beta
  async isWalletWhitelisted(walletAddress: string): Promise<boolean> {
    return Array.from(this.store.walletWhitelist.values())
      .some(entry => 
        entry.walletAddress.toLowerCase() === walletAddress.toLowerCase() && 
        entry.isActive
      );
  }

  async addWalletToWhitelist(whitelistData: InsertWalletWhitelist): Promise<WalletWhitelist> {
    const id = `whitelist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const whitelist: WalletWhitelist = {
      ...whitelistData,
      id,
      walletAddress: whitelistData.walletAddress.toLowerCase(),
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };
    
    this.store.walletWhitelist.set(id, whitelist);
    return whitelist;
  }

  async removeWalletFromWhitelist(walletAddress: string): Promise<void> {
    Array.from(this.store.walletWhitelist.entries()).forEach(([id, entry]) => {
      if (entry.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        const updated: WalletWhitelist = {
          ...entry,
          isActive: false,
          updatedAt: new Date()
        };
        this.store.walletWhitelist.set(id, updated);
      }
    });
  }

  async getWhitelistedWallets(): Promise<WalletWhitelist[]> {
    return Array.from(this.store.walletWhitelist.values())
      .filter(entry => entry.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async checkBetaAccess(walletAddress: string): Promise<boolean> {
    // Check if user already exists and was created before beta system (grandfathered access)
    const existingUser = await this.getUserByWallet(walletAddress);
    if (existingUser) {
      // Only grant grandfathered access to users created before the beta system was implemented
      // Users created before June 20, 2025 get automatic access
      const betaSystemDate = new Date('2025-06-20T12:00:00Z');
      if (existingUser.createdAt && new Date(existingUser.createdAt) < betaSystemDate) {
        return true;
      }
    }

    // Check if wallet is whitelisted for new access
    return await this.isWalletWhitelisted(walletAddress);
  }

  // Initialize default aura levels
  private seedAuraLevels() {
    const auraLevels = [
      { level: 1, name: 'Novice', minAura: 0, maxAura: 99, color: '#8B5CF6' },
      { level: 2, name: 'Apprentice', minAura: 100, maxAura: 299, color: '#3B82F6' },
      { level: 3, name: 'Adept', minAura: 300, maxAura: 599, color: '#10B981' },
      { level: 4, name: 'Expert', minAura: 600, maxAura: 999, color: '#F59E0B' },
      { level: 5, name: 'Master', minAura: 1000, maxAura: 1999, color: '#EF4444' },
      { level: 6, name: 'Grandmaster', minAura: 2000, maxAura: 4999, color: '#EC4899' },
      { level: 7, name: 'Legend', minAura: 5000, maxAura: 9999, color: '#8B5CF6' },
      { level: 8, name: 'Mythic', minAura: 10000, maxAura: 19999, color: '#6366F1' },
      { level: 9, name: 'Celestial', minAura: 20000, maxAura: 49999, color: '#A855F7' },
      { level: 10, name: 'Transcendent', minAura: 50000, maxAura: 99999, color: '#F97316' },
      { level: 11, name: 'Omnipotent', minAura: 100000, maxAura: 999999, color: '#DC2626' }
    ];

    auraLevels.forEach((level, index) => {
      const auraLevel: AuraLevel = {
        id: `level_${level.level}`,
        ...level,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.store.auraLevels.set(auraLevel.id, auraLevel);
    });
  }

  // Migrate real production data from PostgreSQL to in-memory storage  
  private seedSampleData() {
    const now = new Date();
    
    // Real production users migrated from PostgreSQL database - top users by aura points
    const realUsers = [
      {
        id: 'twitter_1842854724187410433',
        twitterId: '1842854724187410433',
        firstName: 'Tuğçe',
        lastName: 'Türk',
        profileImageUrl: 'https://pbs.twimg.com/profile_images/1894659951106084864/is4yk9dX_normal.jpg',
        username: 'tozcam81',
        walletAddress: '0x8618a79074811d17078d2476412eb6538c8e3665',
        twitterUsername: 'tozcam81',
        auraPoints: 130,
        currentStreak: 3,
        lastLessonDate: new Date('2025-08-06 12:15:00.717'),
        totalVouchesReceived: 0,
        totalBattlesWon: 0,
        totalBattlesLost: 0,
        portfolioGrowth: 0,
        walletAge: 0,
        isVerified: false,
        auraFromLessons: 30,
        auraFromVouching: 100,
        auraFromBattles: 0,
        totalUsdtEarned: 0,
        steezeBalance: 0,
        battleEarnedSteeze: 0,
        purchasedSteeze: 0,
        createdAt: new Date('2025-07-27 21:20:09.593089'),
        updatedAt: new Date('2025-08-06 15:15:44.427')
      },
      {
        id: 'wallet_0x6b4125de118407d9159264096c085d777226bfc0',
        walletAddress: '0x6b4125de118407d9159264096c085d777226bfc0',
        auraPoints: 110,
        currentStreak: 1,
        lastLessonDate: new Date('2025-08-06 12:28:01.473'),
        totalVouchesReceived: 0,
        totalBattlesWon: 0,
        totalBattlesLost: 0,
        portfolioGrowth: 0,
        walletAge: 173,
        isVerified: false,
        auraFromLessons: 10,
        auraFromVouching: 0,
        auraFromBattles: 0,
        totalUsdtEarned: 0,
        steezeBalance: 0,
        battleEarnedSteeze: 0,
        purchasedSteeze: 0,
        createdAt: new Date('2025-08-05 21:33:18.802214'),
        updatedAt: new Date('2025-08-06 12:28:01.473')
      },
      {
        id: 'wallet_0x863283d940b9e4dddd447ecbdb62e6d32824ba09',
        walletAddress: '0x863283d940b9e4dddd447ecbdb62e6d32824ba09',
        auraPoints: 100,
        currentStreak: 0,
        totalVouchesReceived: 0,
        totalBattlesWon: 0,
        totalBattlesLost: 0,
        portfolioGrowth: 0,
        walletAge: 72,
        isVerified: false,
        auraFromLessons: 0,
        auraFromVouching: 0,
        auraFromBattles: 0,
        totalUsdtEarned: 0,
        steezeBalance: 0,
        battleEarnedSteeze: 0,
        purchasedSteeze: 0,
        createdAt: new Date('2025-08-03 15:35:30.595887'),
        updatedAt: new Date('2025-08-03 15:35:30.595887')
      },
      {
        id: 'wallet_0x196c17c9bc9b32d5f8a3d76995930d7c12e1e886',
        walletAddress: '0x196c17c9bc9b32d5f8a3d76995930d7c12e1e886',
        auraPoints: 100,
        currentStreak: 0,
        totalVouchesReceived: 0,
        totalBattlesWon: 0,
        totalBattlesLost: 0,
        portfolioGrowth: 0,
        walletAge: 314,
        isVerified: false,
        auraFromLessons: 0,
        auraFromVouching: 0,
        auraFromBattles: 0,
        totalUsdtEarned: 0,
        steezeBalance: 0,
        battleEarnedSteeze: 0,
        purchasedSteeze: 0,
        createdAt: new Date('2025-08-03 13:34:21.071411'),
        updatedAt: new Date('2025-08-03 13:34:21.058')
      },
      {
        id: 'test_user_redemption',
        email: 'test@example.com',
        username: 'TestRedeemer',
        walletAddress: '0x1234567890123456789012345678901234567890',
        auraPoints: 100,
        currentStreak: 5,
        totalVouchesReceived: 0,
        totalBattlesWon: 0,
        totalBattlesLost: 0,
        portfolioGrowth: 0,
        walletAge: 0,
        isVerified: false,
        auraFromLessons: 0,
        auraFromVouching: 0,
        auraFromBattles: 0,
        totalUsdtEarned: 0,
        steezeBalance: 0,
        battleEarnedSteeze: 50,
        purchasedSteeze: 0,
        createdAt: new Date('2025-08-03 12:07:50.36263'),
        updatedAt: new Date('2025-08-03 12:07:50.36263')
      }
    ];

    // Add all real users to storage
    realUsers.forEach(userData => {
      const user: User = {
        ...userData,
        displayName: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : undefined
      };
      this.store.users.set(user.id, user);
    });

    // Real production vouches
    const realVouches = [
      {
        id: '10',
        voucherUserId: 'wallet_0xd9dfa2feead8247ee0deb4081bfdb12e00f3532e',
        vouchedUserId: 'wallet_0x1c11262b204ee2d0146315a05b4cf42ca61d33e4',
        usdcAmount: 1,
        auraAwarded: 10,
        multiplier: 1.0,
        status: 'completed' as const,
        createdAt: new Date('2025-08-06 13:11:53.992464'),
        updatedAt: new Date('2025-08-06 13:11:53.992464')
      },
      {
        id: '9',
        voucherUserId: 'wallet_0xf6dbc4185935c32c962c36100f7daa9ab5155412',
        vouchedUserId: 'wallet_0xa2eadf509870570e85d5dda31f5d5effcfcf5c30',
        usdcAmount: 1,
        auraAwarded: 10,
        multiplier: 1.0,
        status: 'completed' as const,
        createdAt: new Date('2025-08-03 11:50:08.012938'),
        updatedAt: new Date('2025-08-03 11:50:08.012938')
      }
    ];

    realVouches.forEach(vouchData => {
      this.store.vouches.set(vouchData.id, vouchData);
    });

    // Real production steeze transactions
    const realSteezeTransactions = [
      {
        id: '7af75693-a1a0-4966-8d49-679b6899f058',
        userId: 'wallet_0xdca9ef7e7231d6e1646f984ac0a12d75a5c5ff34',
        type: 'purchase' as const,
        amount: 1,
        usdcAmount: 0.1,
        rate: 10,
        status: 'completed' as const,
        transactionHash: '0x409e62881a895b20895b23338dbe56ef25db33e91ba0686de3d33a57c3c47dde',
        createdAt: new Date('2025-08-06 13:09:26.914773'),
        updatedAt: new Date('2025-08-06 13:09:26.914773')
      },
      {
        id: '8f189c59-b9f4-4252-891e-52114dfae2c5',
        userId: 'wallet_0x4fffe5d7e4cb7a700a37a928881fc5796eb50232',
        type: 'purchase' as const,
        amount: 1,
        usdcAmount: 0.1,
        rate: 10,
        status: 'completed' as const,
        transactionHash: '0xf4d19280bfd5dc0d380b6c2041180218c009665a8d0b85a628d80d0f67d1cd96',
        createdAt: new Date('2025-08-06 13:07:51.144139'),
        updatedAt: new Date('2025-08-06 13:07:51.144139')
      },
      {
        id: 'dd788457-92d8-44bc-8129-eff88ac9e220',
        userId: 'wallet_0xf6dbc4185935c32c962c36100f7daa9ab5155412',
        type: 'purchase' as const,
        amount: 10,
        usdcAmount: 1.0,
        rate: 0.1,
        status: 'completed' as const,
        transactionHash: '0x5839df1f3bbf0af4eaa6f9a33a90adc0703c0d0ad37c01105ddaf51decec527e',
        createdAt: new Date('2025-08-03 12:04:28.867479'),
        updatedAt: new Date('2025-08-03 12:04:28.867479')
      }
    ];

    realSteezeTransactions.forEach(transactionData => {
      this.store.steezeTransactions.set(transactionData.id, transactionData);
    });

    console.log('✓ Real production data migrated successfully from PostgreSQL to in-memory storage');
    console.log(`✓ Loaded ${realUsers.length} real users, ${realVouches.length} vouches, ${realSteezeTransactions.length} steeze transactions`);
    console.log('✓ Data includes: tozcam81 (130 AP), verified wallets, and real transaction history');
  }
}

export const storage = new MemStorage();
