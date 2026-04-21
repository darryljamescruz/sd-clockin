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
import { verifyAdmin } from './utils/auth.js';

const app: Application = express();
// ... (corsOptions stays same)
// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'hello service desk' });
});

// API Routes
// Public routes (though students might need internal method-level protection)
app.use('/api/students', studentsRouter);
app.use('/api/checkins', checkinsRouter);

// Protected Admin routes
app.use('/api/terms', verifyAdmin, termsRouter);
app.use('/api/schedules', verifyAdmin, schedulesRouter);
app.use('/api/import', verifyAdmin, importRouter);
app.use('/api/admin-users', verifyAdmin, adminUsersRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Temporary cache flush endpoint (protected)
app.post('/api/cache/flush', verifyAdmin, async (req, res) => {
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
