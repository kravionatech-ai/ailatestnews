"use server";

import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import { slugify } from "@/lib/utils";

export async function registerUserAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !email || !password) {
    return { success: false, error: "Please fill in all fields." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." };
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const slug = slugify(name);

  // Check if first user, make admin, else subscriber
  const userCount = await User.countDocuments();
  const role = userCount === 0 ? "admin" : "subscriber";

  await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    slug: `${slug}-${Date.now().toString().slice(-4)}`,
    isActive: true,
  });

  return { success: true };
}
