import mongoose from 'mongoose';

export default async function connectDB() {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
        console.log("MongoDB URI is not defined in environment variables");
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoURI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
}