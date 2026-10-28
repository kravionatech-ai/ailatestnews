import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    MONGODB_URI: z
      .string()
      .min(1, "MONGODB_URI is required")
      .default("mongodb://localhost:27017/ailatestnews-dev"),
    AUTH_SECRET: z
      .string()
      .min(32, "AUTH_SECRET must be at least 32 characters")
      .default("development_secret_key_at_least_32_characters_long_123456"),
    AUTH_URL: z
      .string()
      .url("AUTH_URL must be a valid URL")
      .default("http://localhost:3000"),
    GOOGLE_CLIENT_ID: z.string().optional().default(""),
    GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
    CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
    CLOUDINARY_API_KEY: z.string().optional().default(""),
    CLOUDINARY_API_SECRET: z.string().optional().default(""),
    RESEND_API_KEY: z.string().optional().default(""),
    RESEND_FROM_EMAIL: z.string().optional().default("kravionatech@gmail.com"),
    UPSTASH_REDIS_REST_URL: z.string().optional().default(""),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(""),

    // Chatbot Configuration
    ANTHROPIC_API_KEY: z.string().optional().default(""),
    CHATBOT_MODEL: z.string().optional().default("claude-3-5-sonnet-20241022"),
    CHATBOT_MAX_TOKENS: z.coerce.number().optional().default(800),
    CHATBOT_ENABLED: z
      .string()
      .optional()
      .default("true")
      .transform((val) => val === "true"),
    CHATBOT_DAILY_LIMIT: z.coerce.number().optional().default(500),

    INDEXNOW_KEY: z.string().optional().default(""),
    SENTRY_DSN: z.string().optional().default(""),
    SENTRY_AUTH_TOKEN: z.string().optional().default(""),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  client: {
    NEXT_PUBLIC_SITE_URL: z
      .string()
      .url("NEXT_PUBLIC_SITE_URL must be a valid URL")
      .default("http://localhost:3000"),
    NEXT_PUBLIC_SITE_NAME: z.string().min(1).default("AI Latest News"),
    NEXT_PUBLIC_GA_ID: z.string().optional().default(""),
  },

  runtimeEnv: {
    MONGODB_URI: process.env.MONGODB_URI,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    CHATBOT_MODEL: process.env.CHATBOT_MODEL,
    CHATBOT_MAX_TOKENS: process.env.CHATBOT_MAX_TOKENS,
    CHATBOT_ENABLED: process.env.CHATBOT_ENABLED,
    CHATBOT_DAILY_LIMIT: process.env.CHATBOT_DAILY_LIMIT,
    INDEXNOW_KEY: process.env.INDEXNOW_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
