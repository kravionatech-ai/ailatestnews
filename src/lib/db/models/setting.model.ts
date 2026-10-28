import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISeoTemplateConfig {
  titleTemplate: string;
  descriptionTemplate: string;
  defaultSchemaType?: string;
  defaultPriority?: number;
  defaultChangefreq?: string;
}

export interface INavItem {
  label: string;
  href: string;
  order: number;
  isExternal?: boolean;
}

export interface IFooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface IFooterSection {
  title: string;
  links: IFooterLink[];
}

export interface IFooterConfig {
  aboutText: string;
  copyrightText: string;
  sections: IFooterSection[];
}

export interface IGlobalSettings extends Document {
  siteName: string;
  tagline: string;
  siteUrl: string;
  separator: string;
  defaultOgImage: string;
  logo: string;
  favicon?: string;
  language: string;
  timezone: string;
  templates: {
    post: ISeoTemplateConfig;
    category: ISeoTemplateConfig;
    tag: ISeoTemplateConfig;
    page: ISeoTemplateConfig;
    author: ISeoTemplateConfig;
  };
  organization: {
    name: string;
    logo: string;
    url: string;
    description: string;
    email: string;
    socialProfiles: string[];
  };
  verification: {
    google?: string;
    bing?: string;
    yandex?: string;
    pinterest?: string;
  };
  indexNow: {
    apiKey?: string;
    keyLocation?: string;
    autoSubmitOnPublish: boolean;
  };
  robotsTxt?: string;
  analyticsId?: string;
  adsensePublisherId?: string;
  chatbot: {
    enabled: boolean;
    model: string;
    dailyLimit: number;
    welcomeMessage: string;
  };
  navigation: INavItem[];
  footer: IFooterConfig;
  createdAt: Date;
  updatedAt: Date;
}

const SeoTemplateConfigSchema = new Schema<ISeoTemplateConfig>(
  {
    titleTemplate: { type: String, default: "{title} {separator} {site}" },
    descriptionTemplate: { type: String, default: "{excerpt}" },
    defaultSchemaType: { type: String, default: "Article" },
    defaultPriority: { type: Number, default: 0.7 },
    defaultChangefreq: { type: String, default: "weekly" },
  },
  { _id: false }
);

const SettingSchema = new Schema<IGlobalSettings>(
  {
    siteName: { type: String, default: "AI Latest News" },
    tagline: { type: String, default: "AI news, tools and guides, explained for India" },
    siteUrl: {
      type: String,
      default: process.env.NEXT_PUBLIC_SITE_URL || "https://ainews.kraviona.com",
    },
    separator: { type: String, default: "|" },
    defaultOgImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    },
    logo: { type: String, default: "" },
    favicon: { type: String, default: "/favicon.ico" },
    language: { type: String, default: "en-IN" },
    timezone: { type: String, default: "Asia/Kolkata" },
    templates: {
      post: {
        type: SeoTemplateConfigSchema,
        default: () => ({
          titleTemplate: "{title} {separator} {site}",
          descriptionTemplate: "{excerpt}",
          defaultSchemaType: "NewsArticle",
          defaultPriority: 0.8,
          defaultChangefreq: "daily",
        }),
      },
      category: {
        type: SeoTemplateConfigSchema,
        default: () => ({
          titleTemplate: "{category} News, Tools & Guides {separator} {site}",
          descriptionTemplate: "Comprehensive coverage of {category}: breaking news, model benchmarks, and developer guides.",
          defaultSchemaType: "CollectionPage",
          defaultPriority: 0.7,
          defaultChangefreq: "weekly",
        }),
      },
      tag: {
        type: SeoTemplateConfigSchema,
        default: () => ({
          titleTemplate: "{title} AI Updates & Articles {separator} {site}",
          descriptionTemplate: "Latest news, articles and technical breakdowns tagged with {title} on {site}.",
          defaultSchemaType: "CollectionPage",
          defaultPriority: 0.5,
          defaultChangefreq: "weekly",
        }),
      },
      page: {
        type: SeoTemplateConfigSchema,
        default: () => ({
          titleTemplate: "{title} {separator} {site}",
          descriptionTemplate: "{excerpt}",
          defaultSchemaType: "WebPage",
          defaultPriority: 0.6,
          defaultChangefreq: "monthly",
        }),
      },
      author: {
        type: SeoTemplateConfigSchema,
        default: () => ({
          titleTemplate: "{author}, AI Author {separator} {site}",
          descriptionTemplate: "Read technical articles, model evaluations, and research by {author} at {site}.",
          defaultSchemaType: "ProfilePage",
          defaultPriority: 0.5,
          defaultChangefreq: "monthly",
        }),
      },
    },
    organization: {
      name: { type: String, default: "AI Latest News" },
      logo: { type: String, default: "" },
      url: { type: String, default: "https://ainews.kraviona.com" },
      description: {
        type: String,
        default: "Independent publication covering artificial intelligence, foundation models, and sovereign computing with an India lens.",
      },
      email: { type: String, default: "kravionatech@gmail.com" },
      socialProfiles: {
        type: [String],
        default: [
          "https://twitter.com/ailatestnews_in",
          "https://linkedin.com/company/ailatestnews",
          "https://github.com/ailatestnews",
        ],
      },
    },
    verification: {
      google: { type: String, default: "" },
      bing: { type: String, default: "" },
      yandex: { type: String, default: "" },
      pinterest: { type: String, default: "" },
    },
    indexNow: {
      apiKey: { type: String, default: process.env.INDEXNOW_KEY || "" },
      keyLocation: { type: String, default: "" },
      autoSubmitOnPublish: { type: Boolean, default: true },
    },
    robotsTxt: { type: String, default: "" },
    analyticsId: { type: String, default: process.env.NEXT_PUBLIC_GA_ID || "" },
    adsensePublisherId: { type: String, default: "" },
    chatbot: {
      enabled: { type: Boolean, default: true },
      model: { type: String, default: "claude-3-5-sonnet" },
      dailyLimit: { type: Number, default: 50 },
      welcomeMessage: { type: String, default: "Ask me anything about AI news or Indian foundation models!" },
    },
    navigation: {
      type: [
        {
          label: { type: String, required: true },
          href: { type: String, required: true },
          order: { type: Number, default: 0 },
          isExternal: { type: Boolean, default: false },
        },
      ],
      default: () => [
        { label: "Home", href: "/", order: 1 },
        { label: "AI News", href: "/category/ai-news", order: 2 },
        { label: "Model Launches", href: "/category/model-launches", order: 3 },
        { label: "AI Tools", href: "/category/ai-tools", order: 4 },
        { label: "India AI", href: "/category/india-ai", order: 5 },
        { label: "Guides", href: "/category/guides-and-comparisons", order: 6 },
      ],
    },
    footer: {
      aboutText: {
        type: String,
        default:
          "India's authoritative AI publication tracking foundational model releases, LLM benchmarks, Indian AI breakthroughs (Sarvam, Krutrim, BharatGPT), and hands-on tooling comparisons in clear, in-depth English.",
      },
      copyrightText: {
        type: String,
        default: "AI Latest News (ainews.kraviona.com). All rights reserved.",
      },
      sections: {
        type: [
          {
            title: { type: String, required: true },
            links: [
              {
                label: { type: String, required: true },
                href: { type: String, required: true },
                isExternal: { type: Boolean, default: false },
              },
            ],
          },
        ],
        default: () => [
          {
            title: "Categories",
            links: [
              { label: "AI News", href: "/category/ai-news" },
              { label: "Model Launches", href: "/category/model-launches" },
              { label: "AI Tools", href: "/category/ai-tools" },
              { label: "India AI", href: "/category/india-ai" },
              { label: "Guides & Comparisons", href: "/category/guides-and-comparisons" },
              { label: "Enterprise AI", href: "/category/enterprise-ai" },
            ],
          },
          {
            title: "Directories",
            links: [
              { label: "AI Tools Directory", href: "/ai-tools" },
              { label: "Model Launches Timeline", href: "/model-launches" },
              { label: "India AI Hub", href: "/india-ai" },
              { label: "Article Archive", href: "/archive" },
              { label: "Search Portal", href: "/search" },
            ],
          },
          {
            title: "Editorial & Legal",
            links: [
              { label: "About Us", href: "/about" },
              { label: "Editorial Policy", href: "/editorial-policy" },
              { label: "Contact Editorial Desk", href: "/contact" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
            ],
          },
        ],
      },
    },
  },
  { timestamps: true }
);

const Setting: Model<IGlobalSettings> =
  mongoose.models.Setting || mongoose.model<IGlobalSettings>("Setting", SettingSchema);

export default Setting;
