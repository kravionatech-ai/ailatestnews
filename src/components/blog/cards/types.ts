import { CardVariant } from "@/lib/design-tokens/types";

export interface NewsCardAuthor {
  name: string;
  image?: string;
  slug?: string;
  bio?: string;
  role?: string;
}

export interface NewsCardCategory {
  name: string;
  slug: string;
}

export interface NewsCardTag {
  name: string;
  slug: string;
}

export interface NewsCardPost {
  _id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  coverImageAlt?: string;
  readingTime?: number;
  views?: number;
  publishedAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  author?: NewsCardAuthor | null;
  category?: NewsCardCategory | null;
  tags?: Array<NewsCardTag | string>;
  featured?: boolean;
  isBreaking?: boolean;
  isTrending?: boolean;
}

export interface NewsCardBaseProps {
  post: NewsCardPost;
  aspectRatio?: "16:9" | "4:3" | "1:1" | "3:2";
  showBadges?: boolean;
  showAuthorAvatar?: boolean;
  showReadingTime?: boolean;
  showViewsCount?: boolean;
  showExcerpt?: boolean;
  showDate?: boolean;
  priorityImage?: boolean;
  className?: string;
}

export interface NewsCardProps extends NewsCardBaseProps {
  variant?: CardVariant;
  featured?: boolean; // backwards compatibility with PostCard
  rank?: number;      // for minimal-list (e.g. 1 -> "01")
}
