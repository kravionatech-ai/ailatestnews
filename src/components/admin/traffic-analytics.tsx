"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  Activity,
  Globe2,
  MousePointer2,
  Users,
  Laptop,
  Smartphone,
  BookOpen,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Calendar,
  Info,
} from "lucide-react";
import type { TrafficAnalyticsPayload, DailyTrafficItem, PeriodSummary } from "@/lib/db/queries/stats";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    notation: value > 9999 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);

const formatUtcDate = (dateStr: string, options?: Intl.DateTimeFormatOptions) => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    ...(options || { day: "numeric", month: "short" }),
  });
};

export function TrafficAnalytics({ data }: { data: TrafficAnalyticsPayload }) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clientData, setClientData] = useState<TrafficAnalyticsPayload>(data);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sync with prop updates
  useEffect(() => {
    setClientData(data);
  }, [data]);

  // Handle live refresh from admin API endpoint
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.trafficRows)) {
          // Recompute locally
          const trafficStart = new Date();
          trafficStart.setUTCHours(0, 0, 0, 0);
          trafficStart.setUTCDate(trafficStart.getUTCDate() - 89);

          const dayMap = new Map<string, DailyTrafficItem>();
          for (const row of json.trafficRows) {
            const dateKey = new Date(row.date).toISOString().slice(0, 10);
            const existing: DailyTrafficItem = dayMap.get(dateKey) || {
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
            if (row.referrers) Object.assign(existing.sources, row.referrers);
            if (row.countries) Object.assign(existing.countries, row.countries);
            if (row.devices) Object.assign(existing.devices, row.devices);
            if (row.readingDepth) {
              existing.readingDepth.quarter += Number(row.readingDepth.quarter) || 0;
              existing.readingDepth.half += Number(row.readingDepth.half) || 0;
              existing.readingDepth.threeQuarter += Number(row.readingDepth.threeQuarter) || 0;
              existing.readingDepth.full += Number(row.readingDepth.full) || 0;
            }
            dayMap.set(dateKey, existing);
          }

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

          // Function to aggregate period
          const aggregate = (slice: DailyTrafficItem[]): PeriodSummary => {
            let totalViews = 0;
            let uniqueVisitors = 0;
            let peakDay = { date: "", views: 0 };
            const sources: Record<string, number> = {};
            const countries: Record<string, number> = {};
            const devices: Record<string, number> = {};
            const depth = { quarter: 0, half: 0, threeQuarter: 0, full: 0 };

            for (const item of slice) {
              totalViews += item.views;
              uniqueVisitors += item.visitors;
              if (item.views >= peakDay.views && item.views > 0) {
                peakDay = { date: item.date, views: item.views };
              }
              for (const [k, v] of Object.entries(item.sources)) sources[k] = (sources[k] || 0) + v;
              for (const [k, v] of Object.entries(item.countries)) countries[k] = (countries[k] || 0) + v;
              for (const [k, v] of Object.entries(item.devices)) devices[k] = (devices[k] || 0) + v;
              depth.quarter += item.readingDepth.quarter;
              depth.half += item.readingDepth.half;
              depth.threeQuarter += item.readingDepth.threeQuarter;
              depth.full += item.readingDepth.full;
            }

            const toSorted = (rec: Record<string, number>) =>
              Object.entries(rec)
                .map(([name, views]) => ({ name, views }))
                .sort((a, b) => b.views - a.views);

            return {
              totalViews,
              uniqueVisitors,
              dailyAvgViews: Math.round((totalViews / Math.max(1, slice.length)) * 10) / 10,
              peakDay,
              sources: toSorted(sources).slice(0, 8),
              countries: toSorted(countries).slice(0, 8),
              devices: toSorted(devices),
              readingDepth: depth,
            };
          };

          setClientData({
            daily,
            lifetimeViews: json.lifetimeViews ?? clientData.lifetimeViews,
            windows: {
              "7": aggregate(daily.slice(-7)),
              "30": aggregate(daily.slice(-30)),
              "90": aggregate(daily.slice(-90)),
            },
          });
        }
      }
    } catch (e) {
      console.error("[Refresh Analytics Failed]", e);
    } finally {
      setIsRefreshing(false);
    }
  }, [range, clientData.lifetimeViews]);

  // Selected date series slice
  const series = useMemo(() => {
    return clientData.daily.slice(-range);
  }, [clientData.daily, range]);

  // Current window summary
  const summary: PeriodSummary = useMemo(() => {
    const key = String(range) as "7" | "30" | "90";
    if (clientData.windows?.[key]) {
      return clientData.windows[key];
    }
    // Fallback recalculation
    let totalViews = 0;
    let uniqueVisitors = 0;
    let peakDay = { date: "", views: 0 };
    const sources: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const depth = { quarter: 0, half: 0, threeQuarter: 0, full: 0 };

    for (const item of series) {
      totalViews += item.views;
      uniqueVisitors += item.visitors;
      if (item.views >= peakDay.views && item.views > 0) {
        peakDay = { date: item.date, views: item.views };
      }
      for (const [k, v] of Object.entries(item.sources || {})) sources[k] = (sources[k] || 0) + v;
      for (const [k, v] of Object.entries(item.countries || {})) countries[k] = (countries[k] || 0) + v;
      for (const [k, v] of Object.entries(item.devices || {})) devices[k] = (devices[k] || 0) + v;
      if (item.readingDepth) {
        depth.quarter += item.readingDepth.quarter;
        depth.half += item.readingDepth.half;
        depth.threeQuarter += item.readingDepth.threeQuarter;
        depth.full += item.readingDepth.full;
      }
    }

    const toSorted = (rec: Record<string, number>) =>
      Object.entries(rec)
        .map(([name, views]) => ({ name, views }))
        .sort((a, b) => b.views - a.views);

    return {
      totalViews,
      uniqueVisitors,
      dailyAvgViews: Math.round((totalViews / Math.max(1, series.length)) * 10) / 10,
      peakDay,
      sources: toSorted(sources).slice(0, 8),
      countries: toSorted(countries).slice(0, 8),
      devices: toSorted(devices),
      readingDepth: depth,
    };
  }, [clientData.windows, range, series]);

  const hasData = series.some((item) => item.views > 0);

  // SVG Chart Dimensions & Scale
  const width = 760;
  const height = 230;
  const left = 48;
  const right = 20;
  const top = 18;
  const bottom = 32;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const maxVal = Math.max(5, ...series.map((item) => item.views));
  // Round up max to nice integer
  const yMax = Math.ceil(maxVal * 1.15);

  const getX = (index: number) =>
    left + (series.length <= 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth);

  const getY = (value: number) => top + plotHeight - (value / yMax) * plotHeight;

  // SVG Line Path
  const linePath = useMemo(() => {
    return series
      .map((item, index) => `${index === 0 ? "M" : "L"} ${getX(index).toFixed(1)} ${getY(item.views).toFixed(1)}`)
      .join(" ");
  }, [series, yMax]);

  // SVG Area Fill Path
  const areaPath = useMemo(() => {
    if (series.length === 0) return "";
    const firstX = getX(0).toFixed(1);
    const lastX = getX(series.length - 1).toFixed(1);
    const bottomY = (top + plotHeight).toFixed(1);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, series.length]);

  // Pointer tracking for interactive tooltips
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || series.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = (clientX - (left / width) * rect.width) / ((plotWidth / width) * rect.width);
    const clamped = Math.max(0, Math.min(1, ratio));
    const closestIndex = Math.round(clamped * (series.length - 1));
    setHoverIndex(closestIndex);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (series.length === 0) return;
    const current = hoverIndex ?? 0;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setHoverIndex(Math.min(series.length - 1, current + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setHoverIndex(Math.max(0, current - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setHoverIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHoverIndex(series.length - 1);
    }
  };

  // Active hover data
  const activeItem = hoverIndex !== null && series[hoverIndex] ? series[hoverIndex] : null;

  // Reading depth values
  const readingDepthMilestones = [
    { label: "25% Read", value: summary.readingDepth.quarter, color: "bg-sky-400" },
    { label: "50% Read", value: summary.readingDepth.half, color: "bg-indigo-500" },
    { label: "75% Read", value: summary.readingDepth.threeQuarter, color: "bg-violet-600" },
    { label: "100% Finished", value: summary.readingDepth.full, color: "bg-emerald-500" },
  ];
  const maxDepthVal = Math.max(1, summary.readingDepth.quarter, summary.totalViews);

  return (
    <section className="space-y-6" aria-label="Audience Intelligence & Traffic Telemetry">
      {/* ── Top Header Controls & Timeframe Selector ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Activity className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
              Real Telemetry Engine
            </span>
          </div>
          <h2 className="mt-1 text-xl font-extrabold text-[var(--foreground)] tracking-tight">
            Traffic &amp; Reader Engagement
          </h2>
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
            Privacy-safe article analytics aggregated at UTC day-level granularity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date range toggle group */}
          <div
            className="inline-flex rounded-xl border border-[var(--border)] bg-white p-1 shadow-3xs"
            role="group"
            aria-label="Analytics date range filter"
          >
            {([7, 30, 90] as const).map((days) => (
              <button
                key={days}
                onClick={() => {
                  setRange(days);
                  setHoverIndex(null);
                }}
                aria-pressed={range === days}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  range === days
                    ? "bg-[var(--accent)] text-white shadow-xs"
                    : "text-[var(--foreground-muted)] hover:bg-slate-50 hover:text-[var(--foreground)]"
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>

          {/* Live Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh telemetry data"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-slate-50 shadow-3xs transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner (If DB or Telemetry Failed) ── */}
      {clientData.error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>Telemetry Notice: {clientData.error}. Historical totals remain safe.</span>
        </div>
      )}

      {/* ── Lifetime vs Period Clarity Banner ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-sky-50/50 to-white p-4 text-xs">
        <div className="flex items-center gap-2.5">
          <Info className="h-4 w-4 text-indigo-600 shrink-0" />
          <span className="text-slate-700 font-medium">
            <strong className="font-bold text-slate-900">Telemetry Distinction:</strong> Lifetime Article Views (
            <span className="font-semibold text-indigo-700">{formatNumber(clientData.lifetimeViews)}</span>
            ) are preserved lifetime counters on published posts. Below telemetry shows verified events for the selected{" "}
            <span className="font-semibold text-slate-900">{range}-day window</span>.
          </span>
        </div>
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>
            {formatUtcDate(series[0]?.date || "")} – {formatUtcDate(series[series.length - 1]?.date || "")} (UTC)
          </span>
        </div>
      </div>

      {/* ── Selected Period Telemetry Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-3xs">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--foreground-muted)]">
            <MousePointer2 className="h-3.5 w-3.5 text-indigo-500" />
            Period Page Views
          </span>
          <p className="mt-1 text-2xl font-black text-[var(--foreground)] tracking-tight">
            {formatNumber(summary.totalViews)}
          </p>
          <span className="text-[10px] text-[var(--foreground-muted)]">
            {range}-day verified loads
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-3xs">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--foreground-muted)]">
            <Users className="h-3.5 w-3.5 text-sky-500" />
            Unique Readers
          </span>
          <p className="mt-2 text-2xl font-black text-[var(--foreground)] tracking-tight">
            {formatNumber(summary.uniqueVisitors)}
          </p>
          <span className="text-[10px] text-[var(--foreground-muted)]">
            Daily salted deduplication
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-3xs">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--foreground-muted)]">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            Daily Average
          </span>
          <p className="mt-2 text-2xl font-black text-[var(--foreground)] tracking-tight">
            {summary.dailyAvgViews}
          </p>
          <span className="text-[10px] text-[var(--foreground-muted)]">
            Views per day in range
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-3xs">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--foreground-muted)]">
            <Activity className="h-3.5 w-3.5 text-violet-500" />
            Peak Day Traffic
          </span>
          <p className="mt-2 text-2xl font-black text-[var(--foreground)] tracking-tight">
            {summary.peakDay.views > 0 ? formatNumber(summary.peakDay.views) : "0"}
          </p>
          <span className="text-[10px] text-[var(--foreground-muted)] truncate block">
            {summary.peakDay.views > 0 ? formatUtcDate(summary.peakDay.date) : "No traffic peak yet"}
          </span>
        </div>
      </div>

      {/* ── Interactive Daily Chart ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              Daily Traffic Trajectory ({range} Days)
            </h3>
            <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
              Hover, tap, or scrub with arrow keys to inspect daily views and unique readers.
            </p>
          </div>

          {/* Active tooltip badge for quick glance */}
          {activeItem && (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs">
              <span className="font-bold text-slate-800">
                {formatUtcDate(activeItem.date, { weekday: "short", day: "numeric", month: "short" })}:
              </span>
              <span className="font-bold text-indigo-700">
                {activeItem.views} {activeItem.views === 1 ? "view" : "views"}
              </span>
              <span className="text-sky-700">
                ({activeItem.visitors} unique)
              </span>
            </div>
          )}
        </div>

        {hasData ? (
          <div className="relative overflow-x-auto select-none">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              className="h-[230px] min-w-[560px] w-full cursor-crosshair outline-none"
              role="region"
              aria-label={`Interactive ${range}-day chart of page views`}
              tabIndex={0}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onKeyDown={handleKeyDown}
            >
              <defs>
                <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.28" />
                  <stop offset="70%" stopColor="#818CF8" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines & Y-Axis Labels */}
              {[0, 1, 2, 3].map((tick) => {
                const tickY = top + (plotHeight * tick) / 3;
                const tickVal = Math.round(yMax * (1 - tick / 3));
                return (
                  <g key={tick}>
                    <line
                      x1={left}
                      x2={width - right}
                      y1={tickY}
                      y2={tickY}
                      stroke="#F1F5F9"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={left - 8}
                      y={tickY + 3.5}
                      textAnchor="end"
                      fill="#94A3B8"
                      fontSize="10"
                      fontFamily="inherit"
                    >
                      {formatNumber(tickVal)}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              <path d={areaPath} fill="url(#chartAreaGradient)" />

              {/* Primary Curve */}
              <path
                d={linePath}
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* X-Axis Dates */}
              {series
                .filter(
                  (_, index) =>
                    index % Math.max(1, Math.ceil(series.length / (range === 7 ? 7 : range === 30 ? 6 : 8))) ===
                      0 || index === series.length - 1
                )
                .map((item) => {
                  const itemIndex = series.indexOf(item);
                  return (
                    <text
                      key={item.date}
                      x={getX(itemIndex)}
                      y={height - 8}
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="10"
                      fontFamily="inherit"
                    >
                      {formatUtcDate(item.date)}
                    </text>
                  );
                })}

              {/* Discrete Data Points for 7-day range or when views exist */}
              {series.map((item, index) => {
                const cx = getX(index);
                const cy = getY(item.views);
                const isHovered = hoverIndex === index;
                if (!isHovered && item.views === 0 && range !== 7) return null;

                return (
                  <circle
                    key={item.date}
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 3.5}
                    fill={isHovered ? "#38BDF8" : "#4F46E5"}
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="transition-all duration-150"
                  />
                );
              })}

              {/* Hover Cursor Guideline and Floating Point */}
              {hoverIndex !== null && activeItem && (
                <g>
                  {/* Vertical dashed line */}
                  <line
                    x1={getX(hoverIndex)}
                    x2={getX(hoverIndex)}
                    y1={top}
                    y2={top + plotHeight}
                    stroke="#818CF8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  {/* Outer halo */}
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(activeItem.views)}
                    r="8"
                    fill="#6366F1"
                    fillOpacity="0.25"
                  />
                </g>
              )}
            </svg>
          </div>
        ) : (
          /* Honest Empty State for Zero Historical Telemetry */
          <div className="flex h-[220px] flex-col items-center justify-center rounded-xl bg-slate-50/70 p-6 text-center border border-dashed border-slate-200">
            <Activity className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">
              No daily traffic telemetry recorded for this {range}-day period
            </p>
            <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
              New article visits will automatically track page views, unique visitors, and reading depth.
              Lifetime post counts ({formatNumber(clientData.lifetimeViews)}) remain intact and are not
              redistributed across fake dates.
            </p>
          </div>
        )}
      </div>

      {/* ── Detailed Breakdown Grids (Geo, Sources, Devices, Reading Depth) ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 1. Traffic Sources */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              Traffic Sources &amp; Referrers
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">
              {range}-day breakdown
            </span>
          </div>

          {summary.sources.length > 0 ? (
            <div className="space-y-3.5">
              {summary.sources.map((item) => {
                const maxSource = Math.max(1, ...summary.sources.map((s) => s.views));
                const pct = Math.round((item.views / Math.max(1, summary.totalViews)) * 100);
                return (
                  <div key={item.name}>
                    <div className="mb-1 flex justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {formatNumber(item.views)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${Math.max(4, (item.views / maxSource) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyMetric
              title="No referrer data recorded yet"
              description="Referrers are automatically extracted from incoming HTTP headers (e.g. Google, X, Direct) when readers visit articles."
            />
          )}
        </div>

        {/* 2. Top Countries */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-sky-500" />
              <h3 className="text-sm font-bold text-[var(--foreground)]">Top Geographies</h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {range}-day breakdown
            </span>
          </div>

          {summary.countries.length > 0 ? (
            <div className="space-y-3.5">
              {summary.countries.map((item) => {
                const maxCountry = Math.max(1, ...summary.countries.map((c) => c.views));
                const pct = Math.round((item.views / Math.max(1, summary.totalViews)) * 100);
                return (
                  <div key={item.name}>
                    <div className="mb-1 flex justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {formatNumber(item.views)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all duration-300"
                        style={{ width: `${Math.max(4, (item.views / maxCountry) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyMetric
              title="No country data recorded yet"
              description="Geographic breakdowns are captured from Edge GeoIP headers (Vercel/Cloudflare). In local environments without proxy headers, visits remain unassigned."
            />
          )}
        </div>

        {/* 3. Device Breakdown */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-bold text-[var(--foreground)]">Reader Devices</h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {range}-day breakdown
            </span>
          </div>

          {summary.devices.length > 0 ? (
            <div className="space-y-3.5">
              {summary.devices.map((item) => {
                const maxDevice = Math.max(1, ...summary.devices.map((d) => d.views));
                const pct = Math.round((item.views / Math.max(1, summary.totalViews)) * 100);
                return (
                  <div key={item.name}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        {item.name === "Mobile" ? (
                          <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                        ) : (
                          <Laptop className="h-3.5 w-3.5 text-slate-500" />
                        )}
                        {item.name}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {formatNumber(item.views)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-300"
                        style={{ width: `${Math.max(4, (item.views / maxDevice) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyMetric
              title="No device telemetry recorded yet"
              description="Device types (Desktop, Mobile, Tablet) are parsed from User-Agent headers on live article page visits."
            />
          )}
        </div>

        {/* 4. Article Reading Depth */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-[var(--foreground)]">Article Reading Depth</h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {range}-day milestones
            </span>
          </div>

          {readingDepthMilestones.some((m) => m.value > 0) ? (
            <div className="space-y-3.5">
              {readingDepthMilestones.map((m) => {
                const pct = Math.round((m.value / maxDepthVal) * 100);
                return (
                  <div key={m.label}>
                    <div className="mb-1 flex justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-800">{m.label}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {formatNumber(m.value)} milestones ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${m.color} transition-all duration-300`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyMetric
              title="No reading depth milestones recorded yet"
              description="Reading-depth milestones (25%, 50%, 75%, 100%) trigger automatically as readers scroll through article content."
            />
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyMetric({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-xl bg-slate-50/70 p-4 text-center border border-dashed border-slate-200">
      <p className="text-xs font-bold text-slate-700">{title}</p>
      <p className="mt-1 max-w-xs text-[11px] text-slate-500 leading-normal">{description}</p>
    </div>
  );
}
