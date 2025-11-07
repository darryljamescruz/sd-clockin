import express, { Application } from 'express';
import cors from 'cors';
// import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db';

// Import routes
import studentsRouter from './routes/students';
import termsRouter from './routes/terms';
import schedulesRouter from './routes/schedules';
import checkinsRouter from './routes/checkins';

// later implementation for backend build
// import { fileURLToPath } from "url";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

dotenv.config();

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/students', studentsRouter);
app.use('/api/terms', termsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/checkins', checkinsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server function
async function startServer() {
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
