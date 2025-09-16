import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Add environment variable validation
function validateEnvironment() {
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv) {
    console.warn('[startup] NODE_ENV not set, defaulting to development');
    process.env.NODE_ENV = 'development';
  }
  console.log(`[startup] Running in ${process.env.NODE_ENV} mode`);
  
  if (nodeEnv === 'production') {
    console.log('[startup] Production mode - serving static files');
  } else {
    console.log('[startup] Development mode - using Vite HMR');
  }
}

// Enhanced startup function with error handling
(async () => {
  try {
    console.log('[startup] Initializing server...');
    validateEnvironment();
    
    const server = await registerRoutes(app);
    console.log('[startup] Routes registered successfully');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "development") {
      console.log('[startup] Setting up Vite development server...');
      await setupVite(app, server);
      console.log('[startup] Vite development server ready');
    } else {
      console.log('[startup] Setting up static file serving for production...');
      serveStatic(app);
      console.log('[startup] Static file serving configured');
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    console.log(`[startup] Starting server on port ${port}...`);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      console.log(`[startup] ✅ Server successfully started in ${process.env.NODE_ENV} mode`);
      console.log(`[startup] 🚀 Application ready at http://0.0.0.0:${port}`);
    });
    
  } catch (error) {
    console.error('[startup] ❌ Fatal error during server initialization:');
    console.error(error);
    
    // Log specific error details for debugging
    if (error instanceof Error) {
      console.error(`[startup] Error name: ${error.name}`);
      console.error(`[startup] Error message: ${error.message}`);
      if (error.stack) {
        console.error(`[startup] Stack trace:`);
        console.error(error.stack);
      }
    }
    
    console.error('[startup] Server failed to start. Exiting...');
    process.exit(1);
  }
})();
