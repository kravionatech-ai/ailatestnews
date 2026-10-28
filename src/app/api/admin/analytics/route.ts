import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { ViewStat, Post } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rangeParam = Number(searchParams.get("range")) || 30;
    const range = rangeParam === 7 || rangeParam === 90 ? rangeParam : 30;

    await connectDB();

    const trafficStart = new Date();
    trafficStart.setUTCHours(0, 0, 0, 0);
    trafficStart.setUTCDate(trafficStart.getUTCDate() - (range - 1));

    const [trafficRows, viewsAgg] = await Promise.all([
      ViewStat.find({ date: { $gte: trafficStart } })
        .select("date views uniqueVisitors referrers countries devices readingDepth")
        .lean(),
      Post.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
    ]);

    const lifetimeViews = viewsAgg[0]?.total || 0;

    return NextResponse.json({
      success: true,
      range,
      trafficRows,
      lifetimeViews,
    });
  } catch (error) {
    console.error("[Admin Analytics API Error]", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
