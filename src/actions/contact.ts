"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { ContactMessage, AuditLog } from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";

export async function submitContactMessageAction(formData: FormData) {
  try {
    await connectDB();

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const subject = (formData.get("subject") as string)?.trim();
    const message = (formData.get("message") as string)?.trim();

    if (!name || !email || !subject || !message) {
      return { success: false, error: "Please complete all required fields." };
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const doc = await ContactMessage.create({
      name,
      email,
      subject,
      message,
      status: "unread",
    });

    return {
      success: true,
      messageId: doc._id.toString(),
      message: "Your message has been received by the editorial desk.",
    };
  } catch (err: any) {
    console.error("[submitContactMessageAction error]", err);
    return { success: false, error: err.message || "Failed to submit message." };
  }
}

export async function updateContactMessageStatusAction(id: string, status: "unread" | "read" | "replied" | "archived") {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();
  const doc = await ContactMessage.findByIdAndUpdate(id, { status }, { new: true });
  if (!doc) return { success: false, error: "Message not found" };

  await AuditLog.create({
    user: session.user.id,
    action: "update",
    resource: "ContactMessage",
    resourceId: doc._id,
    details: { status },
  });

  revalidatePath("/admin/messages");
  return { success: true, message: JSON.parse(JSON.stringify(doc)) };
}

export async function deleteContactMessageAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();
  const doc = await ContactMessage.findByIdAndDelete(id);
  if (!doc) return { success: false, error: "Message not found" };

  await AuditLog.create({
    user: session.user.id,
    action: "delete",
    resource: "ContactMessage",
    resourceId: doc._id,
    details: { subject: doc.subject },
  });

  revalidatePath("/admin/messages");
  return { success: true };
}
