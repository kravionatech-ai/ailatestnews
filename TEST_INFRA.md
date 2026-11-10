# TEST_INFRA.md — Automated E2E Testing Infrastructure & Specification

## 1. Executive Summary & Purpose

This document defines the architecture, methodology, feature coverage mapping, and execution semantics for the parallel End-to-End (E2E) Testing Track of the AI Latest News publication platform redesign (ainews.kraviona.com).

The automated test suite is built on a **requirement-driven, opaque-box methodology**. It validates public interface contracts, schema integrity, publishing workflows, role-based access control (RBAC), responsive layout mechanics across 6 target viewports, and 100% SEO/canonical preservation without coupling to internal private implementation details.

---

## 2. Test Philosophy

### 2.1 Opaque-Box Principle
Tests interact strictly through public interfaces, published contracts, HTTP headers, schema validators, and observable outputs (CSS variables, JSON-LD metadata, HTTP status codes, and rendered layout properties). Tests do not rely on mock private variables or brittle implementation-specific state.

### 2.2 Requirement-Driven Derivation
Every assertion derives directly from:
- `ORIGINAL_REQUEST.md` (Requirements R1 through R5 and Acceptance Criteria).
- `PROJECT.md` (Interface Contracts §1-3, Code Layout, and Feature Inventory).
- Reference schemas and established web standards (W3C CSS Color 4, RFC 7231, Schema.org NewsArticle, robots.txt specs).

### 2.3 Four-Tier Testing Methodology

```
+--------------------------------------------------------------------------+
|  Tier 4: Real-World Scenarios (Multi-device viewports: 1440, 1280, 1024,  |
|          768, 390, 360px; End-to-end admin publish -> reader journey)    |
+--------------------------------------------------------------------------+
|  Tier 3: Cross-Feature Combinations (Pairwise matrix: Tokens + Themes,    |
|          Publish State + Section Ordering, RBAC + Server Action routes)   |
+--------------------------------------------------------------------------+
|  Tier 2: Boundary & Corner Cases (Extreme sizes, malicious CSS/JS         |
|          injections, role privilege escalation, malformed tokens)        |
+--------------------------------------------------------------------------+
|  Tier 1: Feature Coverage (Core happy paths, schema default values,       |
|          canonical URL formats, sitemaps, CRUD state transitions)         |
+--------------------------------------------------------------------------+
```

- **Tier 1 — Feature Coverage**: Comprehensive coverage of happy paths and baseline expectations for all features (>=5 test cases per feature area).
- **Tier 2 — Boundary & Corner Cases**: Rigorous edge condition testing (>=5 test cases per feature area): invalid hex/rgb strings, CSS injection attempts (`<script>`, `expression()`, `url()`), null/undefined payloads, malformed JSON-LD, invalid role grants, and zero/negative section counts.
- **Tier 3 — Cross-Feature Combinations**: Pairwise combination matrix testing feature interactions:
  - Theme Preset application combined with individual color token overrides.
  - Section reordering combined with Breaking News dynamic strip enablement.
  - Draft preview mode combined with role-based permission checks.
  - Version rollback combined with active preview tokens.
- **Tier 4 — Real-World Application Scenarios**: End-to-end workflows executed across all 6 specified viewport widths (1440px, 1280px, 1024px, 768px, 390px, 360px), verifying responsive layout metrics, container max-widths, touch targets, and visual hierarchy.

---

## 3. 58-Feature Inventory & Tier Mapping

| # | Feature Name | Milestone | Tier 1 (Happy Path) | Tier 2 (Boundary/Corner) | Tier 3 (Cross-Feature) | Tier 4 (Real-World / Viewport) |
|---|--------------|-----------|---------------------|--------------------------|------------------------|--------------------------------|
| 1 | Production Database & Data Preservation | M1 | Schema verification for all 16 collections | Missing fields, legacy documents | Relation integrity with Post & Author | Data rendering on client |
| 2 | Developer Tooling & Baseline Fixes | M1 | Vitest execution, strict scripts | Empty test suites, syntax errors | Vitest vs Next.js alias resolution | CI/CD script execution |
| 3 | Versioned DesignConfig Schema | M1 | Document instantiation, default fields | Missing snapshot fields, negative version | History array preservation on save | Persistent config retrieval |
| 4 | Centralized Design Token Architecture | M1 | Default 15 colors, typography, layout | Invalid hex, malformed rgb, injection | Color override + Typography scale | Root CSS variable cascade |
| 5 | Dynamic CSS Token Injector | M1 | `:root` custom property output generation | Special characters, CSS escape sequences | Theme preset CSS injection | Live preview iframe DOM injection |
| 6 | Preview Iframe & RBAC Security | M1 | SAMEORIGIN header, super_admin auth | Framing from foreign origin, unauth /api/admin | Preview token validation + Editor role | Preview container rendering |
| 7 | Draft / Publish & Rollback Server Actions | M1 | Save draft, publish, rollback version | Out-of-bounds version rollback, empty draft | Rollback affecting preview tokens | Admin save -> public page reload |
| 8 | News Card: Classic Editorial | M2 | Render title, byline, serif styling | Long title truncation, missing thumbnail | Token fontSerif override | 1440px vs 360px card layout |
| 9 | News Card: Modern Magazine | M2 | Aspect ratio, badge overlay rendering | Missing badge, high aspect ratio image | Primary accent badge styling | Grid column wrap at 768px |
| 10 | News Card: Horizontal Card | M2 | Split thumbnail and meta details | Missing thumbnail fallback, long excerpt | Card background token application | Horizontal to vertical stack on 390px |
| 11 | News Card: Compact News | M2 | Single-row compact list item | Title overflow, null author | Border token application | Mobile compact list rendering |
| 12 | News Card: Large Featured Card | M2 | Prominent headline, lead story layout | Missing hero image, massive headline | Breaking news badge integration | Full-width hero on all 6 viewports |
| 13 | News Card: Image Overlay Card | M2 | Scrim gradient, white typography | Low contrast image, transparent image | Dark theme contrast compliance | Text readability on 360px |
| 14 | News Card: Minimal List Card | M2 | Ranked 01-05 numbering, title link | Numbering >99, missing rank | Heading color token override | Sidebar widget layout at 1024px |
| 15 | News Card Factory & Token Integration | M2 | Variant dispatch for all 7 card types | Unknown variant fallback | Token cardBorderRadius propagation | Uniform spacing across card types |
| 16 | Article Layout: Standard Editorial | M2 | 8+4 column layout, sticky TOC | Missing TOC headings, long sidebar | Sticky progress bar + TOC click | Responsive 8+4 collapsing at 1024px |
| 17 | Article Layout: Premium Magazine | M2 | Immersive full-width hero, rich typography | Panoramic hero image ratio edge cases | Accent hover on drop cap | Reading controls interaction |
| 18 | Article Layout: Minimal Reading | M2 | Centered single column, no sidebar | Extreme width viewport centering | Font scale toggle + line height | Mobile reading focus at 390px |
| 19 | Article Layout: Wide Article | M2 | Expanded readable width, utility dock | Utility dock overlap with body | Dock positioning + card radius | Floating dock auto-hide on mobile |
| 20 | Article Layout: Without Sidebar | M2 | Full-width container without sidebar | High-resolution monitor centering | Container padding token override | Tablet portrait margin adjustments |
| 21 | Article Layout Dispatcher | M2 | Template dispatch for all 5 layouts | Invalid template name fallback | Per-article override vs global token | Seamless template switching |
| 22 | Dynamic Homepage Section Dispatcher | M3 | Render enabled sections in order | Empty section list, duplicate section IDs | Section enable/disable + Theme presets | Full page assembly across viewports |
| 23 | Homepage Section: Breaking News Strip | M3 | Ticker animation, prev/next controls | Empty breaking news array, long headline | Breaking news color token (#EF4444) | Ticker responsive overflow hidden |
| 24 | Homepage Section: Hero Magazine Showcase | M3 | Lead post + secondary stories | 1 post available (no secondary stories) | Card variant override in Hero | 1440px grid vs 390px stack |
| 25 | Homepage Section: Model Launches Desk | M3 | Frontier LLM cards, specs display | Missing benchmark score, empty specs | Model launch category filter | Horizontal scroll on mobile |
| 26 | Homepage Section: India AI Mission Desk | M3 | Sovereign compute & Indic model hub | Missing tags, long initiative title | Secondary accent badge styling | Multi-card grid across 6 viewports |
| 27 | Homepage Section: AI Tools Directory Desk | M3 | Evaluated tools, developer gear cards | Empty tools list, missing pricing tag | Button border radius token | Grid layout on tablet/desktop |
| 28 | Homepage Section: Deep-Dive Guides | M3 | Guide cards, reading time display | Missing reading time calculation | Card background token styling | 2-column guide layout at 1024px |
| 29 | Homepage Section: Enterprise AI Desk | M3 | Production case study cards | Long corporate title, no logo | Secondary surface token styling | Responsive card bounds |
| 30 | Homepage Section: Trending & Most Read | M3 | 01-05 ranked leaderboard display | Tie in view counts, zero view count | Trending color token (#F59E0B) | Sidebar vs full-width placement |
| 31 | Homepage Section: AI Benchmark Leaderboard | M3 | Benchmark scores table (AIME, SWE-bench) | Missing metrics, negative scores | Leaderboard styling + table overflow | Responsive table scroll at 360px |
| 32 | Homepage Section: API Cost Calculator | M3 | Token economics calculation in INR & USD | Zero tokens, negative tokens, large tokens | Calculator UI tokens + Dark mode | Form input responsiveness on mobile |
| 33 | Homepage Section: Newsletter Dispatch Box | M3 | Email capture form, subscription feedback | Invalid email format, duplicate subscriber | Success color token (#16A34A) | Single-input wrap at 360px |
| 34 | Homepage Section: Editorial Charter & Intro | M3 | Charter text, ethics principles | Missing charter copy, rich text | Heading & Body text tokens | Container max-width compliance |
| 35 | Homepage Section: Interactive Readers FAQ | M3 | Accordion expand/collapse behavior | All closed, all open, long FAQ answers | FAQPage Schema.org injection | Touch interaction on mobile |
| 36 | Homepage Section: Community Reader Poll | M3 | Poll options, vote percentage tally | 0 votes total, 100% single option | Bar color tokens + Vote feedback | Touch target bounds on mobile |
| 37 | Homepage Section: Model Releases Timeline | M3 | Chronological milestone rendering | Single milestone, unordered dates | Accent hover on timeline node | Vertical line alignment across viewports |
| 38 | Admin Design Studio Shell & Routing | M4 | Workspace tabs, live preview iframe | Direct URL tab navigation, invalid tab | Tab switch with unsaved draft alert | Split screen desktop vs mobile |
| 39 | Color Manager | M4 | Hex/RGB inputs, real-time palette | Invalid color inputs, CSS injection | Palette update + live preview iframe | Mobile color picker bounds |
| 40 | Typography Manager | M4 | Font family selector, scale modifiers | Unsupported font name, negative scale | Font change + Article preview | Responsive font size rendering |
| 41 | Layout & Container Manager | M4 | Max width, padding, gutter controls | Extreme max widths (e.g. 5000px, 0px) | Layout tokens + Section margins | Viewport constraint enforcement |
| 42 | Header & Navigation Designer | M4 | Link add, edit, delete, reorder | Deeply nested links (>3 levels), empty nav | Header layout switch (classic vs minimal) | Mobile drawer toggle at 768px/390px |
| 43 | Footer Designer | M4 | Column configuration, social links | 0 columns, invalid social URL | Footer tokens + Dark background | Multi-column wrap to 1-col on mobile |
| 44 | Homepage Drag-and-Drop Builder | M4 | Section reorder, toggle, duplicate | Duplicate section IDs, 0 enabled sections | Reorder + dynamic homepage render | Drag handles touch compliance |
| 45 | News Card Designer UI | M4 | Variant selector, badge toggles | Rapid toggling, conflicting card options | Card settings + Section preview | Card rendering preview |
| 46 | Article Page Designer UI | M4 | Template switcher, widget toggles | All widgets disabled, missing author bio | Layout template + Live article preview | Preview across 6 breakpoints |
| 47 | Sidebar, Button, Form & Responsive Designers | M4 | Widget reordering, button styles | Button radius "9999px", empty widgets | Form token styling + Newsletter form | Breakpoint switcher container |
| 48 | 5 Predefined Theme Presets | M4 | Apply preset (Editorial, Modern, Dark, etc.) | Apply preset without overwriting content | Theme preset + Custom token tweak | Full theme preview across viewports |
| 49 | Multi-Device Live Preview Container | M4 | Breakpoint bar: 1440, 1280, 1024, 768, 390, 360 | Viewport boundary transition | Preview iframe resize + CSS variables | Exact pixel dimension verification |
| 50 | Publishing Workflow & Version Rollback UI | M4 | Save draft, publish, rollback buttons | Discard draft with unsaved changes | Rollback + history snapshot list | Rollback reflected on public view |
| 51 | Admin Dashboard Visual Redesign | M5 | Dark Navy sidebar, Emerald action buttons | Collapsed sidebar, telemetry cards | Admin theme tokens + stat counters | Sidebar auto-collapse on tablet |
| 52 | CMS Post Editor Enhancements | M5 | `isBreaking` and `isTrending` flags | Simultaneous breaking + trending flags | Post flags + Homepage strip render | Post edit form on mobile |
| 53 | SEO Control Center Harmonization & Security | M5 | Emerald/Navy UI styling, secured AI route | Unauthenticated AI generation request | AI SEO generator + Metadata preview | Form layout responsiveness |
| 54 | SEO Slugs & Metadata Preservation Verification | M5 | Canonical URLs, Open Graph, Schemas | Unicode slugs, missing fallback image | Fallback metadata cascade | Google News & XML sitemap validity |
| 55 | Audit Logging for Design & CMS | M5 | Audit log creation on publish/rollback | Rapid consecutive actions | User role attribution in audit log | Audit log viewer pagination |
| 56 | E2E Test Suite Execution (Tiers 1-4) | M6 | 100% test pass on Vitest runner | Network timeouts, simulated concurrency | Multi-tier test run pipeline | Complete test report generation |
| 57 | Adversarial Hardening (Tier 5) | M6 | Penetration & injection test suite | Malicious CSS payloads, clickjack iframe | RBAC privilege bypass attempts | Broken viewport resilience |
| 58 | Git Repository Delivery | M6 | Clean git commit & remote push | Untracked artifacts, dirty git tree | Pre-commit test verification | Branch sync & verification |

---

## 4. Test Architecture & Directory Layout

### 4.1 Test Runner & Environment
- **Runner**: Vitest v5.0.5 running on Node.js.
- **Root Command**: `npx vitest run tests/e2e` or `npm test -- tests/e2e`.
- **Environment**: Node environment with synthetic DOM/Contract fixtures for fast, isolated, deterministic execution.

### 4.2 Test Directory Structure
```
tests/
└── e2e/
    ├── token-schema.test.ts          # Tier 1 & 2: Token schema Zod validation, hex/rgb, CSS/JS injection defense
    ├── publishing-workflow.test.ts   # Tier 1, 2 & 3: Draft vs published isolation, preview tokens, promotion, rollback
    ├── security-rbac.test.ts         # Tier 1, 2 & 3: Role-based permissions, SAMEORIGIN headers, /api/admin guard
    ├── responsive-viewports.test.ts  # Tier 2 & 4: Breakpoints (1440, 1280, 1024, 768, 390, 360px), layout tokens
    └── seo-preservation.test.ts      # Tier 1 & 2: Canonical URLs, sitemaps, robots.txt, Schema.org NewsArticle
```

### 4.3 Pass/Fail Semantics & Exit Codes
- **Pass (Exit Code 0)**: 100% of test suites execute successfully with 0 assertion failures and 0 unhandled promise rejections.
- **Fail (Exit Code != 0)**: Any assertion failure, schema violation, injection bypass, or contract mismatch halts execution and outputs clear diagnostic traces.

---

## 5. Coverage Thresholds & Quality Gates

| Test Tier | Metric Requirement | Enforcement Mechanism |
|-----------|--------------------|------------------------|
| **Tier 1: Feature Coverage** | >= 5 test cases per feature area | Automated assertion counts in `tests/e2e/` |
| **Tier 2: Boundary & Corner Cases** | >= 5 boundary test cases per feature area | Malformed, extreme, and malicious payload test suites |
| **Tier 3: Cross-Feature Interactions** | All primary feature pairs covered | Pairwise combination tests (Tokens + Themes + Publishing + RBAC) |
| **Tier 4: Multi-Viewport Scenarios** | 6 viewports (1440, 1280, 1024, 768, 390, 360px) | Layout token math and responsive constraint verification |

---

## 6. Adversarial Verification Requirements

1. **CSS & Script Injection Protection**: Token values MUST reject strings containing `<script>`, `</style>`, `javascript:`, `expression(`, `url(`, and unescaped semicolons or curly braces designed to break out of CSS declarations.
2. **Color Format Strictness**: Only valid 3-digit hex, 6-digit hex, 8-digit hex, standard `rgb()`, `rgba()`, `hsl()`, or `hsla()` strings are accepted. Arbitrary CSS statements are strictly rejected.
3. **Draft / Published Isolation**: Any modification made to draft configuration MUST NOT alter the published state until an explicit publish action is executed.
4. **RBAC Privilege Boundaries**: Non-admin roles (Author, Subscriber, Unauthenticated) attempting administrative publishing or rollback MUST receive strict authorization rejections (401/403).
5. **Frame Options Defense**: Responses must enforce `X-Frame-Options: SAMEORIGIN` (or equivalent CSP `frame-ancestors 'self'`) to protect against clickjacking while permitting Design Studio preview framing.
6. **SEO & URL Invariance**: Zero legacy production URL slugs may be renamed or broken. Schema.org NewsArticle structured data must validate against Google Search Central guidelines.
