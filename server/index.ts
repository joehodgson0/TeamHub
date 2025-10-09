import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as fs from "fs";
import * as path from "path";

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

// Setup production build file serving
function setupProductionBuild() {
  console.log('[startup] Configuring production build file serving...');
  
  // Define paths
  const buildOutputPath = path.resolve(import.meta.dirname, '..', 'dist', 'public');
  const serverPublicPath = path.resolve(import.meta.dirname, '..', 'server', 'public');
  
  console.log(`[startup] Build output path: ${buildOutputPath}`);
  console.log(`[startup] Server public path: ${serverPublicPath}`);
  
  // Check if build output exists
  if (!fs.existsSync(buildOutputPath)) {
    const error = new Error(
      `Production build not found at ${buildOutputPath}. ` +
      'Please run the build process first to generate the production assets. ' +
      'Expected directory structure: dist/public with built client files.'
    );
    console.error('[startup] ❌ Build validation failed:');
    console.error(`[startup] Missing directory: ${buildOutputPath}`);
    console.error('[startup] This usually means the frontend build process has not been run.');
    console.error('[startup] Run the appropriate build command to generate production assets.');
    throw error;
  }
  
  console.log('[startup] ✅ Build output directory found');
  
  // Remove existing server/public if it exists
  if (fs.existsSync(serverPublicPath)) {
    console.log('[startup] Removing existing server/public directory...');
    fs.rmSync(serverPublicPath, { recursive: true, force: true });
  }
  
  // Ensure server directory exists
  const serverDir = path.dirname(serverPublicPath);
  if (!fs.existsSync(serverDir)) {
    console.log(`[startup] Creating server directory: ${serverDir}`);
    fs.mkdirSync(serverDir, { recursive: true });
  }
  
  // Try to create symlink, fallback to copy
  try {
    console.log('[startup] Attempting to create symlink from build output to server/public...');
    fs.symlinkSync(buildOutputPath, serverPublicPath, 'dir');
    console.log('[startup] ✅ Symlink created successfully');
    console.log(`[startup] Symlink: ${serverPublicPath} -> ${buildOutputPath}`);
  } catch (symlinkError) {
    console.warn('[startup] ⚠️  Symlink creation failed, falling back to copy operation');
    console.warn(`[startup] Symlink error: ${symlinkError instanceof Error ? symlinkError.message : symlinkError}`);
    
    try {
      console.log('[startup] Copying build output to server/public...');
      fs.cpSync(buildOutputPath, serverPublicPath, { recursive: true });
      console.log('[startup] ✅ Files copied successfully');
      console.log(`[startup] Copied from: ${buildOutputPath}`);
      console.log(`[startup] Copied to: ${serverPublicPath}`);
    } catch (copyError) {
      const error = new Error(
        `Failed to setup production file serving. ` +
        `Could not create symlink or copy from ${buildOutputPath} to ${serverPublicPath}. ` +
        `Symlink error: ${symlinkError instanceof Error ? symlinkError.message : symlinkError}. ` +
        `Copy error: ${copyError instanceof Error ? copyError.message : copyError}`
      );
      console.error('[startup] ❌ File serving setup failed:');
      console.error(`[startup] Symlink failed: ${symlinkError}`);
      console.error(`[startup] Copy failed: ${copyError}`);
      throw error;
    }
  }
  
  // Verify the setup worked
  if (!fs.existsSync(serverPublicPath)) {
    throw new Error(`File serving setup verification failed: ${serverPublicPath} does not exist after setup`);
  }
  
  console.log('[startup] ✅ Production build file serving configured successfully');
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
    if ((process.env.NODE_ENV || '').trim() === 'development') {
      console.log('[startup] Setting up Vite development server...');
      await setupVite(app, server);
      console.log('[startup] Vite development server ready');
    } else {
      console.log('[startup] Setting up static file serving for production...');
      setupProductionBuild();
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
      host: "127.0.0.1"
    }, () => {
      log(`serving on port ${port}`);
      console.log(`[startup] ✅ Server successfully started in ${process.env.NODE_ENV} mode`);
      console.log(`[startup] 🚀 Application ready at http://127.0.0.1:${port}`);
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
