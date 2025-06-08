import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

export function setupTwitterAuth(app: Express) {
  if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
    console.warn("Twitter authentication not configured - missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET");
    return;
  }

  // X (Twitter) OAuth 2.0 Strategy
  passport.use('twitter', new OAuth2Strategy({
    authorizationURL: 'https://twitter.com/i/oauth2/authorize',
    tokenURL: 'https://api.twitter.com/2/oauth2/token',
    clientID: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    callbackURL: `https://aura0x.xyz/api/auth/twitter/callback`,
    scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    state: true,
    pkce: true,
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Fetch user profile from Twitter API
      const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,verified', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch Twitter user profile');
      }
      
      const userData = await userResponse.json();
      const twitterUser = userData.data;
      
      // Create or update user with Twitter data
      const user = await storage.upsertUser({
        id: `twitter_${twitterUser.id}`,
        email: null, // Twitter API v2 doesn't provide email in basic scope
        firstName: twitterUser.name?.split(' ')[0] || twitterUser.username,
        lastName: twitterUser.name?.split(' ').slice(1).join(' ') || null,
        profileImageUrl: twitterUser.profile_image_url || null,
        username: twitterUser.username,
        twitterId: twitterUser.id,
        twitterUsername: twitterUser.username,
        twitterAccessToken: accessToken,
        twitterRefreshToken: refreshToken,
        isVerified: twitterUser.verified || false,
      });
      
      return done(null, user);
    } catch (error) {
      console.error("Twitter OAuth 2.0 error:", error);
      return done(error, null);
    }
  }));

  // Twitter auth routes
  app.get("/api/auth/twitter", (req, res, next) => {
    console.log("Twitter auth initiated");
    passport.authenticate("twitter")(req, res, next);
  });

  app.get("/api/auth/twitter/callback", 
    (req, res, next) => {
      console.log("Twitter callback received:", req.query);
      next();
    },
    passport.authenticate("twitter", { 
      failureRedirect: "/?error=twitter_auth_failed",
      failureMessage: true 
    }),
    (req, res) => {
      console.log("Twitter authentication successful");
      // Successful authentication, redirect to dashboard
      res.redirect("/?twitter_connected=true");
    }
  );
}

export const requireTwitterAuth: RequestHandler = (req: any, res, next) => {
  if (!req.user || !req.user.twitterId) {
    return res.status(401).json({ message: "Twitter authentication required" });
  }
  next();
};