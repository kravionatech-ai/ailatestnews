"use server";

import { connectDB } from "@/lib/db/connection";
import { Subscriber } from "@/lib/db/models";
import { generateToken } from "@/lib/utils";

export async function subscribeNewsletterAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const name = (formData.get("name") as string)?.trim() || "";
  const source = (formData.get("source") as string) || "website";

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  await connectDB();

  const existing = await Subscriber.findOne({ email });
  if (existing) {
    if (existing.status === "active") {
      return { success: true, message: "You are already subscribed to our newsletter!" };
    }
    existing.status = "active";
    existing.subscribedAt = new Date();
    await existing.save();
    return { success: true, message: "Welcome back! Your subscription is renewed." };
  }

  await Subscriber.create({
    email,
    name,
    source,
    status: "active",
    unsubscribeToken: generateToken(32),
    subscribedAt: new Date(),
  });

  return {
    success: true,
    message: "Thank you for subscribing to AI Latest News updates!",
  };
}
