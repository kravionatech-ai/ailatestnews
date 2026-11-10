import React from "react";
import type { ArticleLayoutTemplate } from "@/lib/design-tokens/types";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens/defaults";
import { StandardEditorialLayout } from "./standard-editorial";
import { PremiumMagazineLayout } from "./premium-magazine";
import { MinimalReadingLayout } from "./minimal-reading";
import { WideArticleLayout } from "./wide-article";
import { WithoutSidebarLayout } from "./without-sidebar";
import type { ArticleLayoutDispatcherProps, ArticleLayoutProps } from "./types";

const TEMPLATE_MAP: Record<
  ArticleLayoutTemplate,
  React.ComponentType<ArticleLayoutProps>
> = {
  "standard-editorial": StandardEditorialLayout,
  "premium-magazine": PremiumMagazineLayout,
  "minimal-reading": MinimalReadingLayout,
  "wide-article": WideArticleLayout,
  "without-sidebar": WithoutSidebarLayout,
};

export function ArticleLayoutDispatcher({
  post,
  comments = [],
  relatedPosts = [],
  latestPosts = [],
  prevPost = null,
  nextPost = null,
  tokens = DEFAULT_DESIGN_TOKENS,
  templateOverride,
  template,
}: ArticleLayoutDispatcherProps) {
  const effectiveTemplate: ArticleLayoutTemplate =
    templateOverride ||
    template ||
    post.layoutTemplate ||
    tokens?.article?.defaultTemplate ||
    "standard-editorial";

  const LayoutComponent = TEMPLATE_MAP[effectiveTemplate] || StandardEditorialLayout;

  return (
    <LayoutComponent
      post={post}
      comments={comments}
      relatedPosts={relatedPosts}
      latestPosts={latestPosts}
      prevPost={prevPost}
      nextPost={nextPost}
      tokens={tokens}
    />
  );
}

export default ArticleLayoutDispatcher;
