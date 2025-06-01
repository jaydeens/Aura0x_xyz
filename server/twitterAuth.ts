import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

export function setupTwitterAuth(app: Express) {
  if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
    console.warn("Twitter authentication not configured - missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET");
    return;
  }

  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CLIENT_ID,
    consumerSecret: process.env.TWITTER_CLIENT_SECRET,
    callbackURL: "/api/auth/twitter/callback",
    includeEmail: true,
  }, async (token, tokenSecret, profile, done) => {
    try {
      // Create or update user with Twitter data
      const user = await storage.upsertUser({
        id: `twitter_${profile.id}`,
        email: profile.emails?.[0]?.value || null,
        firstName: profile.displayName?.split(' ')[0] || profile.username,
        lastName: profile.displayName?.split(' ').slice(1).join(' ') || null,
        profileImageUrl: profile.photos?.[0]?.value || null,
        username: profile.username,
        twitterId: profile.id,
        twitterUsername: profile.username,
        isVerified: false,
      });
      
      return done(null, user);
    } catch (error) {
      console.error("Twitter auth error:", error);
      return done(error, null);
    }
  }));

  // Twitter auth routes
  app.get("/api/auth/twitter", passport.authenticate("twitter"));

  app.get("/api/auth/twitter/callback", 
    passport.authenticate("twitter", { failureRedirect: "/" }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      res.redirect("/");
    }
  );
}

export const requireTwitterAuth: RequestHandler = (req: any, res, next) => {
  if (!req.user || !req.user.twitterId) {
    return res.status(401).json({ message: "Twitter authentication required" });
  }
  next();
};