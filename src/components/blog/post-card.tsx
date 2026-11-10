"use client";

import { NewsCard } from "./cards/news-card";
import type { NewsCardProps, NewsCardPost } from "./cards/types";

export type PostCardProps = NewsCardProps;
export type { NewsCardPost };

export function PostCard(props: PostCardProps) {
  return <NewsCard {...props} />;
}

export { NewsCard };
export default PostCard;
