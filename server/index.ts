import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve attached assets statically
app.use('/attached_assets', express.static(path.resolve(process.cwd(), 'attached_assets')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Initialize Steeze event monitoring for security
  try {
    const { web3Service } = await import("./web3");
    web3Service.monitorSteezeEvents();
    log("Steeze event monitoring initialized");
  } catch (error) {
    log("Failed to initialize Steeze event monitoring:", String(error));
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("app.get('env'):", app.get("env"));
  
  // Force production mode when deployed
  const isProduction = process.env.NODE_ENV === "production" || 
                      process.env.REPL_DEPLOYMENT === "1" ||
                      process.env.DEPLOYMENT === "true" ||
                      process.env.FORCE_PRODUCTION === "true";
  
  console.log("Is Production Mode:", isProduction);
  console.log("Current working directory:", process.cwd());
  console.log("__dirname equivalent:", import.meta.dirname);
  
  if (isProduction) {
    console.log("🚀 Setting up PRODUCTION mode with static files...");
    
    // CRITICAL: Handle deployment environment correctly
    let distPath;
    
    // Try multiple possible paths for static files
    const possiblePaths = [
      path.resolve(process.cwd(), "dist", "public"),   // Local build
      path.resolve(process.cwd(), "public"),           // Deployed in dist/
      path.resolve(__dirname, "..", "dist", "public"), // Relative to server
      path.resolve(__dirname, "public")                // Server-relative deployed
    ];
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        distPath = testPath;
        break;
      }
    }
    
    if (!distPath) {
      console.error("❌ CRITICAL: No static files found in any expected location!");
      console.log("Searched paths:", possiblePaths);
      process.exit(1);
    }
    
    console.log("✅ Serving static files from:", distPath);
    console.log("✅ Static directory exists:", fs.existsSync(distPath));
    
    // List available assets for debugging
    try {
      const assetsPath = path.join(distPath, 'assets');
      if (fs.existsSync(assetsPath)) {
        const assets = fs.readdirSync(assetsPath);
        console.log('✅ Available production assets:', assets.filter((f: string) => f.endsWith('.js') || f.endsWith('.css')));
      } else {
        console.log("❌ No assets directory found");
      }
    } catch (error) {
      console.error('❌ Error listing production assets:', error);
    }
    
    // Serve static files with proper caching
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        res.setHeader('X-Static-Path', distPath);
      }
    }));

    // SPA fallback - MUST be last route
    app.use("*", (req, res) => {
      console.log(`📄 Serving SPA fallback for: ${req.path}`);
      const indexPath = path.resolve(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send(`Static files not found at ${distPath}`);
      }
    });
  } else {
    console.log("🔧 Setting up development mode with Vite...");
    await setupVite(app, server);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
