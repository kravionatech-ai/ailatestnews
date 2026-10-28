import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "AI Latest News — Breaking AI Dispatches & Models";
    const category = searchParams.get("category") || "AI Intelligence";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
            padding: "80px 80px",
            border: "16px solid #F1F5F9",
          }}
        >
          {/* Top Brand Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "#4F46E5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontSize: "24px",
                  fontWeight: "bold",
                }}
              >
                AI
              </div>
              <span style={{ fontSize: "28px", fontWeight: "bold", color: "#0F172A" }}>
                AI Latest News
              </span>
            </div>

            <div
              style={{
                borderRadius: "9999px",
                backgroundColor: "#E0E7FF",
                padding: "8px 24px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#4F46E5",
              }}
            >
              {category}
            </div>
          </div>

          {/* Main Headline */}
          <div
            style={{
              fontSize: "52px",
              fontWeight: 800,
              color: "#0F172A",
              lineHeight: 1.25,
              letterSpacing: "-0.03em",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>

          {/* Bottom Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "2px solid #E2E8F0",
              paddingTop: "32px",
              color: "#64748B",
              fontSize: "20px",
              fontWeight: "500",
            }}
          >
            <span>AI News, Tools &amp; Guides, Explained for India</span>
            <span style={{ color: "#4F46E5" }}>ailatestnews.in</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    console.error("OG generation error", e);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
