import express, { Application } from 'express';
import cors from 'cors';
// import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Import routes
import studentsRouter from './routes/students.js';
import termsRouter from './routes/terms.js';
import schedulesRouter from './routes/schedules.js';
import checkinsRouter from './routes/checkins.js';
import importRouter from './routes/import.js';

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
    const allowedOrigins =
      process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [];

    // Log CORS configuration on first request (for debugging)
    if (allowedOrigins.length === 0) {
      console.warn(
        '⚠️  ALLOWED_ORIGINS not set - no origins will be allowed in production'
      );
    }

    // Check if origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      // In development, allow localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    } else {
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
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'hello service desk' });
});

// API Routes
app.use('/api/students', studentsRouter);
app.use('/api/terms', termsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/checkins', checkinsRouter);
app.use('/api/import', importRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server function
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDB();

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
