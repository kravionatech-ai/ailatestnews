async function verify() {
  const res = await fetch("http://localhost:3000");
  console.log("Response Status:", res.status);
  const html = await res.text();
  console.log("HTML length:", html.length);

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1Text = h1Match ? h1Match[1].replace(/<[^>]*>/g, "").replace(/<!--.*?-->/g, "").replace(/\s+/g, " ").trim() : "";
  const h1MatchesExpected = h1Text === "Latest AI News, Tools and Launches, Explained for India";

  const checks = [
    ["H1 Primary Keyword: " + h1Text, h1MatchesExpected],
    ["Breaking AI Strip", html.includes("Breaking AI")],
    ["Featured Section", html.includes("Editor's Featured Coverage")],
    ["Model Launches Section", html.includes("New Model Launches")],
    ["AI Tools Section", html.includes("AI Tools for Developers")],
    ["India AI Section", html.includes("India AI Ecosystem")],
    ["Guides & Comparisons Section", html.includes("Guides &amp; Model Shootouts") || html.includes("Guides & Model Shootouts")],
    ["Hinglish/Hindi Section", html.includes("AI in Hinglish &amp; Hindi") || html.includes("AI in Hinglish & Hindi")],
    ["Trending Sidebar", html.includes("Trending Stories")],
    ["Latest AI Coverage", html.includes("Latest AI Coverage")],
    ["Site Editorial Intro (150-250w)", html.includes("About AI Latest News")],
    ["FAQ Block & FAQPage Schema", html.includes("FAQPage") && html.includes("Everything You Need to Know")],
    ["Newsletter Placeholder (your@email.com)", html.includes('placeholder="your@email.com"')],
    ["Admin Button in Header Removed", !html.includes('href="/admin"')],
  ];

  console.log("\n=== SECTION VERIFICATION RESULTS ===");
  let allPassed = true;
  for (const [name, passed] of checks) {
    console.log(`${passed ? "✅ PASS" : "❌ FAIL"}: ${name}`);
    if (!passed) allPassed = false;
  }
  console.log("=====================================\n");
  if (!allPassed) process.exit(1);
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
