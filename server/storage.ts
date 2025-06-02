import {
  users,
  lessons,
  userLessons,
  battles,
  battleVotes,
  vouches,
  auraLevels,
  notifications,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, sql, gt, lt, gte, lte, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, updates: { username?: string; profileImageUrl?: string }): Promise<User>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // For Twitter auth, create a unique ID if not provided
    const userToInsert = {
      ...userData,
      id: userData.id || `twitter_${userData.twitterId}` || `user_${Date.now()}`,
    };

    const [user] = await db
      .insert(users)
      .values(userToInsert)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          twitterId: userData.twitterId,
          twitterUsername: userData.twitterUsername,
          isVerified: userData.isVerified,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Lesson operations
  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async updateUserLesson(id: number, updates: Partial<UserLesson>): Promise<UserLesson> {
    const [updatedLesson] = await db
      .update(userLessons)
      .set(updates)
      .where(eq(userLessons.id, id))
      .returning();
    return updatedLesson;
  }

  async getLessons(limit = 10): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.isActive, true))
      .orderBy(desc(lessons.createdAt))
      .limit(limit);
  }

  async getDailyLessons(date: Date): Promise<Lesson[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(lessons)
      .where(
        and(
          eq(lessons.isActive, true),
          gt(lessons.createdAt, startOfDay),
          lt(lessons.createdAt, endOfDay)
        )
      )
      .orderBy(asc(lessons.createdAt))
      .limit(3);
  }

  // User lesson operations
  async getUserLessons(userId: string): Promise<UserLesson[]> {
    return await db
      .select()
      .from(userLessons)
      .where(eq(userLessons.userId, userId))
      .orderBy(desc(userLessons.createdAt));
  }

  async completeLesson(userLesson: InsertUserLesson): Promise<UserLesson> {
    const [completed] = await db
      .insert(userLessons)
      .values(userLesson)
      .returning();
    return completed;
  }

  async getUserLessonByDate(userId: string, date: Date): Promise<UserLesson | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [userLesson] = await db
      .select()
      .from(userLessons)
      .where(
        and(
          eq(userLessons.userId, userId),
          eq(userLessons.completed, true),
          isNotNull(userLessons.completedAt),
          gte(userLessons.completedAt, startOfDay),
          lte(userLessons.completedAt, endOfDay)
        )
      );
    return userLesson;
  }

  // Battle operations
  async createBattle(battle: InsertBattle): Promise<Battle> {
    const [newBattle] = await db.insert(battles).values(battle).returning();
    return newBattle;
  }

  async getBattles(status?: string): Promise<Battle[]> {
    let query = db.select().from(battles);
    
    if (status) {
      query = query.where(eq(battles.status, status));
    } else {
      // Only show accepted and active battles by default, not pending challenges
      query = query.where(sql`${battles.status} IN ('accepted', 'active', 'completed')`);
    }
    
    const battleResults = await query.orderBy(desc(battles.createdAt));
    
    // Add challenger and opponent user details
    return await Promise.all(battleResults.map(async (battle) => {
      const challenger = await this.getUser(battle.challengerId);
      const opponent = await this.getUser(battle.opponentId);
      
      return {
        ...battle,
        challenger,
        opponent
      };
    }));
  }

  async getBattle(id: string): Promise<Battle | undefined> {
    const [battle] = await db.select().from(battles).where(eq(battles.id, id));
    return battle;
  }

  async updateBattle(id: string, updates: Partial<Battle>): Promise<Battle> {
    const [updated] = await db
      .update(battles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(battles.id, id))
      .returning();
    return updated;
  }

  async getUserBattles(userId: string): Promise<Battle[]> {
    const battleResults = await db
      .select()
      .from(battles)
      .where(
        or(
          eq(battles.challengerId, userId),
          eq(battles.opponentId, userId)
        )
      )
      .orderBy(desc(battles.createdAt));
    
    // Add challenger and opponent user details
    return await Promise.all(battleResults.map(async (battle) => {
      const challenger = await this.getUser(battle.challengerId);
      const opponent = await this.getUser(battle.opponentId);
      
      return {
        ...battle,
        challenger,
        opponent
      };
    }));
  }

  // Battle vote operations
  async createBattleVote(vote: InsertBattleVote): Promise<BattleVote> {
    const [newVote] = await db.insert(battleVotes).values(vote).returning();
    return newVote;
  }

  async getBattleVotes(battleId: string): Promise<BattleVote[]> {
    return await db
      .select()
      .from(battleVotes)
      .where(eq(battleVotes.battleId, battleId))
      .orderBy(desc(battleVotes.createdAt));
  }

  // Vouch operations
  async createVouch(vouch: InsertVouch): Promise<Vouch> {
    const [newVouch] = await db.insert(vouches).values(vouch).returning();
    return newVouch;
  }

  async getUserVouches(userId: string): Promise<Vouch[]> {
    return await db
      .select()
      .from(vouches)
      .where(
        or(
          eq(vouches.fromUserId, userId),
          eq(vouches.toUserId, userId)
        )
      )
      .orderBy(desc(vouches.createdAt));
  }

  // Leaderboard operations
  async getLeaderboard(limit = 100, type: 'weekly' | 'all-time' = 'all-time'): Promise<User[]> {
    if (type === 'weekly') {
      // For weekly leaderboard, get users updated in the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      return await db
        .select()
        .from(users)
        .where(gte(users.updatedAt, oneWeekAgo))
        .orderBy(desc(users.auraPoints), desc(users.currentStreak))
        .limit(limit);
    }
    
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.auraPoints), desc(users.currentStreak))
      .limit(limit);
  }

  // Aura level operations
  async getAuraLevels(): Promise<AuraLevel[]> {
    return await db
      .select()
      .from(auraLevels)
      .orderBy(asc(auraLevels.minDays));
  }

  async seedAuraLevels(): Promise<void> {
    const levels = [
      {
        name: "Clout Chaser",
        minDays: 0,
        maxDays: 4,
        multiplier: "1.0",
        color: "#8000FF",
        description: "New to the Aura game"
      },
      {
        name: "Attention Seeker",
        minDays: 5,
        maxDays: 14,
        multiplier: "1.25",
        color: "#9933FF",
        description: "Building momentum"
      },
      {
        name: "Grinder",
        minDays: 15,
        maxDays: 29,
        multiplier: "1.5",
        color: "#00FF88",
        description: "Consistent performer"
      },
      {
        name: "Aura Vader",
        minDays: 30,
        maxDays: null,
        multiplier: "2.0",
        color: "#FFD700",
        description: "Elite Aura master"
      }
    ];

    await db.insert(auraLevels).values(levels).onConflictDoNothing();
  }

  // User statistics
  async updateUserAura(userId: string, points: number, source: 'lessons' | 'vouching' | 'battles' = 'vouching'): Promise<void> {
    const updateData: any = {
        auraPoints: sql`${users.auraPoints} + ${points}`,
        updatedAt: new Date()
      };

    // Track source of aura points
    if (source === 'lessons') {
      updateData.auraFromLessons = sql`${users.auraFromLessons} + ${points}`;
    } else if (source === 'vouching') {
      updateData.auraFromVouching = sql`${users.auraFromVouching} + ${points}`;
    } else if (source === 'battles') {
      updateData.auraFromBattles = sql`${users.auraFromBattles} + ${points}`;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));
  }

  async updateUserStreak(userId: string, streak: number): Promise<void> {
    await db
      .update(users)
      .set({
        currentStreak: streak,
        lastLessonDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserUsdtEarnings(userId: string, amount: number): Promise<void> {
    await db
      .update(users)
      .set({
        totalUsdtEarned: sql`${users.totalUsdtEarned} + ${amount}`,
        totalVouchesReceived: sql`${users.totalVouchesReceived} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async getUserByTwitter(twitterId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.twitterId, twitterId));
    return user;
  }

  async updateUserProfile(id: string, updates: { username?: string; profileImageUrl?: string; lastLessonDate?: Date }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean> {
    const conditions = [eq(users.username, username)];
    if (excludeUserId) {
      conditions.push(sql`${users.id} != ${excludeUserId}`);
    }
    
    const [existingUser] = await db.select().from(users).where(and(...conditions));
    return !existingUser; // true if username is available
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    let whereClause = or(
      sql`${users.username} ILIKE ${`%${query}%`}`,
      sql`${users.walletAddress} ILIKE ${`%${query}%`}`
    );

    if (excludeUserId) {
      whereClause = and(whereClause, sql`${users.id} != ${excludeUserId}`);
    }

    const results = await db
      .select()
      .from(users)
      .where(whereClause)
      .limit(10);

    return results;
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
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    console.log("Updating notification in database:", id);
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    console.log("Database update result:", result);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
