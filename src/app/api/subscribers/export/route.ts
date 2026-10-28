import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Subscriber } from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectDB();
  const subscribers = await Subscriber.find().lean();

  const headers = ["Email", "Name", "Status", "Source", "SubscribedAt"].join(",");
  const rows = subscribers.map((s) =>
    [
      `"${s.email}"`,
      `"${s.name || ""}"`,
      `"${s.status}"`,
      `"${s.source || ""}"`,
      `"${s.subscribedAt ? new Date(s.subscribedAt).toISOString() : ""}"`,
    ].join(",")
  );

  const csv = [headers, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ailatestnews_subscribers.csv"',
    },
  });
}
