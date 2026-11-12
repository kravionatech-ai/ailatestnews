import { ImageResponse } from "next/og";
import { getSiteHostname } from "@/lib/seo/domain";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "Kraviona AI News — AI, Technology & Research Intelligence";
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
            backgroundColor: "#F5F4EF",
            padding: "72px 80px",
            border: "14px solid #101820",
            borderTop: "20px solid #D94F35",
          }}
        >
          {/* Top Brand Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "10px",
                  backgroundColor: "#101820",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#F5F4EF",
                  fontSize: "28px",
                  fontWeight: 900,
                  borderBottom: "4px solid #D94F35",
                }}
              >
                K
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "26px", fontWeight: 900, color: "#101820", letterSpacing: "-0.02em" }}>
                  KRAVIONA AI NEWS
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#687482", letterSpacing: "0.14em" }}>
                  INTERNATIONAL INTELLIGENCE DESK
                </span>
              </div>
            </div>

            <div
              style={{
                borderRadius: "6px",
                backgroundColor: "#D94F35",
                padding: "8px 20px",
                fontSize: "16px",
                fontWeight: 700,
                color: "#FFFFFF",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
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
              color: "#101820",
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
              maxWidth: "1020px",
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
              borderTop: "2px solid #E4E2DC",
              paddingTop: "28px",
              color: "#687482",
              fontSize: "19px",
              fontWeight: 600,
            }}
          >
            <span>AI, Technology, Research &amp; Innovation Intelligence</span>
            <span style={{ color: "#D94F35", fontWeight: 800 }}>{getSiteHostname()}</span>
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
