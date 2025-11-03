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
  type InsertDreamzLevel,
  type DreamzLevel,
  type Notification,
  type InsertNotification,
  type PotionsTransaction,
  type InsertPotionsTransaction,
  type WalletWhitelist,
  type InsertWalletWhitelist,
} from "@shared/schema";

// In-memory storage implementation for cost-effective development

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, updates: { username?: string; profileImageUrl?: string; twitterUsername?: string; email?: string; twitterAccessToken?: string | null; twitterRefreshToken?: string | null; ipAddress?: string; walletAddress?: string; twitterId?: string; purchasedPotions?: number; battleEarnedPotions?: number }): Promise<User>;
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
  
  // Dreamz level operations
  getDreamzLevels(): Promise<DreamzLevel[]>;
  seedDreamzLevels(): Promise<void>;
  
  // User statistics
  updateUserDreamz(userId: string, points: number, source?: 'lessons' | 'vouching' | 'battles'): Promise<void>;
  updateUserStreak(userId: string, streak: number): Promise<void>;
  updateUserUsdtEarnings(userId: string, amount: number): Promise<void>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  getUserByTwitter(twitterId: string): Promise<User | undefined>;
  
  // Potions operations
  createPotionsTransaction(transaction: InsertPotionsTransaction): Promise<PotionsTransaction>;
  getUserPotionsTransactions(userId: string): Promise<PotionsTransaction[]>;
  updateUserPotionsBalance(userId: string, amount: number): Promise<void>;
  
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
  dreamzLevels: Map<string, DreamzLevel>;
  notifications: Map<string, Notification>;
  potionsTransactions: Map<string, PotionsTransaction>;
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
      dreamzLevels: new Map(),
      notifications: new Map(),
      potionsTransactions: new Map(),
      walletWhitelist: new Map(),
    };
  }

  async initializeMockData() {
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
      dreamzPoints: existingUser?.dreamzPoints || 0,
      currentStreak: existingUser?.currentStreak || 0,
      dreamzFromLessons: existingUser?.dreamzFromLessons || 0,
      dreamzFromVouching: existingUser?.dreamzFromVouching || 0,
      dreamzFromBattles: existingUser?.dreamzFromBattles || 0,
      totalUsdtEarned: existingUser?.totalUsdtEarned || 0,
      totalVouchesReceived: existingUser?.totalVouchesReceived || 0,
      potionsBalance: existingUser?.potionsBalance || 0,
      purchasedPotions: existingUser?.purchasedPotions || 0,
      battleEarnedPotions: existingUser?.battleEarnedPotions || 0,
      isVerified: userData.isVerified || false,
    };
    
    this.store.users.set(userId, user);
    return user;
  }

  // Lesson operations
  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    // Generate sequential integer ID for lessons
    const existingIds = Array.from(this.store.lessons.keys()).map(id => parseInt(id.toString())).filter(id => !isNaN(id));
    const id = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    
    const now = new Date();
    const newLesson: Lesson = {
      ...lesson,
      id,
      createdAt: now,
      updatedAt: now,
      isActive: lesson.isActive ?? true,
    };
    
    this.store.lessons.set(id.toString(), newLesson);
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
          if (b.dreamzPoints !== a.dreamzPoints) {
            return b.dreamzPoints - a.dreamzPoints;
          }
          return b.currentStreak - a.currentStreak;
        })
        .slice(0, limit);
    }
    
    return allUsers
      .sort((a, b) => {
        if (b.dreamzPoints !== a.dreamzPoints) {
          return b.dreamzPoints - a.dreamzPoints;
        }
        return b.currentStreak - a.currentStreak;
      })
      .slice(0, limit);
  }

  // Dreamz level operations
  async getDreamzLevels(): Promise<DreamzLevel[]> {
    return Array.from(this.store.dreamzLevels.values())
      .sort((a, b) => a.minDays - b.minDays);
  }

  async seedDreamzLevels(): Promise<void> {
    const levels = [
      {
        id: "clout_chaser",
        name: "Clout Chaser",
        minDays: 0,
        maxDays: 4,
        multiplier: "1.0",
        color: "#8000FF",
        description: "New to the Dreamz game",
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
        name: "Dreamz Master",
        minDays: 30,
        maxDays: null,
        multiplier: "2.0",
        color: "#FFD700",
        description: "Elite Dreamz master",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    levels.forEach(level => {
      if (!this.store.dreamzLevels.has(level.id)) {
        this.store.dreamzLevels.set(level.id, level);
      }
    });
  }

  // User statistics
  async updateUserDreamz(userId: string, points: number, source: 'lessons' | 'vouching' | 'battles' = 'vouching'): Promise<void> {
    const user = this.store.users.get(userId);
    if (!user) return;

    const updated: User = {
      ...user,
      dreamzPoints: user.dreamzPoints + points,
      updatedAt: new Date()
    };

    // Track source of dreamz points
    if (source === 'lessons') {
      updated.dreamzFromLessons = user.dreamzFromLessons + points;
    } else if (source === 'vouching') {
      updated.dreamzFromVouching = user.dreamzFromVouching + points;
    } else if (source === 'battles') {
      updated.dreamzFromBattles = user.dreamzFromBattles + points;
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

  async updateUserProfile(id: string, updates: { username?: string; profileImageUrl?: string; twitterUsername?: string; email?: string; lastLessonDate?: Date; twitterAccessToken?: string | null; twitterRefreshToken?: string | null; ipAddress?: string; walletAddress?: string; twitterId?: string; purchasedPotions?: number; battleEarnedPotions?: number }): Promise<User> {
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

  // Potions operations
  async createPotionsTransaction(transaction: InsertPotionsTransaction): Promise<PotionsTransaction> {
    const id = `potions_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newTransaction: PotionsTransaction = {
      ...transaction,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.store.potionsTransactions.set(id, newTransaction);
    return newTransaction;
  }

  async getUserPotionsTransactions(userId: string): Promise<PotionsTransaction[]> {
    return Array.from(this.store.potionsTransactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateUserPotionsBalance(userId: string, amount: number): Promise<void> {
    const user = this.store.users.get(userId);
    if (user) {
      const updated: User = {
        ...user,
        purchasedSteeze: (user.purchasedSteeze || 0) + amount,
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

  // Initialize default dreamz levels (duplicate/legacy - main method is at line 448)
  private seedDreamzLevelsLegacy() {
    const dreamzLevels = [
      { level: 1, name: 'Novice', minDreamz: 0, maxDreamz: 99, color: '#2196F3' },
      { level: 2, name: 'Apprentice', minDreamz: 100, maxDreamz: 299, color: '#1976D2' },
      { level: 3, name: 'Adept', minDreamz: 300, maxDreamz: 599, color: '#0D47A1' },
      { level: 4, name: 'Expert', minDreamz: 600, maxDreamz: 999, color: '#00BCD4' },
      { level: 5, name: 'Master', minDreamz: 1000, maxDreamz: 1999, color: '#0097A7' },
      { level: 6, name: 'Grandmaster', minDreamz: 2000, maxDreamz: 4999, color: '#00838F' },
      { level: 7, name: 'Legend', minDreamz: 5000, maxDreamz: 9999, color: '#006064' },
      { level: 8, name: 'Mythic', minDreamz: 10000, maxDreamz: 19999, color: '#01579B' },
      { level: 9, name: 'Celestial', minDreamz: 20000, maxDreamz: 49999, color: '#0277BD' },
      { level: 10, name: 'Transcendent', minDreamz: 50000, maxDreamz: 99999, color: '#0288D1' },
      { level: 11, name: 'Omnipotent', minDreamz: 100000, maxDreamz: 999999, color: '#039BE5' }
    ];

    // This method is not currently used - main seed method is seedDreamzLevels
  }
}

// PostgreSQL storage implementation using Drizzle ORM
import { db } from './db';
import { 
  users, 
  lessons, 
  userLessons, 
  battles, 
  battleVotes, 
  vouches, 
  dreamzLevels,
  notifications,
  potionsTransactions,
  walletWhitelist
} from '@shared/schema';
import { eq, desc, and, or, sql, gte, lte, ilike } from 'drizzle-orm';

class PgStorage implements IStorage {
  constructor() {
    // No initialization needed - db is already connected
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const userId = userData.id || `twitter_${userData.twitterId}` || `user_${Date.now()}`;
    
    const existingUser = await this.getUser(userId);
    const now = new Date();
    
    if (existingUser) {
      // Update existing user - only set fields that are actually provided (not undefined)
      // This prevents wiping out existing data when partial updates are made
      const updateData: any = { updatedAt: now };
      
      // Only include fields that are explicitly provided (not undefined)
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.firstName !== undefined) updateData.firstName = userData.firstName;
      if (userData.lastName !== undefined) updateData.lastName = userData.lastName;
      if (userData.profileImageUrl !== undefined) updateData.profileImageUrl = userData.profileImageUrl;
      if (userData.username !== undefined) updateData.username = userData.username;
      if (userData.walletAddress !== undefined) updateData.walletAddress = userData.walletAddress;
      if (userData.twitterId !== undefined) updateData.twitterId = userData.twitterId;
      if (userData.twitterUsername !== undefined) updateData.twitterUsername = userData.twitterUsername;
      if (userData.twitterDisplayName !== undefined) updateData.twitterDisplayName = userData.twitterDisplayName;
      if (userData.twitterAccessToken !== undefined) updateData.twitterAccessToken = userData.twitterAccessToken;
      if (userData.twitterRefreshToken !== undefined) updateData.twitterRefreshToken = userData.twitterRefreshToken;
      if (userData.isVerified !== undefined) updateData.isVerified = userData.isVerified;
      if (userData.ipAddress !== undefined) updateData.ipAddress = userData.ipAddress;
      
      const updated = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      return updated[0];
    } else {
      // Insert new user with defaults
      const inserted = await db.insert(users)
        .values({
          ...userData,
          id: userId,
          createdAt: now,
          updatedAt: now,
          dreamzPoints: 0,
          currentStreak: 0,
          dreamzFromLessons: 0,
          dreamzFromVouching: 0,
          dreamzFromBattles: 0,
          totalUsdtEarned: "0",
          totalVouchesReceived: "0",
          potionsBalance: 0,
          purchasedPotions: 0,
          battleEarnedPotions: 0,
          isVerified: userData.isVerified || false,
        })
        .returning();
      return inserted[0];
    }
  }

  async updateUserProfile(id: string, updates: { username?: string; profileImageUrl?: string; twitterUsername?: string; email?: string; twitterAccessToken?: string | null; twitterRefreshToken?: string | null; ipAddress?: string; walletAddress?: string; twitterId?: string; purchasedPotions?: number; battleEarnedPotions?: number }): Promise<User> {
    const updated = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!updated[0]) {
      throw new Error(`User ${id} not found`);
    }
    return updated[0];
  }

  async checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean> {
    const result = await db.select()
      .from(users)
      .where(
        excludeUserId 
          ? and(eq(users.username, username), sql`${users.id} != ${excludeUserId}`)
          : eq(users.username, username)
      )
      .limit(1);
    return result.length === 0;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    const result = await db.select()
      .from(users)
      .where(
        and(
          or(
            ilike(users.username, lowerQuery),
            ilike(users.walletAddress, lowerQuery)
          ),
          excludeUserId ? sql`${users.id} != ${excludeUserId}` : undefined
        )
      )
      .limit(10);
    return result;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
    return result[0];
  }

  async getUserByTwitter(twitterId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.twitterId, twitterId)).limit(1);
    return result[0];
  }

  // Battle request operations (placeholder)
  async createBattleRequest(request: any): Promise<any> {
    return request;
  }

  async getBattleRequests(userId: string): Promise<any[]> {
    return [];
  }

  async updateBattleRequest(id: string, status: string): Promise<any> {
    return {};
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const inserted = await db.insert(notifications)
      .values({
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isRead: false,
        createdAt: new Date(),
      })
      .returning();
    return inserted[0];
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const result = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    return result;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // Lesson operations
  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const inserted = await db.insert(lessons)
      .values({
        ...lesson,
        isActive: lesson.isActive ?? true,
        createdAt: new Date(),
      })
      .returning();
    return inserted[0];
  }

  async getLessons(limit = 10): Promise<Lesson[]> {
    const result = await db.select()
      .from(lessons)
      .where(eq(lessons.isActive, true))
      .orderBy(desc(lessons.createdAt))
      .limit(limit);
    return result;
  }

  async getDailyLessons(date: Date): Promise<Lesson[]> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const result = await db.select()
      .from(lessons)
      .where(
        and(
          eq(lessons.isActive, true),
          sql`${lessons.createdAt} >= ${startOfDay}`,
          sql`${lessons.createdAt} <= ${endOfDay}`
        )
      )
      .orderBy(desc(lessons.createdAt))
      .limit(3);
    return result;
  }

  // User lesson operations
  async getUserLessons(userId: string): Promise<UserLesson[]> {
    const result = await db.select()
      .from(userLessons)
      .where(eq(userLessons.userId, userId))
      .orderBy(desc(userLessons.createdAt));
    return result;
  }

  async completeLesson(userLesson: InsertUserLesson): Promise<UserLesson> {
    const inserted = await db.insert(userLessons)
      .values({
        ...userLesson,
        createdAt: new Date(),
      })
      .returning();
    return inserted[0];
  }

  async getUserLessonByDate(userId: string, date: Date): Promise<UserLesson | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await db.select()
      .from(userLessons)
      .where(
        and(
          eq(userLessons.userId, userId),
          eq(userLessons.completed, true),
          sql`${userLessons.completedAt} >= ${startOfDay}`,
          sql`${userLessons.completedAt} <= ${endOfDay}`
        )
      )
      .limit(1);
    return result[0];
  }

  // Battle operations
  async createBattle(battle: InsertBattle): Promise<Battle> {
    const inserted = await db.insert(battles)
      .values({
        ...battle,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalVotes: 0,
        challengerVotes: 0,
        opponentVotes: 0,
        totalVouchAmount: "0",
      })
      .returning();
    return inserted[0];
  }

  async getBattles(status?: string): Promise<Battle[]> {
    let query = db.select().from(battles);
    
    if (status) {
      query = query.where(eq(battles.status, status)) as any;
    } else {
      query = query.where(
        or(
          eq(battles.status, 'accepted'),
          eq(battles.status, 'active'),
          eq(battles.status, 'completed')
        )
      ) as any;
    }
    
    const result = await query.orderBy(desc(battles.createdAt));
    
    // Add challenger and opponent details
    const battlesWithUsers = await Promise.all(result.map(async (battle) => {
      const challenger = await this.getUser(battle.challengerId);
      const opponent = await this.getUser(battle.opponentId);
      
      return {
        ...battle,
        challenger,
        opponent
      };
    }));
    
    return battlesWithUsers;
  }

  async getBattle(id: string): Promise<Battle | undefined> {
    const result = await db.select().from(battles).where(eq(battles.id, id)).limit(1);
    if (!result[0]) return undefined;
    
    const battle = result[0];
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
    const updated = await db.update(battles)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(battles.id, id))
      .returning();
    
    if (!updated[0]) {
      throw new Error(`Battle ${id} not found`);
    }
    return updated[0];
  }

  async getUserBattles(userId: string): Promise<Battle[]> {
    const result = await db.select()
      .from(battles)
      .where(
        or(
          eq(battles.challengerId, userId),
          eq(battles.opponentId, userId)
        )
      )
      .orderBy(desc(battles.createdAt));
    
    // Add challenger and opponent details
    const battlesWithUsers = await Promise.all(result.map(async (battle) => {
      const challenger = await this.getUser(battle.challengerId);
      const opponent = await this.getUser(battle.opponentId);
      
      return {
        ...battle,
        challenger,
        opponent
      };
    }));
    
    return battlesWithUsers;
  }

  // Battle vote operations
  async createBattleVote(vote: InsertBattleVote): Promise<BattleVote> {
    const inserted = await db.insert(battleVotes)
      .values({
        ...vote,
        createdAt: new Date(),
      })
      .returning();
    return inserted[0];
  }

  async getBattleVotes(battleId: string): Promise<BattleVote[]> {
    const result = await db.select()
      .from(battleVotes)
      .where(eq(battleVotes.battleId, battleId))
      .orderBy(desc(battleVotes.createdAt));
    return result;
  }

  // Vouch operations
  async createVouch(vouch: InsertVouch): Promise<Vouch> {
    const inserted = await db.insert(vouches)
      .values({
        ...vouch,
        createdAt: new Date(),
      })
      .returning();
    return inserted[0];
  }

  async getUserVouches(userId: string): Promise<Vouch[]> {
    const result = await db.select()
      .from(vouches)
      .where(
        or(
          eq(vouches.fromUserId, userId),
          eq(vouches.toUserId, userId)
        )
      )
      .orderBy(desc(vouches.createdAt));
    return result;
  }

  // Leaderboard operations
  async getLeaderboard(limit = 100, type: 'weekly' | 'all-time' = 'all-time'): Promise<User[]> {
    let query = db.select().from(users);
    
    if (type === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      query = query.where(sql`${users.updatedAt} >= ${oneWeekAgo}`) as any;
    }
    
    const result = await query
      .orderBy(sql`${users.dreamzPoints} DESC NULLS LAST`, sql`${users.currentStreak} DESC NULLS LAST`)
      .limit(limit);
    
    return result;
  }

  // Dreamz level operations
  async getDreamzLevels(): Promise<DreamzLevel[]> {
    const result = await db.select()
      .from(dreamzLevels)
      .orderBy(dreamzLevels.minDays);
    return result;
  }

  async seedDreamzLevels(): Promise<void> {
    const levels = [
      {
        name: "Clout Chaser",
        minDays: 0,
        maxDays: 4,
        multiplier: "1.0",
        vouchingMultiplier: "1.0",
        color: "#8000FF",
        description: "New to the Dreamz game",
      },
      {
        name: "Attention Seeker",
        minDays: 5,
        maxDays: 14,
        multiplier: "1.25",
        vouchingMultiplier: "1.25",
        color: "#9933FF",
        description: "Building momentum",
      },
      {
        name: "Grinder",
        minDays: 15,
        maxDays: 29,
        multiplier: "1.5",
        vouchingMultiplier: "1.5",
        color: "#00FF88",
        description: "Consistent performer",
      },
      {
        name: "Dreamz Master",
        minDays: 30,
        maxDays: null,
        multiplier: "2.0",
        vouchingMultiplier: "2.0",
        color: "#FFD700",
        description: "Elite Dreamz master",
      }
    ];

    for (const level of levels) {
      // Check if level exists
      const existing = await db.select()
        .from(dreamzLevels)
        .where(
          and(
            eq(dreamzLevels.minDays, level.minDays),
            eq(dreamzLevels.name, level.name)
          )
        )
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(dreamzLevels).values(level);
      }
    }
  }

  // User statistics
  async updateUserDreamz(userId: string, points: number, source: 'lessons' | 'vouching' | 'battles' = 'vouching'): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const updates: any = {
      dreamzPoints: (user.dreamzPoints || 0) + points,
      updatedAt: new Date()
    };

    if (source === 'lessons') {
      updates.dreamzFromLessons = (user.dreamzFromLessons || 0) + points;
    } else if (source === 'vouching') {
      updates.dreamzFromVouching = (user.dreamzFromVouching || 0) + points;
    } else if (source === 'battles') {
      updates.dreamzFromBattles = (user.dreamzFromBattles || 0) + points;
    }

    await db.update(users)
      .set(updates)
      .where(eq(users.id, userId));
  }

  async updateUserStreak(userId: string, streak: number): Promise<void> {
    await db.update(users)
      .set({
        currentStreak: streak,
        lastLessonDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserUsdtEarnings(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const currentUsdt = parseFloat(user.totalUsdtEarned || "0");
    const currentVouches = parseFloat(user.totalVouchesReceived || "0");

    await db.update(users)
      .set({
        totalUsdtEarned: (currentUsdt + amount).toString(),
        totalVouchesReceived: (currentVouches + amount).toString(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Potions operations
  async createPotionsTransaction(transaction: InsertPotionsTransaction): Promise<PotionsTransaction> {
    const inserted = await db.insert(potionsTransactions)
      .values({
        ...transaction,
        createdAt: new Date(),
      })
      .returning();
    return inserted[0];
  }

  async getUserPotionsTransactions(userId: string): Promise<PotionsTransaction[]> {
    const result = await db.select()
      .from(potionsTransactions)
      .where(eq(potionsTransactions.userId, userId))
      .orderBy(desc(potionsTransactions.createdAt));
    return result;
  }

  async updateUserPotionsBalance(userId: string, amount: number): Promise<void> {
    await db.update(users)
      .set({
        potionsBalance: sql`${users.potionsBalance} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Wallet whitelist operations
  async isWalletWhitelisted(walletAddress: string): Promise<boolean> {
    const result = await db.select()
      .from(walletWhitelist)
      .where(
        and(
          eq(walletWhitelist.walletAddress, walletAddress.toLowerCase()),
          eq(walletWhitelist.isActive, true)
        )
      )
      .limit(1);
    return result.length > 0;
  }

  async addWalletToWhitelist(whitelist: InsertWalletWhitelist): Promise<WalletWhitelist> {
    const inserted = await db.insert(walletWhitelist)
      .values({
        ...whitelist,
        walletAddress: whitelist.walletAddress.toLowerCase(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return inserted[0];
  }

  async removeWalletFromWhitelist(walletAddress: string): Promise<void> {
    await db.update(walletWhitelist)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(walletWhitelist.walletAddress, walletAddress.toLowerCase()));
  }

  async getWhitelistedWallets(): Promise<WalletWhitelist[]> {
    const result = await db.select()
      .from(walletWhitelist)
      .where(eq(walletWhitelist.isActive, true))
      .orderBy(desc(walletWhitelist.createdAt));
    return result;
  }

  async checkBetaAccess(walletAddress: string): Promise<boolean> {
    return this.isWalletWhitelisted(walletAddress);
  }
}

// Switch to PostgreSQL for production - data persists across server restarts
export const storage = new PgStorage();
