import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ainews.kraviona.com";
const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "AI Latest News";
const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-RC5GPJKKW2";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Breaking AI News, Model Launches & India AI Guides`,
    template: `%s | ${siteName}`,
  },
  description:
    "India's premier AI news portal covering generative AI models, LLM launches, comparisons, Indian AI startups (Sarvam, Krutrim, BharatGPT), and hands-on developer guides in clear, comprehensive English.",
  keywords: [
    "AI News India",
    "AI Latest News",
    "LLM model launches",
    "DeepSeek AI",
    "Sarvam AI",
    "Krutrim AI",
    "BharatGPT",
    "Llama 3 India",
    "AI tool comparisons",
    "Generative AI India",
    "Indic AI models",
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
    locale: "en_IN",
    url: siteUrl,
    siteName,
    title: `${siteName} — Breaking AI News, Model Launches & India AI Guides`,
    description:
      "Daily breaking AI news, benchmark comparisons, open-weight model releases, and India's AI revolution covered in depth.",
    images: [
      {
        url: `${siteUrl}/api/og?title=AI%20Latest%20News%20%7C%20India's%20AI%20Portal`,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — Breaking AI News & Model Launches`,
    description:
      "Daily breaking AI news, benchmark comparisons, and India's AI ecosystem covered in depth.",
    creator: "@ailatestnews_in",
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
      "application/rss+xml": `${siteUrl}/feed.xml`,
    },
  },
  verification: {
    google: "yYmrp2HizDB-EGRruieHxpCxHFLCqmFsQblkGULJHtc",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light",
};

function JsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    description:
      "Leading Indian tech publication covering Artificial Intelligence, foundational models, open-weights, and compute policy.",
    sameAs: [
      "https://twitter.com/ailatestnews_in",
      "https://linkedin.com/company/ailatestnews",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lora.variable}`}
      suppressHydrationWarning
    >
      <head>
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
      <body className="min-h-screen bg-[var(--background)] font-sans antialiased text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
