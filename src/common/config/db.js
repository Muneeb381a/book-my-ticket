import mongoose from "mongoose";

// cache the connection across Vercel serverless invocations
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;
