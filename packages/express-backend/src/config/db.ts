import mongoose from 'mongoose';

export default async function connectDB(): Promise<void> {
  // Support both MONGO_URI and MONGODB_URI for flexibility
  const mongoURI: string | undefined =
    process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('❌ MongoDB URI is not defined in environment variables');
    console.error('Please set MONGO_URI or MONGODB_URI in your .env file');
    console.error('Example: MONGODB_URI=mongodb://localhost:27017/sd-clockin');
    throw new Error('MongoDB URI not configured');
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', (error as Error).message);
    throw error;
  }
}
