import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connection";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "disconnected";
  try {
    await connectDB();
    dbStatus = mongoose.connection.readyState === 1 ? "connected" : "connecting";
  } catch (err: unknown) {
    dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json(
    {
      status: dbStatus === "connected" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      db: dbStatus,
      env: process.env.NODE_ENV,
    },
    { status: dbStatus === "connected" ? 200 : 503 }
  );
}
