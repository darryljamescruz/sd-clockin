import mongoose from 'mongoose';

export default async function connectDB(): Promise<void> {
  const mongoURI: string | undefined = process.env.MONGO_URI;
  console.log(mongoURI);
  if (!mongoURI) {
    console.log('Mongo URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', (error as Error).message);
    process.exit(1);
  }
}
