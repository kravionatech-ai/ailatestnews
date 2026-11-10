import { DesignTokens, ArticleLayoutTemplate } from "@/lib/design-tokens/types";

export interface ArticleAuthor {
  _id?: string;
  name?: string;
  slug?: string;
  image?: string;
  bio?: string;
  role?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    youtube?: string;
  };
}

export interface ArticleCategory {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ArticleTag {
  _id?: string;
  name: string;
  slug: string;
}

export interface ArticlePostData {
  _id: string | unknown;
  title: string;
  slug: string;
  contentHtml?: string;
  excerpt?: string;
  coverImage?: string;
  coverImageAlt?: string;
  coverImageCaption?: string;
  publishedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  readingTime?: number;
  views?: number;
  featured?: boolean;
  allowComments?: boolean;
  category?: ArticleCategory | null;
  author?: ArticleAuthor | null;
  tags?: ArticleTag[];
  layoutTemplate?: ArticleLayoutTemplate;
  keyTakeaways?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImage?: string;
    schemaType?: string;
    schemaOverrides?: string;
  };
}

export interface ArticleCommentItem {
  _id: string;
  content: string;
  createdAt: string | Date;
  likes?: number;
  author?: {
    name?: string;
    image?: string;
  };
  guestName?: string;
  replies?: ArticleCommentItem[];
}

export interface RelatedPostItem {
  _id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  coverImageAlt?: string;
  readingTime?: number;
  views?: number;
  publishedAt?: Date | string;
  author?: { name?: string; image?: string; slug?: string } | null;
  category?: { name?: string; slug?: string } | null;
}

export interface AdjacentPostLink {
  title: string;
  slug: string;
  category?: { name?: string; slug?: string } | null;
  publishedAt?: Date | string;
}

export interface ArticleLayoutProps {
  post: ArticlePostData;
  comments?: ArticleCommentItem[];
  relatedPosts?: RelatedPostItem[];
  latestPosts?: RelatedPostItem[];
  prevPost?: AdjacentPostLink | null;
  nextPost?: AdjacentPostLink | null;
  tokens?: DesignTokens;
}

export interface ArticleLayoutDispatcherProps extends ArticleLayoutProps {
  templateOverride?: ArticleLayoutTemplate;
  template?: ArticleLayoutTemplate;
}
