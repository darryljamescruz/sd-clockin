import express, { Application } from 'express';
import cors from 'cors';
// import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// later implementation for backend build
// import { fileURLToPath } from "url";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

dotenv.config();
const app: Application = express();

try {
    // frontend build directory
    // const staticDir = path.join(__dirname, "../frontend-build"); 
    // console.log("Index.js will serve static files from:", staticDir);

    app.use(cors());
    app.use(express.json());

    await connectDB();

    const PORT: number = parseInt(process.env.PORT || '8000', 10);
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
} catch (error) {
    console.error("Error starting the server:", (error as Error).message);
    process.exit(1);
} 