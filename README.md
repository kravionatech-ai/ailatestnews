# TechBlog — Production-Grade, SEO-First Animated Tech Blog Platform

A production-grade, engineering-first digital publication platform built exclusively with **Next.js 16 App Router**, **React 19 Server Components**, **TypeScript (Strict)**, and **MongoDB Atlas** via Mongoose.

---

## 🌟 Highlights & Architecture

- **Next.js 16 App Router**: 100% serverless, zero standalone backend server. Powered by Route Handlers and Server Actions.
- **Editorial Light Design System**: High-contrast, WCAG AA compliant light theme (`#FFFFFF`, `#F8FAFC`, `#0F172A`) with indigo accent (`#4F46E5`). No dark mode toggle by design.
- **Micro-Animations & Smooth Scroll**: Lenis smooth momentum scrolling, soft gradient aura hero, card lift transitions, and celebrate-applaud particle bursts (`canvas-confetti`).
- **Comprehensive Database Models**: 11 Mongoose collections with singleton caching (`global.mongooseConnection`) safe for serverless cold starts.
  - `User` (RBAC: Admin, Editor, Author, Subscriber)
  - `Post` (with JSON content, sanitized HTML, SEO fields, reading time, and full text search indexes)
  - `Category` (nested taxonomy with live post counters)
  - `Tag` (slugified tags)
  - `Comment` (threaded multi-level replies, likes, and moderation)
  - `Media` (Cloudinary metadata, blurhash)
  - `Series` (multi-part article collections)
  - `Subscriber` (newsletter with double opt-in & one-click unsubscribe)
  - `Revision` (immutable historical versions & rollback)
  - `AuditLog` (capped collection for security audit trails)
  - `ViewStat` (day-level reading depth & visitor telemetry)
- **Advanced SEO Engine**:
  - Auto-generated `sitemap.xml` with dynamic routes for articles, categories, and tags.
  - Environment-aware `robots.txt` (`disallow: /` in development; indexed in production).
  - Complete JSON-LD structured data: `BlogPosting`, `BreadcrumbList`, `Organization`, `WebSite`, `Person`.
  - Edge/Node dynamic OpenGraph card generation (`/api/og`).
  - RSS 2.0 Feed at `/feed.xml`.
  - PWA manifest (`/manifest.webmanifest`) and WebApp icon.
- **Admin Panel (`/admin`)**:
  - Protected with session verification.
  - Real-time Dashboard with telemetry metrics and view statistics.
  - Article composer with **Live SEO Score Meter** (title length, keyword density, meta description check).
  - Google SERP Simulator (Desktop & Mobile toggle).
  - Taxonomy Manager (Categories & Tags).
  - Discussion Moderation (Approve, Spam, Trash).
  - Subscribers Manager with CSV Export.
  - Settings (SEO defaults, GA ID, ads.txt, custom injection).

---

## 🚀 Environments

### 1. Local Development Setup
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Start local MongoDB container (optional, or use Atlas Free M0):
   ```bash
   docker compose up -d
   ```
3. Initialize the development database with seed data:
   ```bash
   npm run seed:local
   ```
   > **Default Admin Account:**
   > - **Email**: `admin@techblog.com`
   > - **Password**: `Admin123!`

4. Start development server with Turbopack:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` for public site, or `http://localhost:3000/admin` for the admin portal.

---

### 2. Production Deployment (Vercel + MongoDB Atlas)
Set the following environment variables in your Vercel Project Settings:

| Environment Variable | Description |
|----------------------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `AUTH_SECRET` | 32+ character random secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Production URL (e.g. `https://your-domain.vercel.app`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL (e.g. `https://your-domain.vercel.app`) |
| `NEXT_PUBLIC_SITE_NAME` | Site title (e.g. `TechBlog`) |
| `NEXT_PUBLIC_GA_ID` | Optional Google Analytics 4 ID |
| `CLOUDINARY_CLOUD_NAME` | Optional Cloudinary cloud name |
| `RESEND_API_KEY` | Optional Resend API key for transactional emails |
| `UPSTASH_REDIS_REST_URL` | Optional Upstash Redis endpoint for distributed cache |
| `UPSTASH_REDIS_REST_TOKEN` | Optional Upstash Redis token |

Seed the production database with the initial Admin user:
```bash
ADMIN_EMAIL="admin@yourdomain.com" ADMIN_PASSWORD="SecurePassword123!" MONGODB_URI="<your-atlas-uri>" npm run seed:prod
```

---

## 🛠 Available Scripts

- `npm run dev` — Launch Next.js dev server with Turbopack
- `npm run build` — Compile TypeScript and generate optimized production bundle
- `npm run start` — Run production server
- `npm run type-check` — Run TypeScript compiler verification (`tsc --noEmit`)
- `npm test` — Run unit test suite with Vitest
- `npm run seed:local` — Populate local database with admin, categories, tags, and articles
- `npm run seed:prod` — Seed production admin user safely

---

## 📄 License
MIT License. Free for personal and commercial usage.

# ailatestnews
