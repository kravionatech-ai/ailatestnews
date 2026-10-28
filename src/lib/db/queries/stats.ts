import { connectDB } from "../connection";
import { Post, Comment, Subscriber, User, ContactMessage, ViewStat } from "../models";

export type DailyTrafficItem = {
  date: string; // YYYY-MM-DD (UTC)
  views: number;
  visitors: number;
  sources: Record<string, number>;
  countries: Record<string, number>;
  devices: Record<string, number>;
  readingDepth: { quarter: number; half: number; threeQuarter: number; full: number };
};

export type PeriodSummary = {
  totalViews: number;
  uniqueVisitors: number;
  dailyAvgViews: number;
  peakDay: { date: string; views: number };
  sources: Array<{ name: string; views: number }>;
  countries: Array<{ name: string; views: number }>;
  devices: Array<{ name: string; views: number }>;
  readingDepth: { quarter: number; half: number; threeQuarter: number; full: number };
};

export type TrafficAnalyticsPayload = {
  daily: DailyTrafficItem[];
  lifetimeViews: number;
  windows: {
    "7": PeriodSummary;
    "30": PeriodSummary;
    "90": PeriodSummary;
  };
  error?: string;
};

// Helper: Convert Map or Object to clean entries
function toRecord(value: unknown): Record<string, number> {
  const result: Record<string, number> = {};
  if (value instanceof Map) {
    for (const [k, v] of value.entries()) {
      result[String(k)] = Number(v) || 0;
    }
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      result[String(k)] = Number(v) || 0;
    }
  }
  return result;
}

// Helper: Calculate window summary from a slice of daily traffic
function computePeriodSummary(slice: DailyTrafficItem[]): PeriodSummary {
  let totalViews = 0;
  let uniqueVisitors = 0;
  let peakDay = { date: "", views: 0 };
  const sourceTotals: Record<string, number> = {};
  const countryTotals: Record<string, number> = {};
  const deviceTotals: Record<string, number> = {};
  const depthTotals = { quarter: 0, half: 0, threeQuarter: 0, full: 0 };

  for (const day of slice) {
    totalViews += day.views;
    uniqueVisitors += day.visitors;

    if (day.views >= peakDay.views && day.views > 0) {
      peakDay = { date: day.date, views: day.views };
    }

    for (const [k, v] of Object.entries(day.sources)) {
      sourceTotals[k] = (sourceTotals[k] || 0) + v;
    }
    for (const [k, v] of Object.entries(day.countries)) {
      countryTotals[k] = (countryTotals[k] || 0) + v;
    }
    for (const [k, v] of Object.entries(day.devices)) {
      deviceTotals[k] = (deviceTotals[k] || 0) + v;
    }

    depthTotals.quarter += day.readingDepth.quarter;
    depthTotals.half += day.readingDepth.half;
    depthTotals.threeQuarter += day.readingDepth.threeQuarter;
    depthTotals.full += day.readingDepth.full;
  }

  const daysCount = Math.max(1, slice.length);
  const dailyAvgViews = Math.round((totalViews / daysCount) * 10) / 10;

  const toSortedArray = (rec: Record<string, number>) =>
    Object.entries(rec)
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views);

  return {
    totalViews,
    uniqueVisitors,
    dailyAvgViews,
    peakDay,
    sources: toSortedArray(sourceTotals).slice(0, 8),
    countries: toSortedArray(countryTotals).slice(0, 8),
    devices: toSortedArray(deviceTotals),
    readingDepth: depthTotals,
  };
}

export async function getAdminDashboardStats() {
  try {
    await connectDB();

    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      scheduledPosts,
      archivedPosts,
      featuredPosts,
      missingSeoPosts,
      totalComments,
      pendingComments,
      totalSubscribers,
      totalUsers,
      unreadMessages,
      recentPosts,
      topPosts,
    ] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ status: "published" }),
      Post.countDocuments({ status: "draft" }),
      Post.countDocuments({ status: "scheduled" }),
      Post.countDocuments({ status: "archived" }),
      Post.countDocuments({ status: "published", featured: true }),
      Post.countDocuments({
        $or: [
          { "seo.metaTitle": { $exists: false } },
          { "seo.metaTitle": "" },
          { "seo.metaDescription": { $exists: false } },
          { "seo.metaDescription": "" },
        ],
      }),
      Comment.countDocuments(),
      Comment.countDocuments({ status: "pending" }),
      Subscriber.countDocuments({ status: "active" }),
      User.countDocuments(),
      ContactMessage.countDocuments({ status: "unread" }),
      Post.find()
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(6)
        .populate("author", "name")
        .populate("category", "name")
        .select("title slug status views publishedAt createdAt updatedAt featured")
        .lean(),
      Post.find({ status: "published" })
        .sort({ views: -1 })
        .limit(5)
        .select("title slug views publishedAt")
        .lean(),
    ]);

    // Aggregate total lifetime views across all posts
    const viewsAggregation = await Post.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]);
    const lifetimeViews = viewsAggregation[0]?.totalViews || 0;

    // Daily analytics from ViewStat collection (90-day UTC window)
    const trafficStart = new Date();
    trafficStart.setUTCHours(0, 0, 0, 0);
    trafficStart.setUTCDate(trafficStart.getUTCDate() - 89);

    const trafficRows = await ViewStat.find({ date: { $gte: trafficStart } })
      .select("date views uniqueVisitors referrers countries devices readingDepth")
      .lean();

    // Map rows by YYYY-MM-DD
    const dayMap = new Map<string, DailyTrafficItem>();

    for (const row of trafficRows) {
      const dateKey = new Date(row.date).toISOString().slice(0, 10);
      const existing = dayMap.get(dateKey) || {
        date: dateKey,
        views: 0,
        visitors: 0,
        sources: {},
        countries: {},
        devices: {},
        readingDepth: { quarter: 0, half: 0, threeQuarter: 0, full: 0 },
      };

      existing.views += Number(row.views) || 0;
      existing.visitors += Number(row.uniqueVisitors) || 0;

      // Merge referrers
      const rowReferrers = toRecord(row.referrers);
      for (const [k, v] of Object.entries(rowReferrers)) {
        existing.sources[k] = (existing.sources[k] || 0) + v;
      }

      // Merge countries
      const rowCountries = toRecord(row.countries);
      for (const [k, v] of Object.entries(rowCountries)) {
        existing.countries[k] = (existing.countries[k] || 0) + v;
      }

      // Merge devices
      const rowDevices = toRecord((row as any).devices);
      for (const [k, v] of Object.entries(rowDevices)) {
        existing.devices[k] = (existing.devices[k] || 0) + v;
      }

      // Merge reading depth
      if (row.readingDepth) {
        existing.readingDepth.quarter += Number(row.readingDepth.quarter) || 0;
        existing.readingDepth.half += Number(row.readingDepth.half) || 0;
        existing.readingDepth.threeQuarter += Number(row.readingDepth.threeQuarter) || 0;
        existing.readingDepth.full += Number(row.readingDepth.full) || 0;
      }

      dayMap.set(dateKey, existing);
    }

    // Build complete consecutive 90-day calendar array (UTC)
    const daily: DailyTrafficItem[] = Array.from({ length: 90 }, (_, index) => {
      const day = new Date(trafficStart);
      day.setUTCDate(day.getUTCDate() + index);
      const dateKey = day.toISOString().slice(0, 10);
      return (
        dayMap.get(dateKey) || {
          date: dateKey,
          views: 0,
          visitors: 0,
          sources: {},
          countries: {},
          devices: {},
          readingDepth: { quarter: 0, half: 0, threeQuarter: 0, full: 0 },
        }
      );
    });

    const windows = {
      "7": computePeriodSummary(daily.slice(-7)),
      "30": computePeriodSummary(daily.slice(-30)),
      "90": computePeriodSummary(daily.slice(-90)),
    };

    const traffic: TrafficAnalyticsPayload = {
      daily,
      lifetimeViews,
      windows,
    };

    // Editorial alerts calculation
    const alerts: Array<{ type: "warning" | "info" | "urgent"; message: string; href?: string }> = [];
    if (unreadMessages > 0) {
      alerts.push({
        type: "urgent",
        message: `${unreadMessages} unread editorial tip${unreadMessages === 1 ? "" : "s"} waiting in the Inquiries Desk`,
        href: "/admin/messages",
      });
    }
    if (pendingComments > 0) {
      alerts.push({
        type: "warning",
        message: `${pendingComments} reader comment${pendingComments === 1 ? "" : "s"} require moderation`,
        href: "/admin/comments",
      });
    }
    if (missingSeoPosts > 0) {
      alerts.push({
        type: "info",
        message: `${missingSeoPosts} article${missingSeoPosts === 1 ? "" : "s"} missing meta title or description`,
        href: "/admin/seo",
      });
    }

    return {
      metrics: {
        totalPosts,
        publishedPosts,
        draftPosts,
        scheduledPosts,
        archivedPosts,
        featuredPosts,
        missingSeoPosts,
        totalViews: lifetimeViews,
        totalComments,
        pendingComments,
        totalSubscribers,
        totalUsers,
        unreadMessages,
      },
      traffic,
      alerts,
      recentPosts: JSON.parse(JSON.stringify(recentPosts)),
      topPosts: JSON.parse(JSON.stringify(topPosts)),
    };
  } catch (error) {
    console.error("[getAdminDashboardStats Error]", error);
    // Safe fallback defaults so the Admin Dashboard NEVER crashes even if DB query fails
    const emptySummary: PeriodSummary = {
      totalViews: 0,
      uniqueVisitors: 0,
      dailyAvgViews: 0,
      peakDay: { date: "", views: 0 },
      sources: [],
      countries: [],
      devices: [],
      readingDepth: { quarter: 0, half: 0, threeQuarter: 0, full: 0 },
    };

    return {
      metrics: {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        scheduledPosts: 0,
        archivedPosts: 0,
        featuredPosts: 0,
        missingSeoPosts: 0,
        totalViews: 0,
        totalComments: 0,
        pendingComments: 0,
        totalSubscribers: 0,
        totalUsers: 0,
        unreadMessages: 0,
      },
      traffic: {
        daily: [],
        lifetimeViews: 0,
        windows: { "7": emptySummary, "30": emptySummary, "90": emptySummary },
        error: "Database telemetry query failed",
      },
      alerts: [
        {
          type: "urgent" as const,
          message: "Database telemetry query failed. System operating in degraded fallback mode.",
        },
      ],
      recentPosts: [],
      topPosts: [],
    };
  }
}
