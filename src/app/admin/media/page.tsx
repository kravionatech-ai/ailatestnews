import { connectDB } from "@/lib/db/connection";
import { Media } from "@/lib/db/models";
import { MediaManager } from "@/components/admin/media/media-manager";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  await connectDB();
  const rawItems = await Media.find().sort({ createdAt: -1 }).limit(100).lean();
  const mediaItems = JSON.parse(JSON.stringify(rawItems));

  return <MediaManager initialItems={mediaItems} />;
}
