import mongoose from "mongoose";
import { env } from "@/env";

/**
 * Global singleton for MongoDB connection.
 * Prevents multiple connections in serverless environments
 * where module-level state is shared across requests.
 */

/* eslint-disable no-var */
declare global {
  var mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}
/* eslint-enable no-var */

const MONGODB_URI = env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

// Use global singleton to survive serverless cold starts
let cached = global.mongooseConnection;

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with connection pooling.
 * Returns a cached connection if one already exists.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("[MongoDB] Connected successfully");
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.error("[MongoDB] Connection error:", error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB. Useful for testing/cleanup.
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log("[MongoDB] Disconnected");
  }
}

/**
 * Check if currently connected.
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
