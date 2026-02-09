import dotenv from 'dotenv';

// Load environment variables FIRST, before any other imports that might use them
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { startAutoClockOutJob } from './jobs/autoClockOut.js';

import studentsRouter from './routes/students.js';
import termsRouter from './routes/terms.js';
import schedulesRouter from './routes/schedules.js';
import checkinsRouter from './routes/checkins.js';
import importRouter from './routes/import.js';
import adminUsersRouter from './routes/admin-users.js';

const app: Application = express();

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins =
      process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [];

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
app.use('/api/admin-users', adminUsersRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Temporary cache flush endpoint (remove after use)
app.post('/api/cache/flush', async (req, res) => {
  const { default: cache } = await import('./utils/cache.js');
  await cache.flushAll();
  res.json({ message: 'Cache flushed successfully' });
});

// Start server function
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDB();

    // Start scheduled jobs
    startAutoClockOutJob();

    const PORT: number = parseInt(process.env.PORT || '8000', 10);
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error);
    console.error((error as Error).message);
    process.exit(1);
  }
}

// Start the server
startServer();
