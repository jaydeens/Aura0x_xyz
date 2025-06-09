import crypto from "crypto";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

export function setupTwitterAuth(app: Express) {
  if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
    console.warn("Twitter authentication not configured - missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET");
    return;
  }

  // Store pending OAuth requests
  const pendingOAuthRequests = new Map<string, { codeChallenge: string, codeVerifier: string }>();

  // Helper function to generate PKCE challenge
  function generatePKCE() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  // Twitter auth initiation
  app.get("/api/auth/twitter", (req, res) => {
    console.log("Twitter auth initiated");
    
    try {
      const { codeVerifier, codeChallenge } = generatePKCE();
      const state = crypto.randomBytes(16).toString('hex');
      
      // Store PKCE values for this request
      pendingOAuthRequests.set(state, { codeChallenge, codeVerifier });
      
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.TWITTER_CLIENT_ID!,
        redirect_uri: 'https://aura0x.xyz/api/auth/twitter/callback',
        scope: 'tweet.read users.read offline.access',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });
      
      const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
      console.log("Redirecting to Twitter auth URL:", authUrl);
      
      res.redirect(authUrl);
    } catch (error) {
      console.error("Error initiating Twitter auth:", error);
      res.redirect("/?error=twitter_auth_error&details=" + encodeURIComponent("Failed to initiate authentication"));
    }
  });

  // Twitter auth callback
  app.get("/api/auth/twitter/callback", async (req, res) => {
    console.log("Twitter callback received with query:", req.query);
    
    try {
      const { code, state, error } = req.query;
      
      if (error) {
        console.error("Twitter OAuth error:", error);
        return res.redirect("/?error=twitter_auth_error&details=" + encodeURIComponent(error as string));
      }
      
      if (!code || !state) {
        console.error("Missing code or state in callback");
        return res.redirect("/?error=twitter_auth_error&details=" + encodeURIComponent("Missing authorization code"));
      }
      
      // Retrieve PKCE values
      const oauthData = pendingOAuthRequests.get(state as string);
      if (!oauthData) {
        console.error("Invalid or expired state parameter");
        return res.redirect("/?error=twitter_auth_error&details=" + encodeURIComponent("Invalid authentication state"));
      }
      
      // Clean up the pending request
      pendingOAuthRequests.delete(state as string);
      
      // Exchange code for access token
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.TWITTER_CLIENT_ID!,
        redirect_uri: 'https://aura0x.xyz/api/auth/twitter/callback',
        code: code as string,
        code_verifier: oauthData.codeVerifier
      });
      
      console.log("Exchanging code for token...");
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')
        },
        body: tokenParams.toString()
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange failed:", tokenResponse.status, errorText);
        return res.redirect("/?error=twitter_auth_error&details=" + encodeURIComponent("Token exchange failed"));
      }
      
      const tokenData = await tokenResponse.json();
      console.log("Token exchange successful");
      
      // Fetch user profile
      console.log("Fetching user profile...");
      const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,verified', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error("User profile fetch failed:", userResponse.status, errorText);
        return res.redirect("/?error=twitter_auth_error&details=" + encodeURIComponent("Failed to fetch user profile"));
      }
      
      const userData = await userResponse.json();
      console.log("Twitter user data received:", userData);
      const twitterUser = userData.data;
      
      // Create or update user with Twitter data
      const user = await storage.upsertUser({
        id: `twitter_${twitterUser.id}`,
        email: null,
        firstName: twitterUser.name?.split(' ')[0] || twitterUser.username,
        lastName: twitterUser.name?.split(' ').slice(1).join(' ') || null,
        profileImageUrl: twitterUser.profile_image_url || null,
        username: twitterUser.username,
        twitterId: twitterUser.id,
        twitterUsername: twitterUser.username,
        twitterAccessToken: tokenData.access_token,
        twitterRefreshToken: tokenData.refresh_token,
        isVerified: twitterUser.verified || false,
      });
      
      // Set up session
      (req.session as any).user = user;
      console.log("Twitter authentication successful for user:", user.id);
      res.redirect("/dashboard");
      
    } catch (error) {
      console.error("Twitter callback error:", error);
      res.redirect("/?error=twitter_auth_error&details=" + encodeURIComponent("Authentication failed"));
    }
  });
}

export const requireTwitterAuth: RequestHandler = (req: any, res, next) => {
  if (!req.user || !req.user.twitterId) {
    return res.status(401).json({ message: "Twitter authentication required" });
  }
  next();
};