import { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";
import { CookiePreferencesButton } from "@/components/ui/cookie-preferences-button";
import { ShieldCheck, Cookie, Lock, Eye, Globe2, FileText, Mail } from "lucide-react";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  let page: any = null;
  try {
    await connectDB();
    page = await Page.findOne({ slug: "privacy" }).lean();
  } catch {
    // Graceful fallback
  }

  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/privacy",
    title: page?.seo?.metaTitle || "Privacy Policy & Cookie Disclosure | Kraviona AI News",
    excerpt:
      page?.seo?.metaDescription ||
      "Kraviona AI News commitment to reader privacy, cookie consent, GDPR compliance, and transparent editorial data practices.",
  });
}

export default async function PrivacyPage() {
  let pageRaw: any = null;
  let settings: any = {};

  try {
    await connectDB();
    const [p, s] = await Promise.all([
      Page.findOne({ slug: "privacy" }).lean(),
      getGlobalSettings(),
    ]);
    pageRaw = p;
    settings = s;
  } catch {
    settings = await getGlobalSettings();
  }

  const page: any = pageRaw ? JSON.parse(JSON.stringify(pageRaw)) : null;

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Page Header */}
        <div className="border-b-2 border-[var(--color-heading)] pb-6 mb-10">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent,#D94F35)]">
              Legal, Compliance &amp; Reader Trust
            </span>
            <span className="text-[var(--color-muted-text)]">&bull;</span>
            <span className="text-xs text-[var(--color-muted-text)]">Last Updated: November 22, 2026</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-heading)]">
            {page?.title || "Privacy Policy & Cookie Disclosure"}
          </h1>
          <p className="mt-3 text-base text-[var(--color-muted-text)] max-w-2xl">
            How Kraviona AI News protects your personal data, utilizes privacy-respecting cookies, and upholds transparent editorial practices.
          </p>
        </div>

        {/* Dynamic CMS Content or Comprehensive Default Template */}
        {page?.contentHtml ? (
          <div
            className="prose-article text-base leading-relaxed space-y-6 text-[var(--color-body-text)]"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        ) : (
          <div className="prose-article text-base leading-relaxed space-y-8 text-[var(--color-body-text)]">
            {/* Quick Summary Card */}
            <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)] shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <h2 className="font-display font-bold text-sm uppercase tracking-wider text-[var(--color-heading)]">
                  Executive Privacy Summary
                </h2>
              </div>
              <ul className="text-xs sm:text-sm space-y-1.5 text-[var(--color-body-text)] list-disc pl-5">
                <li>We do not sell, rent, or trade reader data to third-party brokers or advertisers.</li>
                <li>We only collect essential data (e.g. email for newsletter subscribers or contact inquiries).</li>
                <li>Cookies are used strictly for session security, theme persistence, and privacy-respecting analytics.</li>
                <li>You can inspect, export, or request deletion of your information anytime by emailing <a href="mailto:editorial@kraviona.com" className="text-[var(--accent,#D94F35)] underline">editorial@kraviona.com</a>.</li>
              </ul>
            </div>

            {/* Section 1 */}
            <section id="introduction" className="space-y-3">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--color-heading)] flex items-center gap-2.5">
                <Globe2 className="h-5 w-5 text-[var(--accent,#D94F35)]" />
                <span>1. Introduction &amp; Ownership</span>
              </h2>
              <p>
                This Privacy Policy applies to the digital publication <strong>Kraviona AI News</strong>, accessible at <Link href="https://ainews.kraviona.com" className="text-[var(--accent,#D94F35)] hover:underline">https://ainews.kraviona.com</Link> (&ldquo;the Site&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). We provide authoritative reporting, technical evaluations, research summaries, and benchmark analyses covering artificial intelligence, frontier language models, machine learning systems, and enterprise computing.
              </p>
              <p>
                We believe privacy is a fundamental right. Our data handling procedures adhere to global best practices including the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA/CPRA), and the Digital Personal Data Protection Act (DPDPA 2023, India).
              </p>
            </section>

            {/* Section 2 */}
            <section id="collection" className="space-y-3">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--color-heading)] flex items-center gap-2.5">
                <Eye className="h-5 w-5 text-[var(--accent,#D94F35)]" />
                <span>2. Information We Collect</span>
              </h2>
              <p>We only collect information necessary to deliver quality journalism, maintain platform security, and operate our digital publication:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)]">
                  <h3 className="font-semibold text-sm text-[var(--color-heading)] mb-1.5">A. Voluntarily Provided Information</h3>
                  <p className="text-xs leading-relaxed text-[var(--color-muted-text)]">
                    When you subscribe to our intelligence briefings, submit news tips, leave comments, or communicate with our editorial team, we may collect your email address, display name, and message content.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)]">
                  <h3 className="font-semibold text-sm text-[var(--color-heading)] mb-1.5">B. Automated Technical Telemetry</h3>
                  <p className="text-xs leading-relaxed text-[var(--color-muted-text)]">
                    Standard web server logs record anonymized IP addresses, browser types, operating systems, referring URLs, and timestamps to prevent DDoS abuse and diagnose server health.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Cookie Policy */}
            <section id="cookies" className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--color-heading)] flex items-center gap-2.5">
                  <Cookie className="h-5 w-5 text-[var(--accent,#D94F35)]" />
                  <span>3. Cookies &amp; Tracking Technologies</span>
                </h2>
                <CookiePreferencesButton />
              </div>

              <p>
                Cookies are small text files placed on your device to ensure core site functions, remember your settings, and provide anonymous performance telemetry. We classify our cookies into distinct tiers:
              </p>

              <div className="overflow-x-auto my-3">
                <table className="w-full text-left border-collapse border border-[var(--border)] text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[var(--color-secondary-surface)]">
                      <th className="p-3 border border-[var(--border)] font-semibold">Cookie Category</th>
                      <th className="p-3 border border-[var(--border)] font-semibold">Purpose</th>
                      <th className="p-3 border border-[var(--border)] font-semibold">Storage Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-[var(--border)] font-medium">Strictly Essential</td>
                      <td className="p-3 border border-[var(--border)]">
                        Required for secure login authentication (<code>authjs.session-token</code>), CSRF defense, and cookie consent state (<code>kraviona_cookie_consent</code>).
                      </td>
                      <td className="p-3 border border-[var(--border)]">Session to 365 days</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-[var(--border)] font-medium">Functional / Preferences</td>
                      <td className="p-3 border border-[var(--border)]">
                        Stores your reading UI preferences such as light or dark theme (<code>kraviona-theme</code>) and editorial design preview states.
                      </td>
                      <td className="p-3 border border-[var(--border)]">Persistent</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-[var(--border)] font-medium">Aggregated Analytics</td>
                      <td className="p-3 border border-[var(--border)]">
                        Measures readership volume, article engagement, and page load latency with IP anonymization. No individual ad profiling.
                      </td>
                      <td className="p-3 border border-[var(--border)]">Up to 24 months</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-[var(--border)] font-medium">Third-Party Advertising</td>
                      <td className="p-3 border border-[var(--border)]">
                        <strong>None.</strong> We do not deploy third-party advertising tracking pixels or cross-site commercial profiling cookies.
                      </td>
                      <td className="p-3 border border-[var(--border)]">N/A</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--color-secondary-surface)] text-xs leading-relaxed">
                <p className="font-semibold text-[var(--color-heading)] mb-1">How to Manage Cookies:</p>
                <p>
                  You can change your consent choices at any time using the <strong>Customize Cookie Preferences</strong> button above. Additionally, most modern browsers permit you to block, inspect, or delete cookies via your browser settings (Chrome, Firefox, Safari, Edge). Please note that disabling essential cookies may impact authentication and theme display.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="usage" className="space-y-3">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--color-heading)] flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-[var(--accent,#D94F35)]" />
                <span>4. How We Use Collected Data</span>
              </h2>
              <p>We process collected information solely for the following legitimate purposes:</p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li>To publish, host, and maintain our daily AI news articles, benchmarks, and editorial features.</li>
                <li>To send opted-in newsletter updates and breaking AI model announcements.</li>
                <li>To prevent fraud, brute-force login attempts, comment spam, and denial-of-service disruptions.</li>
                <li>To evaluate server performance, optimize Core Web Vitals, and improve user navigation.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="infrastructure" className="space-y-3">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--color-heading)] flex items-center gap-2.5">
                <Lock className="h-5 w-5 text-[var(--accent,#D94F35)]" />
                <span>5. Trusted Infrastructure &amp; Data Processors</span>
              </h2>
              <p>
                To provide high-availability edge delivery and bulletproof security, we partner with industry-leading infrastructure providers who maintain enterprise security certifications (SOC 2, ISO 27001):
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong>Hosting &amp; Edge Compute:</strong> Vercel Inc. (global edge CDN and serverless runtime).</li>
                <li><strong>Cloud Database:</strong> MongoDB Atlas (encrypted in transit via TLS 1.3 and at rest with AES-256).</li>
                <li><strong>Media CDN:</strong> Cloudinary (optimized, secure visual assets and responsive image transformations).</li>
                <li><strong>Email Communications:</strong> Resend (transactional dispatches and newsletter notifications).</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="rights" className="space-y-3">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--color-heading)] flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-[var(--accent,#D94F35)]" />
                <span>6. Your Rights Under GDPR, CCPA &amp; DPDPA</span>
              </h2>
              <p>
                Regardless of your geographic location, Kraviona AI News honors full data sovereignty for all readers:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong>Right of Access &amp; Portability:</strong> You may request a copy of any personal data we hold associated with your email.</li>
                <li><strong>Right to Rectification &amp; Erasure:</strong> You can request immediate correction or total deletion of your data (&ldquo;Right to be Forgotten&rdquo;).</li>
                <li><strong>Right to Withdraw Consent:</strong> You can unsubscribe from our newsletter at any time via the one-click unsubscribe link in any email footer.</li>
                <li><strong>Non-Discrimination:</strong> We never deny service or degrade editorial access when you exercise your privacy rights.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="contact" className="space-y-3 pt-4 border-t border-[var(--border)]">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--color-heading)] flex items-center gap-2.5">
                <Mail className="h-5 w-5 text-[var(--accent,#D94F35)]" />
                <span>7. Privacy Inquiries &amp; Grievance Officer</span>
              </h2>
              <p className="text-xs sm:text-sm">
                If you have questions, feedback, or data requests regarding this Privacy Policy or our cookie practices, please contact our Editorial Privacy Desk:
              </p>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--color-secondary-surface)] text-xs sm:text-sm space-y-1">
                <p><strong>Publication:</strong> Kraviona AI News</p>
                <p><strong>Primary Domain:</strong> <Link href="https://ainews.kraviona.com" className="text-[var(--accent,#D94F35)] hover:underline">https://ainews.kraviona.com</Link></p>
                <p><strong>Editorial Privacy Email:</strong> <a href="mailto:editorial@kraviona.com" className="text-[var(--accent,#D94F35)] hover:underline">editorial@kraviona.com</a></p>
                <p><strong>Technical Inquiries:</strong> <a href="mailto:kravionatech@gmail.com" className="text-[var(--accent,#D94F35)] hover:underline">kravionatech@gmail.com</a></p>
                <p className="text-xs text-[var(--color-muted-text)] mt-2">All privacy inquiries receive a response within 7 business days.</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
