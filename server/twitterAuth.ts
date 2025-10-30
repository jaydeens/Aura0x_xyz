import crypto from "crypto";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

export function setupTwitterAuth(app: Express) {
  if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
    console.warn("Twitter authentication not configured - missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET");
    return;
  }

  // Get redirect URI from environment
  const getRedirectUri = (req?: any) => {
    // Try to get host from request first (most reliable)
    if (req?.get?.('host')) {
      const protocol = req.get('host').includes('localhost') ? 'http' : 'https';
      const redirectUri = `${protocol}://${req.get('host')}/api/auth/twitter/callback`;
      console.log('Using request-based redirect URI:', redirectUri);
      return redirectUri;
    }
    
    // Fallback to REPLIT_DOMAINS
    const domains = process.env.REPLIT_DOMAINS?.split(',') || [];
    if (domains.length > 0) {
      const primaryDomain = domains[0].trim();
      const redirectUri = `https://${primaryDomain}/api/auth/twitter/callback`;
      console.log('Using REPLIT_DOMAINS redirect URI:', redirectUri);
      return redirectUri;
    }
    
    // Last resort fallback (development only)
    console.warn('No valid host found, using localhost fallback - this will fail in production!');
    return 'http://localhost:5000/api/auth/twitter/callback';
  };

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
      
      const redirectUri = getRedirectUri(req);
      
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.TWITTER_CLIENT_ID!,
        redirect_uri: redirectUri,
        scope: 'tweet.read tweet.write users.read offline.access',
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
      const redirectUri = getRedirectUri(req);
      
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.TWITTER_CLIENT_ID!,
        redirect_uri: redirectUri,
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
      
      // Check if this is a binding request from an existing authenticated user
      let existingUserId: string | null = null;
      if ((req.session as any)?.user?.id) {
        existingUserId = (req.session as any).user.id;
      }

      let user: any;
      
      if (existingUserId) {
        // This is a binding request - bind Twitter to existing user
        console.log("Binding Twitter account to existing user:", existingUserId);
        
        // Check if Twitter account is already linked to another user
        const existingTwitterUser = await storage.getUserByTwitter(twitterUser.id);
        if (existingTwitterUser && existingTwitterUser.id !== existingUserId) {
          return res.redirect("/?error=twitter_bind_error&details=" + encodeURIComponent("This Twitter account is already linked to another user"));
        }
        
        // Update existing user with Twitter data
        user = await storage.updateUserProfile(existingUserId, {
          twitterId: twitterUser.id,
          twitterUsername: twitterUser.username,
          twitterAccessToken: tokenData.access_token,
          twitterRefreshToken: tokenData.refresh_token,
        });
        
        // Keep existing session but refresh user data
        (req.session as any).user = user;
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
          }
          console.log("Twitter account successfully bound to user:", existingUserId);
          // Add small delay to ensure session is persisted
          setTimeout(() => {
            res.redirect("/settings?twitter_connected=true");
          }, 100);
        });
      } else {
        // This is a new login - check if Twitter user already exists
        const existingTwitterUser = await storage.getUserByTwitter(twitterUser.id);
        
        if (existingTwitterUser) {
          // Update existing Twitter user with fresh tokens
          user = await storage.updateUserProfile(existingTwitterUser.id, {
            twitterAccessToken: tokenData.access_token,
            twitterRefreshToken: tokenData.refresh_token,
          });
        } else {
          // Create new user with Twitter data
          user = await storage.upsertUser({
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
        }
        
        // Set up session and save before redirect
        (req.session as any).user = user;
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
          }
          console.log("Twitter authentication successful for user:", user.id);
          // Add small delay to ensure session is persisted
          setTimeout(() => {
            res.redirect("/");
          }, 100);
        });
      }
      
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