"use client";

import { useEffect, useState } from "react";
import { CloudSun, CloudRain, CloudSnow, Sun, Cloud, Wind, Droplets, Thermometer, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { fetchConditions } from "@/lib/conditions";
import type { ConditionOut, ForecastDayOut } from "@/lib/conditions";

interface Props {
  slug: string;
}

// ── Trail/permit status helpers ───────────────────────────────────────────────

const TRAIL_CONFIG: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  caution: { label: "Caution", className: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
  closed: { label: "Closed", className: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20" },
};

const PERMIT_CONFIG: Record<string, { label: string; className: string }> = {
  not_required: { label: "No Permit", className: "text-foreground/50 bg-foreground/5 border-foreground/10" },
  required: { label: "Permit Required", className: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
  check_locally: { label: "Check Locally", className: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20" },
};

// ── WMO icon mapping (weather_code → Lucide icon) ────────────────────────────
function WeatherIcon({ code, className }: { code: number | null; className?: string }) {
  const cls = className ?? "h-5 w-5";
  if (code === null || code === undefined) return <Cloud className={cls} />;
  if (code === 0 || code === 1) return <Sun className={cls} />;
  if (code === 2) return <CloudSun className={cls} />;
  if (code === 3) return <Cloud className={cls} />;
  if (code >= 51 && code <= 67) return <CloudRain className={cls} />;
  if (code >= 71 && code <= 86) return <CloudSnow className={cls} />;
  if (code >= 80 && code <= 82) return <CloudRain className={cls} />;
  if (code >= 95) return <AlertTriangle className={cls} />;
  return <Cloud className={cls} />;
}

// ── Day-of-week helper ───────────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return DAYS[d.getUTCDay()] ?? dateStr;
}

// ── Forecast card ────────────────────────────────────────────────────────────
function ForecastCard({ day }: { day: ForecastDayOut }) {
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl bg-foreground/[0.03] border border-foreground/8 min-w-[72px]">
      <span className="text-xs font-medium text-foreground/50">{dayLabel(day.date)}</span>
      <WeatherIcon code={day.wmo_code} className="h-4 w-4 text-foreground/60" />
      <span className="text-xs text-foreground/70">{day.label}</span>
      <div className="flex gap-1 text-[11px] text-foreground/50">
        {day.temp_max_c !== null && <span className="font-medium text-foreground/80">{Math.round(day.temp_max_c)}°</span>}
        {day.temp_min_c !== null && <span>{Math.round(day.temp_min_c)}°</span>}
      </div>
    </div>
  );
}

// ── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${className}`}>
      {label}
    </span>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export function LiveConditionsWidget({ slug }: Props) {
  const [data, setData] = useState<ConditionOut | null | "loading">("loading");

  useEffect(() => {
    fetchConditions(slug)
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, [slug]);

  // No data available — render nothing (trek has no coordinates)
  if (data === null) return null;

  const loaded = data !== "loading" && data !== null ? data : null;
  const trail = TRAIL_CONFIG[loaded?.trail_status ?? "open"] ?? TRAIL_CONFIG.open;
  const permit = PERMIT_CONFIG[loaded?.permit_status ?? "not_required"] ?? PERMIT_CONFIG.not_required;

  return (
    <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-foreground/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
            <CloudSun className="h-4 w-4 text-sky-500" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold leading-tight">Live Conditions</h2>
            <p className="text-sm text-foreground/50 mt-0.5">Real-time weather &amp; trail status</p>
          </div>
        </div>

        {/* Status pills in header */}
        {data !== "loading" && (
          <div className="hidden sm:flex items-center gap-2 mt-0.5">
            <StatusPill label={trail.label} className={trail.className} />
            <StatusPill label={permit.label} className={permit.className} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {/* Loading skeleton */}
        {data === "loading" && (
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-foreground/5 animate-pulse" />
            <div className="h-10 rounded-xl bg-foreground/5 animate-pulse" />
          </div>
        )}

        {data !== "loading" && data !== null && (
          <div className="space-y-5">
            {/* Current weather row */}
            {data.weather && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <WeatherIcon code={data.weather.wmo_code} className="h-8 w-8 text-sky-500" />
                  {data.weather.temp_c !== null && (
                    <span className="text-3xl font-display font-semibold text-foreground leading-none">
                      {Math.round(data.weather.temp_c)}°C
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/80">{data.weather.label}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {data.weather.humidity_pct !== null && (
                      <span className="flex items-center gap-1 text-xs text-foreground/50">
                        <Droplets className="h-3 w-3" />
                        {data.weather.humidity_pct}%
                      </span>
                    )}
                    {data.weather.wind_kph !== null && (
                      <span className="flex items-center gap-1 text-xs text-foreground/50">
                        <Wind className="h-3 w-3" />
                        {Math.round(data.weather.wind_kph)} km/h
                      </span>
                    )}
                    {data.weather.feels_like_c !== null && (
                      <span className="flex items-center gap-1 text-xs text-foreground/50">
                        <Thermometer className="h-3 w-3" />
                        Feels {Math.round(data.weather.feels_like_c)}°
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3-day forecast */}
            {data.forecast.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {data.forecast.map((day) => (
                  <ForecastCard key={day.date} day={day} />
                ))}
              </div>
            )}

            {/* Status pills (mobile, below weather) */}
            <div className="flex flex-wrap gap-2 sm:hidden">
              <StatusPill label={trail.label} className={trail.className} />
              <StatusPill label={permit.label} className={permit.className} />
            </div>

            {/* Condition summary */}
            {data.condition_summary && (
              <div className="flex items-start gap-2.5 rounded-xl bg-foreground/[0.03] border border-foreground/8 px-4 py-3">
                <Info className="h-4 w-4 text-foreground/40 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/70 leading-relaxed">{data.condition_summary}</p>
              </div>
            )}

            {/* Permit notes */}
            {data.permit_notes && (
              <p className="text-xs text-foreground/50 leading-relaxed">
                <span className="font-medium text-foreground/60">Permit info: </span>
                {data.permit_notes}
              </p>
            )}

            {/* Last updated */}
            {data.last_updated_at && (
              <p className="text-[11px] text-foreground/30">
                Updated {new Date(data.last_updated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
