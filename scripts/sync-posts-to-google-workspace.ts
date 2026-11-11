/**
 * Standalone Google Drive / Google Docs / Google Sheets Post Sync Script
 * =====================================================================
 * Syncs published posts from MongoDB Atlas (including manually published site posts)
 * into:
 *   - Google Drive folder: AI News / YYYY-MM-DD / <post-slug>/
 *   - Google Doc inside post subfolder containing complete Content & SEO details
 *   - Cover image, standalone HTML backup, and full JSON record inside post subfolder
 *   - Master Google Spreadsheet ("AI News - Master Posts Record") inside AI News
 *
 * Usage:
 *   npm run workspace:sync
 *   npx tsx --env-file=.env.local scripts/sync-posts-to-google-workspace.ts --since-days 1
 *   npx tsx --env-file=.env.local scripts/sync-posts-to-google-workspace.ts --post-id <mongoId>
 */

import mongoose from "mongoose";
import {
  initWorkspaceContext,
  reconcileUnsyncedPostsToGoogleWorkspace,
  syncSinglePostToGoogleWorkspace,
} from "./lib/google-workspace-sync";

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return undefined;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set in environment or .env.local");
  }

  const postId = getArgValue("--post-id");
  const sinceDaysRaw = getArgValue("--since-days");
  const limitRaw = getArgValue("--limit");
  const sinceDays = sinceDaysRaw ? Number(sinceDaysRaw) : undefined;
  const limit = limitRaw ? Number(limitRaw) : undefined;

  console.log("\n========================================================");
  console.log("📂 AI News -> Google Drive / Docs / Sheets Sync Started");
  console.log(`⏰ Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`);
  console.log("========================================================\n");

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000, socketTimeoutMS: 45_000 });
  try {
    const ctx = await initWorkspaceContext();
    console.log(`📁 Drive Root ("AI News"): ${ctx.rootFolderUrl}`);
    console.log(`📊 Master Sheet: ${ctx.spreadsheetUrl}`);
    console.log(`📋 Existing tracked rows in Sheet: ${ctx.nextPostNumber - 1}\n`);

    if (postId) {
      const db = mongoose.connection.db!;
      const raw = await db.collection("posts").findOne({ _id: new mongoose.Types.ObjectId(postId) });
      if (!raw) throw new Error(`Post not found: ${postId}`);

      const [author, category, tags] = await Promise.all([
        raw.author ? db.collection("users").findOne({ _id: raw.author }) : null,
        raw.category ? db.collection("categories").findOne({ _id: raw.category }) : null,
        Array.isArray(raw.tags) && raw.tags.length
          ? db.collection("tags").find({ _id: { $in: raw.tags } }).toArray()
          : [],
      ]);

      const res = await syncSinglePostToGoogleWorkspace(
        {
          id: raw._id.toString(),
          title: raw.title,
          slug: raw.slug,
          status: raw.status,
          excerpt: raw.excerpt || "",
          contentHtml: raw.contentHtml || raw.content?.html || "",
          coverImage: raw.coverImage,
          coverImageAlt: raw.coverImageAlt,
          coverImageCaption: raw.coverImageCaption,
          focalPoint: raw.focalPoint,
          authorName: author?.name || "Site Administrator",
          categoryName: category?.name || "AI News",
          tags: tags.map((t) => t.name).filter(Boolean),
          faqs: raw.faqs,
          readingTime: raw.readingTime,
          featured: raw.featured,
          allowComments: raw.allowComments,
          locale: raw.locale || "en",
          publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : new Date(raw.createdAt),
          createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
          updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : undefined,
          seo: raw.seo,
          uploadMode: "Site / Manual Sync",
        },
        ctx
      );

      console.log("\n✅ Single Post Sync Completed:");
      console.log(JSON.stringify(res, null, 2));
      return;
    }

    const summary = await reconcileUnsyncedPostsToGoogleWorkspace({
      sinceDays,
      limit,
      ctx,
    });

    console.log("\n========================================================");
    console.log(`✅ Workspace Sync Complete!`);
    console.log(`   Newly synced posts : ${summary.synced.length}`);
    console.log(`   Already in sheet   : ${summary.alreadySyncedCount}`);
    console.log(`   Failed             : ${summary.failed.length}`);
    console.log(`   Drive Root Folder  : ${ctx.rootFolderUrl}`);
    console.log(`   Master Spreadsheet : ${ctx.spreadsheetUrl}`);
    console.log("========================================================\n");

    if (summary.failed.length > 0) {
      console.error("Failed items:", JSON.stringify(summary.failed, null, 2));
      process.exitCode = 1;
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("\n❌ Google Workspace Sync Failed:", err);
  process.exit(1);
});
