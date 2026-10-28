import { connectDB } from "@/lib/db/connection";
import { ContactMessage } from "@/lib/db/models";
import { MessagesManager } from "@/components/admin/messages/messages-manager";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await connectDB();

  const rawMessages = await ContactMessage.find()
    .sort({ createdAt: -1 })
    .lean();

  const messages = JSON.parse(JSON.stringify(rawMessages)).map((m: any) => ({
    ...m,
    _id: m._id.toString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
          Inquiries &amp; Contact Desk
        </h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-1">
          Review dispatches, tip-offs, and reader messages submitted through the public contact desk.
        </p>
      </div>

      <MessagesManager initialMessages={messages} />
    </div>
  );
}
