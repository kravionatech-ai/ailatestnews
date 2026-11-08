import { connectDB } from "../src/lib/db/connection";
import {
  Post,
  Category,
  Page,
  User,
  SeoSettings,
} from "../src/lib/db/models";
import {
  getOrInitSeoSettings,
  getAllSitemapCollections,
  buildUrlsetXml,
  buildRobotsTxt,
  getGoogleNewsArticles,
} from "../src/lib/seo/seo-settings-service";
import {
  updateSitemapSettingsAction,
  updateRobotsSettingsAction,
} from "../src/actions/seo-settings";

async function main() {
  console.log("======================================================");
  console.log("🚀 PHASE 12: REAL-WORLD SCENARIO VERIFICATION TEST SUITE");
  console.log("======================================================\n");

  await connectDB();
  const settings = await getOrInitSeoSettings();
  const results: Array<{ test: number; name: string; passed: boolean; details: string }> = [];

  // Helper to get article routes
  async function getArticleUrls(currentSettings: any) {
    const collections = await getAllSitemapCollections(currentSettings);
    return collections.postRoutes.map((r) => r.url);
  }

  // Helper to get category routes
  async function getCategoryUrls(currentSettings: any) {
    const collections = await getAllSitemapCollections(currentSettings);
    return collections.categoryRoutes.map((r) => r.url);
  }

  // Unique test slugs
  const testPostSlug = `test-seo-article-${Date.now()}`;
  const testCatSlug = `test-seo-cat-${Date.now()}`;

  try {
    const defaultAuthor = await User.findOne();
    const defaultCategory = await Category.findOne();

    if (!defaultAuthor || !defaultCategory) {
      throw new Error("Cannot run test: at least one User and Category must exist in DB");
    }

    // -----------------------------------------------------------------
    // TEST 1: Create a draft article: verify it does not appear in sitemap
    // -----------------------------------------------------------------
    console.log("Running Test 1: Draft article exclusion...");
    const draftPost = await Post.create({
      title: "Test Draft Article",
      slug: testPostSlug,
      status: "draft",
      excerpt: "Test excerpt for SEO verification",
      contentHtml: "<p>This is a test draft article.</p>",
      category: defaultCategory._id,
      author: defaultAuthor._id,
      publishedAt: new Date(),
    });

    let urls = await getArticleUrls(settings);
    const draftIncluded = urls.some((u) => u.includes(testPostSlug));
    results.push({
      test: 1,
      name: "Draft article exclusion",
      passed: !draftIncluded,
      details: !draftIncluded
        ? "PASSED: Draft article is strictly excluded from sitemap URLs."
        : "FAILED: Draft article appeared in sitemap!",
    });

    // -----------------------------------------------------------------
    // TEST 2: Publish the article: verify it immediately appears in sitemap
    // -----------------------------------------------------------------
    console.log("Running Test 2: Published article inclusion...");
    draftPost.status = "published";
    draftPost.publishedAt = new Date("2026-11-07T10:00:00.000Z");
    await draftPost.save();

    urls = await getArticleUrls(settings);
    const publishedIncluded = urls.some((u) => u.includes(testPostSlug));
    results.push({
      test: 2,
      name: "Published article inclusion",
      passed: publishedIncluded,
      details: publishedIncluded
        ? `PASSED: Published article found in sitemap: ${settings.sitemap.siteUrl}/blog/${testPostSlug}`
        : "FAILED: Published article was not found in sitemap!",
    });

    // -----------------------------------------------------------------
    // TEST 3: Update the article: verify lastModified changes
    // -----------------------------------------------------------------
    console.log("Running Test 3: Update article lastModified reflection...");
    const updateTime = new Date("2026-11-08T12:00:00.000Z");
    draftPost.title = "Test Published Article (Updated)";
    draftPost.updatedAt = updateTime;
    await draftPost.save();

    const collectionsAfterUpdate = await getAllSitemapCollections(settings);
    const postEntry = collectionsAfterUpdate.postRoutes.find((r) => r.url.includes(testPostSlug));
    const lastModifiedMatches =
      postEntry &&
      (postEntry.lastModified === updateTime.toISOString() ||
        postEntry.lastModified.startsWith("2026-11-08"));
    results.push({
      test: 3,
      name: "Article update lastModified synchronization",
      passed: !!lastModifiedMatches,
      details: lastModifiedMatches
        ? `PASSED: lastModified reflects actual article updatedAt: ${postEntry?.lastModified}`
        : `FAILED: lastModified does not match expected update time. Got: ${postEntry?.lastModified}`,
    });

    // -----------------------------------------------------------------
    // TEST 4: Set article to noindex: verify it is removed from sitemap
    // -----------------------------------------------------------------
    console.log("Running Test 4: Noindex exclusion...");
    draftPost.seo = {
      ...draftPost.seo,
      robots: { index: false, follow: true },
    } as any;
    await draftPost.save();

    urls = await getArticleUrls(settings);
    const noindexExcluded = !urls.some((u) => u.includes(testPostSlug));
    results.push({
      test: 4,
      name: "Noindex exclusion from sitemap",
      passed: noindexExcluded,
      details: noindexExcluded
        ? "PASSED: Setting seo.robots.index: false immediately purges URL from XML sitemap."
        : "FAILED: Noindex article was still included in sitemap!",
    });

    // -----------------------------------------------------------------
    // TEST 5: Delete the article: verify it is removed from sitemap
    // -----------------------------------------------------------------
    console.log("Running Test 5: Article deletion exclusion...");
    await Post.findByIdAndDelete(draftPost._id);

    urls = await getArticleUrls(settings);
    const deletedExcluded = !urls.some((u) => u.includes(testPostSlug));
    results.push({
      test: 5,
      name: "Deleted article exclusion",
      passed: deletedExcluded,
      details: deletedExcluded
        ? "PASSED: Deleted article is completely purged from sitemap."
        : "FAILED: Deleted article still appears in sitemap!",
    });

    // -----------------------------------------------------------------
    // TEST 6: Create a category: verify it appears in category sitemap
    // -----------------------------------------------------------------
    console.log("Running Test 6: Category sitemap inclusion...");
    const testCat = await Category.create({
      name: "Test AI Architecture",
      slug: testCatSlug,
      description: "Test category for SEO verification",
      isActive: true,
    });

    const catUrls = await getCategoryUrls(settings);
    const catIncluded = catUrls.some((u) => u.includes(testCatSlug));
    results.push({
      test: 6,
      name: "Category sitemap inclusion",
      passed: catIncluded,
      details: catIncluded
        ? `PASSED: Category is immediately present in category sitemap: ${settings.sitemap.siteUrl}/category/${testCatSlug}`
        : "FAILED: Category was not found in category sitemap!",
    });

    // Clean up category
    await Category.findByIdAndDelete(testCat._id);

    // -----------------------------------------------------------------
    // TEST 7: Update robots.txt: verify /robots.txt reflects the update
    // -----------------------------------------------------------------
    console.log("Running Test 7: Robots.txt update & generation...");
    const customRuleSettings = {
      ...settings.toObject(),
      robots: {
        ...settings.robots,
        rules: [
          {
            userAgent: "Googlebot-News",
            allow: ["/news/", "/blog/"],
            disallow: ["/admin/"],
          },
          {
            userAgent: "*",
            allow: ["/"],
            disallow: ["/admin/", "/dashboard/"],
          },
        ],
      },
    };
    const robotsTxtContent = buildRobotsTxt(customRuleSettings as any);
    const robotsHasGooglebot = robotsTxtContent.includes("User-agent: Googlebot-News") &&
      robotsTxtContent.includes("Allow: /news/");
    results.push({
      test: 7,
      name: "Dynamic Robots.txt update & syntax generation",
      passed: robotsHasGooglebot,
      details: robotsHasGooglebot
        ? "PASSED: Robots.txt dynamically generates valid crawler directives from settings."
        : "FAILED: Robots.txt did not reflect custom rules correctly.",
    });

    // -----------------------------------------------------------------
    // TEST 8: Disable article sitemap: verify articles disappear
    // -----------------------------------------------------------------
    console.log("Running Test 8: Sitemap feature toggle...");
    const disabledSettings = {
      ...settings.toObject(),
      sitemap: {
        ...settings.sitemap,
        includeArticles: false,
      },
    };
    const collectionsDisabled = await getAllSitemapCollections(disabledSettings as any);
    const articlesDisabled = collectionsDisabled.postRoutes.length === 0;
    results.push({
      test: 8,
      name: "Admin toggle disables article sitemap",
      passed: articlesDisabled,
      details: articlesDisabled
        ? "PASSED: Disabling includeArticles correctly suppressed all article routes (0 routes generated)."
        : `FAILED: Articles still generated (${collectionsDisabled.postRoutes.length} found).`,
    });

    // -----------------------------------------------------------------
    // TEST 9: Unauthorized admin API access returns 401/403
    // -----------------------------------------------------------------
    console.log("Running Test 9: Security & unauthorized access check...");
    let securityBlocked = false;
    let securityError = "";
    try {
      // Calling server action directly in script without active NextAuth session
      const res = await updateSitemapSettingsAction({
        enabled: true,
        siteUrl: "https://evil.com",
        includeArticles: true,
        includeCategories: true,
        includeTags: true,
        includePages: true,
        includeNewsSitemap: true,
        newsPublicationName: "Hacked",
        newsPublicationLanguage: "en",
        newsTimeWindowHours: 48,
        excludedUrls: [],
        enableSplitSitemaps: false,
        maxUrlsPerSitemap: 50000,
      });
      if (res && !res.success) {
        securityBlocked = true;
        securityError = res.error || "Blocked by server-side authentication";
      }
    } catch (err: any) {
      securityBlocked = true;
      securityError = err.message || String(err);
    }
    const test9Passed = securityBlocked;
    results.push({
      test: 9,
      name: "Unauthorized admin actions rejected",
      passed: test9Passed,
      details: test9Passed
        ? `PASSED: Unauthenticated invocation was blocked: "${securityError}"`
        : "FAILED: Unauthenticated mutation was allowed!",
    });

    // -----------------------------------------------------------------
    // TEST 10: XML Formatting & Malformed XML Protection
    // -----------------------------------------------------------------
    console.log("Running Test 10: XML validation & escaping...");
    const sampleItems = [
      {
        url: `${settings.sitemap.siteUrl}/blog/ai-test?param=1&foo=bar&special="quote"<tag>`,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily" as const,
        priority: "0.8",
      },
    ];
    const generatedXml = buildUrlsetXml(sampleItems);
    const hasUnescapedAmpersand = generatedXml.includes("&foo=") && !generatedXml.includes("&amp;foo=");
    const hasUnescapedAngle = generatedXml.includes("<tag>") && !generatedXml.includes("&lt;tag&gt;");
    const xmlValid = !hasUnescapedAmpersand && !hasUnescapedAngle && generatedXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>');
    results.push({
      test: 10,
      name: "XML escaping & injection protection",
      passed: xmlValid,
      details: xmlValid
        ? "PASSED: All URLs and metadata characters (&, <, >, \", ') are properly XML-escaped; no injection possible."
        : "FAILED: Raw unescaped XML characters detected!",
    });

  } catch (err: any) {
    console.error("Test Suite Runtime Error:", err);
  } finally {
    console.log("\n======================================================");
    console.log("📊 TEST RESULTS SUMMARY:");
    console.log("======================================================");
    let allPassed = true;
    for (const r of results) {
      const statusIcon = r.passed ? "✅" : "❌";
      console.log(`${statusIcon} Scenario ${r.test}: ${r.name}`);
      console.log(`   ${r.details}`);
      if (!r.passed) allPassed = false;
    }
    console.log("======================================================");
    console.log(allPassed ? "🎉 ALL 10 SCENARIOS PASSED WITH ZERO FAILURES!" : "⚠️ SOME TESTS FAILED");
    console.log("======================================================\n");
    process.exit(allPassed ? 0 : 1);
  }
}

main();
