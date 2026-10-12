import mongoose from "mongoose";
import env from "./env.js";

/**
 * Connects to MongoDB Atlas.
 * We don't catch errors here - if the DB can't connect, server.js should
 * know about it and exit, not silently run an API with no database.
 */
export async function connectDB() {
  mongoose.set("strictQuery", true);

  const conn = await mongoose.connect(
    env.databaseUri,
    env.dbName ? { dbName: env.dbName } : undefined
  );

  console.log(`MongoDB connected: ${conn.connection.host}`);

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error after initial connect:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  return conn;
}

export default connectDB;