import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    
    // Monitor MongoDB query performance
    mongoose.connection.on('commandStarted', (event) => {
      console.log(`[MongoDB] Command started: ${event.commandName} on ${event.databaseName}.${event.command.collection || 'N/A'}`);
    });
    
    mongoose.connection.on('commandSucceeded', (event) => {
      const duration = event.duration ? `${event.duration}ms` : 'N/A';
      console.log(`[MongoDB] Command succeeded: ${event.commandName} in ${duration}`);
    });
    
    mongoose.connection.on('commandFailed', (event) => {
      const duration = event.duration ? `${event.duration}ms` : 'N/A';
      console.error(`[MongoDB] Command failed: ${event.commandName} after ${duration}`, event.failure);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;