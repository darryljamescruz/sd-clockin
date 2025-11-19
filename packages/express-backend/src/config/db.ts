import mongoose from 'mongoose';

export default async function connectDB(): Promise<void> {
  const mongoURI: string | undefined =
    process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('MONGO_URI is not defined in environment variables');
    throw new Error('MONGO_URI not configured');
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', (error as Error).message);
    throw error;
  }
}
