import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

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
  
  if (!isProduction && app.get("env") === "development") {
    console.log("Setting up development mode with Vite...");
    await setupVite(app, server);
  } else {
    console.log("Setting up production mode with static files...");
    
    // Enhanced static file serving for production
    const distPath = path.resolve(process.cwd(), "dist", "public");
    console.log("Serving static files from:", distPath);
    console.log("Static directory exists:", require('fs').existsSync(distPath));
    
    // List available assets for debugging
    try {
      const assetsPath = path.join(distPath, 'assets');
      if (require('fs').existsSync(assetsPath)) {
        const assets = require('fs').readdirSync(assetsPath);
        console.log('Available production assets:', assets.filter((f: string) => f.endsWith('.js') || f.endsWith('.css')));
      }
    } catch (error) {
      console.error('Error listing production assets:', error);
    }
    
    serveStatic(app);
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
