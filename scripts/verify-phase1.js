async function verifyPhase1() {
  console.log("=== VERIFYING PHASE 1: SEO ENGINE & SEO PANEL ===");

  // 1. Test AI Generate API endpoint (Meta Title)
  const titleRes = await fetch("http://localhost:3000/api/admin/seo/ai-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "title",
      title: "Sarvam AI Unveils Sarvam-1: India's 2B Sovereign Model",
      focusKeyword: "Sarvam-1",
    }),
  });
  const titleData = await titleRes.json();
  console.log("1. AI Meta Title Generation:", titleData.success ? `✅ PASS (${titleData.result})` : "❌ FAIL");

  // 2. Test AI Generate API endpoint (Meta Description)
  const descRes = await fetch("http://localhost:3000/api/admin/seo/ai-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "description",
      title: "Sarvam AI Unveils Sarvam-1: India's 2B Sovereign Model",
      focusKeyword: "Sarvam-1",
      excerpt: "Sarvam AI releases a 2B parameter foundational model outperforming models twice its size on 10 Indian languages.",
    }),
  });
  const descData = await descRes.json();
  console.log("2. AI Meta Description Generation:", descData.success ? `✅ PASS (${descData.result.slice(0, 60)}...)` : "❌ FAIL");

  // 3. Test AI Generate API endpoint (Keywords)
  const kwRes = await fetch("http://localhost:3000/api/admin/seo/ai-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "keywords",
      title: "Sarvam AI Unveils Sarvam-1",
    }),
  });
  const kwData = await kwRes.json();
  console.log("3. AI Keyword Suggestion:", kwData.success ? `✅ PASS (Focus: ${kwData.result.focusKeyword})` : "❌ FAIL");

  // 4. Test IndexNow Endpoint
  const indexNowRes = await fetch("http://localhost:3000/api/admin/seo/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://ailatestnews.in/blog/test" }),
  });
  const indexNowData = await indexNowRes.json();
  console.log("4. IndexNow Endpoint:", indexNowData.message ? `✅ PASS (${indexNowData.message})` : "❌ FAIL");

  // 5. Check Admin Sidebar Branding
  const adminPage = await fetch("http://localhost:3000/admin");
  const adminHtml = await adminPage.text();
  const hasRebrand = adminHtml.includes("AI Latest") && adminHtml.includes("News") && !adminHtml.includes("TechAdmin");
  console.log("5. Rebrand TechAdmin -> AI Latest News Admin:", hasRebrand ? "✅ PASS" : "❌ FAIL");

  console.log("===================================================\n");
}

verifyPhase1().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
