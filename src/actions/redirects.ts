"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { Redirect, AuditLog } from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";

export async function createRedirectAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await connectDB();
    let from = (formData.get("from") as string)?.trim().toLowerCase() || "";
    let to = (formData.get("to") as string)?.trim() || "";
    const type = parseInt((formData.get("type") as string) || "301", 10) as 301 | 302;
    const note = (formData.get("note") as string)?.trim() || "";

    if (!from || !to) {
      return { success: false, error: "Source and destination paths are required" };
    }

    if (!from.startsWith("/")) from = `/${from}`;
    if (!to.startsWith("/") && !to.startsWith("http://") && !to.startsWith("https://")) {
      to = `/${to}`;
    }

    if (from === to) {
      return { success: false, error: "Source and destination paths cannot be identical (circular redirect)" };
    }

    const existing = await Redirect.findOne({ from });
    if (existing) {
      return { success: false, error: `Redirect for "${from}" already exists` };
    }

    const redirect = await Redirect.create({
      from,
      to,
      type,
      note,
      isActive: true,
      hits: 0,
      createdBy: session.user.id,
    });

    await AuditLog.create({
      user: session.user.id,
      action: "create",
      resource: "Redirect",
      resourceId: redirect._id,
      details: { from, to, type },
    });

    revalidatePath("/admin/seo/redirects");
    return { success: true, redirect: JSON.parse(JSON.stringify(redirect)) };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create redirect" };
  }
}

export async function toggleRedirectAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await connectDB();
    const redirect = await Redirect.findById(id);
    if (!redirect) return { success: false, error: "Redirect not found" };

    redirect.isActive = !redirect.isActive;
    await redirect.save();

    revalidatePath("/admin/seo/redirects");
    return { success: true, isActive: redirect.isActive };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle redirect" };
  }
}

export async function deleteRedirectAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await connectDB();
    await Redirect.findByIdAndDelete(id);

    await AuditLog.create({
      user: session.user.id,
      action: "delete",
      resource: "Redirect",
      resourceId: id,
      details: { deletedId: id },
    });

    revalidatePath("/admin/seo/redirects");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete redirect" };
  }
}
