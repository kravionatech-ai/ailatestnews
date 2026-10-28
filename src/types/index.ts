/**
 * Shared TypeScript types used across the application.
 */

// ── API Response Types ──
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ── Search ──
export interface SearchParams {
  q?: string;
  category?: string;
  tag?: string;
  author?: string;
  status?: string;
  page?: string;
  sort?: string;
  locale?: string;
}

// ── SEO ──
export interface SeoData {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
  keywords?: string[];
}

// ── Navigation ──
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  children?: NavItem[];
  badge?: string | number;
  external?: boolean;
}

// ── Admin Dashboard ──
export interface DashboardStats {
  totalPosts: number;
  totalViews: number;
  totalComments: number;
  totalSubscribers: number;
  drafts: number;
  scheduled: number;
  recentPosts: unknown[];
  topPosts: unknown[];
  seoIssues: number;
}

// ── Breadcrumb ──
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ── Site Settings ──
export interface SiteSettings {
  name: string;
  tagline?: string;
  description?: string;
  logo?: string;
  favicon?: string;
  socialLinks?: Record<string, string>;
  analyticsId?: string;
  adsenseId?: string;
  footerText?: string;
  customScripts?: {
    head?: string;
    body?: string;
  };
}
