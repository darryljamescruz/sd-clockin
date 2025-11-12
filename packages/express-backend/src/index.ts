import express, { Application } from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
// import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Import routes
import studentsRouter from './routes/students.js';
import termsRouter from './routes/terms.js';
import schedulesRouter from './routes/schedules.js';
import checkinsRouter from './routes/checkins.js';
import importRouter from './routes/import.js';
import authRouter from './routes/auth.js';

// later implementation for backend build
// import { fileURLToPath } from "url";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

dotenv.config();

const app: Application = express();

// Secure CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment variable
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
    console.log('allowedOrigins', allowedOrigins);
    
    // Log CORS configuration on first request (for debugging)
    if (allowedOrigins.length === 0) {
      console.warn('⚠️  ALLOWED_ORIGINS not set - no origins will be allowed in production');
    }
    
    // Check if origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed: ${origin} (in allowed list)`);
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      // In development, allow localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        console.log(`🚫 CORS blocked: ${origin} (not in allowed list)`);
        callback(null, false);
      }
    } else {
      console.log(`🚫 CORS blocked: ${origin} (not in allowed list: ${allowedOrigins.join(', ')})`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours - cache preflight requests
};

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days default
    sameSite: 'lax',
  },
}));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/terms', termsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/checkins', checkinsRouter);
app.use('/api/import', importRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Initialize demo account
async function initializeDemoAccount(): Promise<void> {
  try {
    const AdminUser = (await import('./models/AdminUser.js')).default;
    const demoUser = await AdminUser.findOne({ email: 'admin', name: 'admin' });
    
    if (!demoUser) {
      // Create demo account with plain text password hash (we'll check plain text in auth)
      const newDemoUser = new AdminUser({
        name: 'admin',
        email: 'admin',
        passwordHash: 'demo_account_plain_text_password', // Special marker for demo account
        isAdmin: true,
      });
      await newDemoUser.save();
      console.log('✅ Demo account created (username: admin, password: admin123)');
    }
  } catch (error) {
    console.error('❌ Error initializing demo account:', error);
  }
}

// Start server function
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize demo account
    await initializeDemoAccount();
    
    const PORT: number = parseInt(process.env.PORT || '8000', 10);
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Error starting the server:', error);
    console.error((error as Error).message);
    process.exit(1);
  }
}

// Start the server
startServer();
