// === PRODUCTION LOGGING START ===
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Server starting with NODE_ENV:', process.env.NODE_ENV);
}

// Production environment validation
function validateProductionEnvironment() {
  const requiredEnvVars = {
    GOOGLE_DIRECTIONS_API_KEY: process.env.GOOGLE_DIRECTIONS_API_KEY,
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY
  };
  
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);
  
  if (process.env.NODE_ENV === 'production' && missingVars.length > 0) {
    console.warn('⚠️ Missing production environment variables:', missingVars.join(', '));
    console.warn('🔧 Some features may be limited without API keys');
    // Don't exit - allow graceful degradation
  }
  
  return {
    hasAllKeys: missingVars.length === 0,
    missingKeys: missingVars,
    availableKeys: Object.keys(requiredEnvVars).filter(key => requiredEnvVars[key as keyof typeof requiredEnvVars])
  };
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received - graceful shutdown initiated');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received - graceful shutdown initiated');
  process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚫 Unhandled Rejection:', reason);
  process.exit(1);
});

// Memory monitoring only in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const usage = process.memoryUsage();
    console.log('📈 Memory check:', {
      rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
      uptime: Math.round(process.uptime()) + 's'
    });
  }, 60000); // Every 60 seconds, only in dev
}
// === PRODUCTION LOGGING END ===

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";

// Environment validation and info
const envValidation = validateProductionEnvironment();
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Environment - NODE_ENV:', process.env.NODE_ENV, 'PORT:', process.env.PORT);
  console.log('🔑 Environment validation:', envValidation);
} else {
  console.log('🚀 Production environment - Available keys:', envValidation.availableKeys.length);
}

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

(async () => {
  console.log('🔄 Starting async server setup...');
  
  try {
    // Add timeout protection for route registration with deployment-friendly timeout
    const isProduction = process.env.NODE_ENV === 'production';
    const timeoutDuration = isProduction ? 120000 : 30000; // 2 minutes for production, 30s for dev
    
    console.log(`🔧 Setting route registration timeout to ${timeoutDuration/1000}s (${isProduction ? 'production' : 'development'} mode)`);
    
    const routeRegistrationPromise = registerRoutes(app);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error(`💥 DEPLOYMENT ERROR: Route registration timeout after ${timeoutDuration/1000} seconds`);
        console.error('🔍 This could indicate slow file system operations, network issues, or heavy service initialization');
        console.error('🔧 Check: POI data loading, API key validation, service initialization');
        reject(new Error(`Route registration timeout after ${timeoutDuration/1000} seconds`));
      }, timeoutDuration);
    });
    
    const server = await Promise.race([routeRegistrationPromise, timeoutPromise]);
    console.log(`✅ Routes registered successfully in ${isProduction ? 'production' : 'development'} mode`);
    console.log('🚀 Server startup successful - all services initialized');
    
    // Routes are already registered via registerRoutes above

    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Enhanced error logging
      console.error('🔥 Express error handler triggered:', {
        status,
        message,
        path: req.path,
        method: req.method,
        stack: err.stack
      });
      
      res.status(status).json({ message });
      throw err;
    });

    // Add error boundary for router initialization
    process.on('uncaughtException', (error) => {
      if (error.message.includes('Grid Router') || error.message.includes('A* Router')) {
        console.warn('⚠️ Router initialization warning:', error.message);
        // Continue server startup even if routing has issues
        return;
      }
      console.error('💥 Uncaught Exception:', error.message);
      process.exit(1);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "development") {
      console.log('🛠️  Setting up Vite for development...');
      await setupVite(app, server);
    } else {
      console.log('📦 Setting up production static serving...');
      
      // Custom static file serving with correct build path
      const distPath = path.resolve(process.cwd(), "dist/public");
      
      if (!fs.existsSync(distPath)) {
        console.error(`❌ Warning: Build directory not found at ${distPath}. Run 'npm run build' first.`);
        log(`Warning: Build directory not found at ${distPath}. Run 'npm run build' first.`);
      } else {
        console.log('✅ Build directory found, setting up static serving...');
        
        // Serve static assets
        app.use(express.static(distPath));
        
        // Handle client-side routing - serve index.html for all non-API routes
        app.use("*", (req, res) => {
          // Exclude API routes from SPA fallback
          if (req.path.startsWith('/api')) {
            return res.status(404).json({ message: 'API endpoint not found' });
          }
          
          res.sendFile(path.join(distPath, "index.html"));
        });
      }
    }

    // Use environment PORT variable or fallback to 5000
    const port = parseInt(process.env.PORT || '5000', 10);
    
    console.log(`🌐 Starting server on port ${port} (binding to 0.0.0.0 for deployment compatibility)...`);
    console.log(`📊 Server startup summary: ENV=${process.env.NODE_ENV}, PORT=${port}, HOST=0.0.0.0`);
    
    // Simplified server listen for GCE compatibility
    const serverInstance = server.listen(port, "0.0.0.0", () => {
      console.log(`✅ DEPLOYMENT SUCCESS: Server ready at http://0.0.0.0:${port}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV}`);
      console.log(`🎯 Deployment status: Server accessible on all interfaces (0.0.0.0:${port})`);
      console.log(`🔗 External access: Ready for deployment proxy mapping`);
      log(`serving on port ${port}`);
    }).on('error', (err: NodeJS.ErrnoException) => {
      console.error('💥 DEPLOYMENT ERROR: Server failed to start');
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ DEPLOYMENT ERROR: Port ${port} is already in use`);
        console.error('🔧 Fix: Check if another process is using this port');
        process.exit(1);
      } else {
        console.error('🔥 DEPLOYMENT ERROR: Server startup failed:', {
          error: err.message,
          code: err.code,
          port: port,
          host: '0.0.0.0'
        });
        process.exit(1);
      }
    });

    // Server error handling
    serverInstance.on('error', (error) => {
      console.error('🔥 Server error:', error);
    });

    serverInstance.on('close', () => {
      console.log('🛑 Server closed');
    });

    // Handle server-level errors
    serverInstance.on('clientError', (err, socket) => {
      console.error('🚫 Client error:', err);
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

  } catch (error) {
    console.error('💥 DEPLOYMENT FAILURE: Server startup failed completely');
    console.error('🔍 Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT || '5000'
    });
    console.error('🔧 Deployment troubleshooting:');
    console.error('   - Check if all required secrets are set');
    console.error('   - Verify build directory exists (npm run build)');
    console.error('   - Check file permissions and data file access');
    console.error('   - Review route registration timeout logs above');
    process.exit(1);
  }
})();
