/**
 * Production seed script — creates ONLY the initial admin user.
 * Run: npm run seed:prod
 *
 * Requires MONGODB_URI env variable pointing to production database.
 * Will NOT overwrite existing data.
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

async function seedProd() {
  console.log("🌱 Production seed — creating admin user only...");

  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ Connected to MongoDB\n");

    const { default: User } = await import("../src/lib/db/models/user.model");
    const bcrypt = await import("bcryptjs");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("ℹ️  Admin user already exists. Skipping.");
      return;
    }

    const email = process.env.ADMIN_EMAIL ?? "kravionatech@gmail.com";
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      console.error(
        "❌ ADMIN_PASSWORD environment variable is required for production seed"
      );
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({
      name: "Admin",
      email,
      password: hashedPassword,
      role: "admin",
      slug: "admin",
      isActive: true,
      emailVerified: new Date(),
    });

    console.log(`✅ Admin user created: ${email}`);
  } catch (error) {
    console.error("❌ Production seed failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📦 Disconnected from MongoDB");
  }
}

seedProd();
