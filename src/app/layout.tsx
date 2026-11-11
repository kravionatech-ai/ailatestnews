import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Lora, Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { getActiveDesignTokens } from "@/lib/design-tokens/service";
import { generateCssVariables } from "@/lib/design-tokens/css-generator";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens/defaults";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ainews.kraviona.com";
const siteName = "Kraviona AI News";
const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-RC5GPJKKW2";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — AI, Technology, Research and Innovation Intelligence`,
    template: `%s | ${siteName}`,
  },
  description:
    "Kraviona AI News is an international digital publication delivering authoritative intelligence on artificial intelligence, foundation models, research papers, AI tools, startups, cybersecurity, and emerging technology.",
  keywords: [
    "Kraviona AI News",
    "Artificial Intelligence News",
    "AI Models",
    "AI Research",
    "AI Agents",
    "Machine Learning",
    "DeepSeek",
    "Sarvam AI",
    "IndiaAI",
    "Cybersecurity",
    "Cloud Computing",
    "Enterprise AI",
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title: `${siteName} — AI, Technology, Research and Innovation Intelligence`,
    description:
      "Authoritative reporting on artificial intelligence models, frontier research, developer tools, startups, cybersecurity, and global computing.",
    images: [
      {
        url: `${siteUrl}/api/og?title=Kraviona%20AI%20News%20%7C%20AI%20%26%20Tech%20Intelligence`,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — AI, Technology, Research and Innovation Intelligence`,
    description:
      "Daily intelligence on frontier AI models, research papers, developer tooling, startups, and global technology.",
    creator: "@kraviona",
  },
  robots: {
    index: process.env.NODE_ENV === "production",
    follow: process.env.NODE_ENV === "production",
    googleBot: {
      index: process.env.NODE_ENV === "production",
      follow: process.env.NODE_ENV === "production",
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": [
        {
          url: `${siteUrl}/feed.xml`,
          title: `${siteName} — RSS Feed`,
        },
      ],
    },
  },
  verification: {
    google: "yYmrp2HizDB-EGRruieHxpCxHFLCqmFsQblkGULJHtc",
  },
};

export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#101820" },
      { media: "(prefers-color-scheme: dark)", color: "#0D1117" },
    ],
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    colorScheme: "light dark",
  };
}

function JsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "@id": `${siteUrl}/#organization`,
    name: siteName,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    description:
      "International AI and technology publication covering artificial intelligence, foundation models, research papers, startups, cybersecurity, and compute infrastructure.",
    email: "kravionatech@gmail.com",
    publishingPrinciples: `${siteUrl}/editorial-policy`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "editorial",
      email: "kravionatech@gmail.com",
      url: `${siteUrl}/contact`,
    },
    sameAs: [
      "https://twitter.com/kraviona",
      "https://linkedin.com/company/kraviona",
      "https://github.com/kravionatech-ai",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: siteName,
    url: siteUrl,
    inLanguage: "en",
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  );
}

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var mode = localStorage.getItem('kraviona-theme');
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tokens = await getActiveDesignTokens();
  const isLegacyUnmodifiedDefault =
    tokens.colors.primaryAccent === DEFAULT_DESIGN_TOKENS.colors.primaryAccent &&
    tokens.colors.mainBackground === DEFAULT_DESIGN_TOKENS.colors.mainBackground;

  const dynamicCss = !isLegacyUnmodifiedDefault
    ? generateCssVariables(tokens)
    : "";

  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${playfair.variable} ${lora.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {dynamicCss && (
          <style
            id="dynamic-design-tokens"
            dangerouslySetInnerHTML={{ __html: dynamicCss }}
          />
        )}
        <JsonLd />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.webmanifest" />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-screen bg-[var(--background)] font-sans antialiased text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-white">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
