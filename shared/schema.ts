import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  walletAddress: varchar("wallet_address"),
  twitterId: varchar("twitter_id"),
  twitterUsername: varchar("twitter_username"),
  twitterDisplayName: varchar("twitter_display_name"),
  twitterAccessToken: text("twitter_access_token"),
  twitterRefreshToken: text("twitter_refresh_token"),
  isVerified: boolean("is_verified").default(false),
  // Beta access control
  hasBetaAccess: boolean("has_beta_access").default(false),
  betaInviteCode: varchar("beta_invite_code"),
  betaRequestedAt: timestamp("beta_requested_at"),
  betaApprovedAt: timestamp("beta_approved_at"),
  betaApprovedBy: varchar("beta_approved_by"),
  auraPoints: integer("aura_points").default(0),
  currentStreak: integer("current_streak").default(0),
  lastLessonDate: timestamp("last_lesson_date"),
  totalVouchesReceived: decimal("total_vouches_received").default("0"),
  totalBattlesWon: integer("total_battles_won").default(0),
  totalBattlesLost: integer("total_battles_lost").default(0),
  portfolioGrowth: decimal("portfolio_growth").default("0"),
  walletAge: integer("wallet_age").default(0),
  // Aura points breakdown tracking
  auraFromLessons: integer("aura_from_lessons").default(0),
  auraFromVouching: integer("aura_from_vouching").default(0),
  auraFromBattles: integer("aura_from_battles").default(0),
  // USDT earnings tracking
  totalUsdtEarned: decimal("total_usdt_earned").default("0"),
  // Steeze token balances
  steezeBalance: integer("steeze_balance").default(0),
  battleEarnedSteeze: integer("battle_earned_steeze").default(0),
  purchasedSteeze: integer("purchased_steeze").default(0),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  keyTakeaways: jsonb("key_takeaways").notNull(),
  auraReward: integer("aura_reward").default(100),
  difficulty: varchar("difficulty").default("beginner"),
  estimatedReadTime: integer("estimated_read_time").default(15),
  isActive: boolean("is_active").default(true),
  quizQuestion: text("quiz_question"),
  quizOptions: jsonb("quiz_options"),
  quizCorrectAnswer: integer("quiz_correct_answer"),
  quizExplanation: text("quiz_explanation"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userLessons = pgTable("user_lessons", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  completed: boolean("completed").default(false),
  quizScore: integer("quiz_score").default(0),
  quizCompleted: boolean("quiz_completed").default(false),
  tweetUrl: varchar("tweet_url"),
  tweetId: varchar("tweet_id"),
  auraEarned: integer("aura_earned").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const battles = pgTable("battles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 20 }),
  challengerId: varchar("challenger_id").notNull().references(() => users.id),
  opponentId: varchar("opponent_id").notNull().references(() => users.id),
  challengerStake: integer("challenger_stake").notNull(),
  opponentStake: integer("opponent_stake").notNull(),
  totalVotes: integer("total_votes").default(0),
  challengerVotes: integer("challenger_votes").default(0),
  opponentVotes: integer("opponent_votes").default(0),
  totalVouchAmount: decimal("total_vouch_amount").default("0"),
  winnerId: varchar("winner_id").references(() => users.id),
  status: varchar("status").default("pending"), // pending, active, completed, cancelled
  battleStartsAt: timestamp("battle_starts_at"),
  votingEndsAt: timestamp("voting_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const battleVotes = pgTable("battle_votes", {
  id: serial("id").primaryKey(),
  battleId: uuid("battle_id").notNull().references(() => battles.id),
  voterId: varchar("voter_id").notNull().references(() => users.id),
  votedForId: varchar("voted_for_id").notNull().references(() => users.id),
  vouchAmount: decimal("vouch_amount").notNull(),
  multiplier: decimal("multiplier").default("1"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vouches = pgTable("vouches", {
  id: serial("id").primaryKey(),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  usdtAmount: decimal("usdt_amount").notNull(),
  auraPoints: integer("aura_points").notNull(),
  multiplier: decimal("multiplier").default("1"),
  transactionHash: varchar("transaction_hash"),
  battleId: uuid("battle_id").references(() => battles.id), // if vouch is for a battle
  createdAt: timestamp("created_at").defaultNow(),
});

export const auraLevels = pgTable("aura_levels", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  minDays: integer("min_days").notNull(),
  maxDays: integer("max_days"),
  multiplier: decimal("multiplier").notNull(),
  vouchingMultiplier: decimal("vouching_multiplier").notNull().default("1.0"),
  color: varchar("color").notNull(),
  description: text("description"),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // battle_challenge, battle_accepted, battle_completed, etc.
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  relatedId: varchar("related_id"), // ID of related battle/lesson/etc
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Steeze transactions table
export const steezeTransactions = pgTable("steeze_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'purchase', 'redeem', 'transfer', 'battle_support'
  amount: integer("amount").notNull(), // Amount of Steeze tokens
  usdtAmount: decimal("usdt_amount").notNull(), // ETH value involved (keeping column name for compatibility)
  rate: decimal("rate").notNull(), // Exchange rate used (0.01 for purchase, 0.007 for redeem)
  status: varchar("status").default("completed"), // 'pending', 'completed', 'failed'
  transactionHash: text("transaction_hash"), // Blockchain transaction hash if applicable
  recipientId: varchar("recipient_id").references(() => users.id), // For transfers or battle support
  battleId: varchar("battle_id").references(() => battles.id), // For battle support transactions
  createdAt: timestamp("created_at").defaultNow(),
});

// Wallet whitelist table for closed beta
export const walletWhitelist = pgTable("wallet_whitelist", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 42 }).unique().notNull(),
  addedBy: varchar("added_by").references(() => users.id),
  note: text("note"), // Optional note about why this wallet was whitelisted
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema exports
export const insertWalletWhitelistSchema = createInsertSchema(walletWhitelist);
export const selectWalletWhitelistSchema = createSelectSchema(walletWhitelist);
export type InsertWalletWhitelist = z.infer<typeof insertWalletWhitelistSchema>;
export type WalletWhitelist = typeof walletWhitelist.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userLessons: many(userLessons),
  challengedBattles: many(battles, { relationName: "challenger" }),
  opponentBattles: many(battles, { relationName: "opponent" }),
  wonBattles: many(battles, { relationName: "winner" }),
  votesGiven: many(battleVotes, { relationName: "voter" }),
  votesReceived: many(battleVotes, { relationName: "voted_for" }),
  vouchesGiven: many(vouches, { relationName: "from_user" }),
  vouchesReceived: many(vouches, { relationName: "to_user" }),
}));

export const lessonsRelations = relations(lessons, ({ many }) => ({
  userLessons: many(userLessons),
}));

export const userLessonsRelations = relations(userLessons, ({ one }) => ({
  user: one(users, {
    fields: [userLessons.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [userLessons.lessonId],
    references: [lessons.id],
  }),
}));

export const battlesRelations = relations(battles, ({ one, many }) => ({
  challenger: one(users, {
    fields: [battles.challengerId],
    references: [users.id],
    relationName: "challenger",
  }),
  opponent: one(users, {
    fields: [battles.opponentId],
    references: [users.id],
    relationName: "opponent",
  }),
  winner: one(users, {
    fields: [battles.winnerId],
    references: [users.id],
    relationName: "winner",
  }),
  votes: many(battleVotes),
  vouches: many(vouches),
}));

export const battleVotesRelations = relations(battleVotes, ({ one }) => ({
  battle: one(battles, {
    fields: [battleVotes.battleId],
    references: [battles.id],
  }),
  voter: one(users, {
    fields: [battleVotes.voterId],
    references: [users.id],
    relationName: "voter",
  }),
  votedFor: one(users, {
    fields: [battleVotes.votedForId],
    references: [users.id],
    relationName: "voted_for",
  }),
}));

export const vouchesRelations = relations(vouches, ({ one }) => ({
  fromUser: one(users, {
    fields: [vouches.fromUserId],
    references: [users.id],
    relationName: "from_user",
  }),
  toUser: one(users, {
    fields: [vouches.toUserId],
    references: [users.id],
    relationName: "to_user",
  }),
  battle: one(battles, {
    fields: [vouches.battleId],
    references: [battles.id],
  }),
}));

// Schema types
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
});

export const insertUserLessonSchema = createInsertSchema(userLessons).omit({
  id: true,
  createdAt: true,
});

export const insertBattleSchema = createInsertSchema(battles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBattleVoteSchema = createInsertSchema(battleVotes).omit({
  id: true,
  createdAt: true,
});

export const insertVouchSchema = createInsertSchema(vouches).omit({
  id: true,
  createdAt: true,
});

export const insertAuraLevelSchema = createInsertSchema(auraLevels).omit({
  id: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  createdAt: true,
});

export const insertSteezeTransactionSchema = createInsertSchema(steezeTransactions).omit({
  id: true,
  createdAt: true,
});

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertUserLesson = z.infer<typeof insertUserLessonSchema>;
export type UserLesson = typeof userLessons.$inferSelect;
export type InsertBattle = z.infer<typeof insertBattleSchema>;
export type Battle = typeof battles.$inferSelect;
export type InsertBattleVote = z.infer<typeof insertBattleVoteSchema>;
export type BattleVote = typeof battleVotes.$inferSelect;
export type InsertVouch = z.infer<typeof insertVouchSchema>;
export type Vouch = typeof vouches.$inferSelect;
export type InsertAuraLevel = z.infer<typeof insertAuraLevelSchema>;
export type AuraLevel = typeof auraLevels.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertSteezeTransaction = z.infer<typeof insertSteezeTransactionSchema>;
export type SteezeTransaction = typeof steezeTransactions.$inferSelect;
