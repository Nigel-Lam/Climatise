import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStationStore } from "../store";

type ApiSeries = Record<string, Array<number | null> | undefined>;
type Series = Record<string, number[]>;
type StationSeries = Record<string, Series>;
type StationErrors = Record<string, string | null>;
type StationLoading = Record<string, boolean>;

function normalizeSeries(api: ApiSeries): Series {
  const out: Series = {};
  const solar = api["solar_radiation"] ?? api["solar_raditation"];
  if (Array.isArray(solar)) out["solar_radiation"] = solar.map((v) => v ?? NaN);
  for (const [key, arr] of Object.entries(api)) {
    if (key === "solar_radiation" || key === "solar_raditation") continue;
    if (Array.isArray(arr)) out[key] = arr.map((v) => v ?? NaN);
  }
  return out;
}

function prettyName(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
function formatValue(name: string, v: number) {
  if (!Number.isFinite(v)) return "–";
  if (/humidity/i.test(name)) return `${v.toFixed(1)}%`;
  if (/temperature/i.test(name)) return `${v.toFixed(1)}°`;
  if (/wind/i.test(name)) return `${v.toFixed(1)} m/s`;
  if (/solar/i.test(name)) return `${v.toFixed(1)} W/m²`;
  return v.toFixed(1);
}

function Sparkline({
  data,
  height = 40,
  strokeWidth = 2,
}: {
  data: number[];
  height?: number;
  strokeWidth?: number;
}) {
  const clean = React.useMemo(() => data.filter(Number.isFinite) as number[], [data]);
  const W = 100;
  const H = height;
  if (clean.length === 0) {
    return <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }} />;
  }
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const stepX = clean.length > 1 ? W / (clean.length - 1) : 0;
  const points = clean
    .map((v, i) => {
      const x = clean.length > 1 ? i * stepX : W;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .join(" ");
  const lastX = clean.length > 1 ? (clean.length - 1) * stepX : W;
  const lastY = H - ((clean.at(-1)! - min) / range) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }} preserveAspectRatio="none">
      <polyline fill="none" stroke="currentColor" strokeWidth={strokeWidth} points={points} vectorEffect="non-scaling-stroke" />
      <circle cx={lastX} cy={lastY} r={3} fill="currentColor" />
    </svg>
  );
}

function MetricCard({ name, values, color }: { name: string; values: number[]; color: string }) {
  const clean = values.filter(Number.isFinite) as number[];
  const last = clean.at(-1);
  const first = clean[0];
  const min = clean.length ? Math.min(...clean) : NaN;
  const max = clean.length ? Math.max(...clean) : NaN;
  const delta = (last ?? NaN) - (first ?? NaN);

  return (
    <div
      style={{
        border: "1px solid #e6e6e6",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, color: "#666" }}>{prettyName(name)}</div>
        <div
          style={{
            fontSize: 12,
            color: Number.isFinite(delta) ? (delta > 0 ? "#16a34a" : delta < 0 ? "#dc2626" : "#666") : "#666",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Number.isFinite(delta) && (delta > 0 ? "▲ " : delta < 0 ? "▼ " : "• ")}
          {Number.isFinite(delta) ? formatValue(name, Math.abs(delta)) : "–"}
        </div>
      </div>

      <div style={{ color }}>
        <Sparkline data={values} />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#555",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>
          Now: <strong style={{ color: "#111" }}>{last != null ? formatValue(name, last) : "–"}</strong>
        </span>
        <span>Min: {formatValue(name, min)}</span>
        <span>Max: {formatValue(name, max)}</span>
      </div>
    </div>
  );
}

// Multi-line SVG sparkline for overlaying multiple stations on the same metric
function MultiSparkline({
  seriesByStation,
  metric,
  stationOrder,
  colors,
  height = 48,
  strokeWidth = 2,
}: {
  seriesByStation: StationSeries;
  metric: string;
  stationOrder: string[];
  colors: string[];
  height?: number;
  strokeWidth?: number;
}) {
  const W = 100;
  const H = height;

  const { min, max, maxLen } = useMemo(() => {
    let globalMin = Number.POSITIVE_INFINITY;
    let globalMax = Number.NEGATIVE_INFINITY;
    let globalMaxLen = 0;
    for (const station of stationOrder) {
      const arr = seriesByStation[station]?.[metric] ?? [];
      const clean = (arr || []).filter(Number.isFinite) as number[];
      if (clean.length) {
        const localMin = Math.min(...clean);
        const localMax = Math.max(...clean);
        if (localMin < globalMin) globalMin = localMin;
        if (localMax > globalMax) globalMax = localMax;
      }
      if (arr && arr.length > globalMaxLen) globalMaxLen = arr.length;
    }
    if (!Number.isFinite(globalMin)) globalMin = 0;
    if (!Number.isFinite(globalMax)) globalMax = 1;
    if (globalMax === globalMin) globalMax = globalMin + 1;
    return { min: globalMin, max: globalMax, maxLen: globalMaxLen };
  }, [seriesByStation, metric, stationOrder]);

  const range = max - min || 1;
  const stepX = maxLen > 1 ? W / (maxLen - 1) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }} preserveAspectRatio="none">
      {stationOrder.map((station, idx) => {
        const arr = seriesByStation[station]?.[metric] ?? [];
        if (!arr || arr.length === 0) return null;
        const points = arr
          .map((v, i) => {
            if (!Number.isFinite(v)) return null;
            const x = maxLen > 1 ? i * stepX : W;
            const y = H - (((v as number) - min) / range) * H;
            return `${x},${y}`;
          })
          .filter(Boolean)
          .join(" ");
        if (!points) return null;
        return (
          <polyline
            key={station}
            fill="none"
            stroke={colors[idx % colors.length]}
            strokeWidth={strokeWidth}
            points={points}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

function MultiMetricCard({
  metric,
  seriesByStation,
  stationOrder,
  colors,
}: {
  metric: string;
  seriesByStation: StationSeries;
  stationOrder: string[];
  colors: string[];
}) {
  const legend = useMemo(() => {
    return stationOrder.map((station) => {
      const arr = seriesByStation[station]?.[metric] ?? [];
      const clean = (arr || []).filter(Number.isFinite) as number[];
      const last = clean.at(-1);
      return { station, last };
    });
  }, [seriesByStation, metric, stationOrder]);

  return (
    <div
      style={{
        border: "1px solid #e6e6e6",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: "#666" }}>{prettyName(metric)}</div>
      </div>

      <MultiSparkline seriesByStation={seriesByStation} metric={metric} stationOrder={stationOrder} colors={colors} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
        {legend.map(({ station, last }, i) => (
          <div key={station} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555" }}>
            <span style={{ width: 10, height: 10, background: colors[i % colors.length], borderRadius: 2, display: "inline-block" }} />
            <span title={station} style={{ maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{station}</span>
            <span style={{ color: "#333" }}>{last != null ? formatValue(metric, last) : "–"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Combine multiple stations' series into a single Series by averaging per index (ignoring NaN). */
function combineStationSeries(seriesByStation: StationSeries): Series {
  const combined: Series = {};
  // Collect all metric keys across stations
  const keys = new Set<string>();
  for (const station of Object.values(seriesByStation)) {
    for (const k of Object.keys(station)) keys.add(k);
  }

  for (const key of keys) {
    // determine max length among stations for this metric
    let maxLen = 0;
    for (const st of Object.values(seriesByStation)) {
      const arr = st[key];
      if (arr && arr.length > maxLen) maxLen = arr.length;
    }
    const outArr = new Array<number>(maxLen).fill(NaN);

    for (let i = 0; i < maxLen; i++) {
      let sum = 0;
      let count = 0;
      for (const st of Object.values(seriesByStation)) {
        const arr = st[key];
        const v = arr?.[i];
        if (Number.isFinite(v)) {
          sum += v as number;
          count++;
        }
      }
      outArr[i] = count > 0 ? sum / count : NaN;
    }
    combined[key] = outArr;
  }
  return combined;
}

// --- Main (Combined) ---
export default function MultiStationWeatherCards() {
  const { selectedStations, earliest, latest } = useStationStore();
  const [seriesByStation, setSeriesByStation] = useState<StationSeries>({});
  const [loadingByStation, setLoadingByStation] = useState<StationLoading>({});
  const [errorByStation, setErrorByStation] = useState<StationErrors>({});

  const genRef = useRef(0);

  useEffect(() => {
    const toDate = (d: any) => (d instanceof Date ? d : d ? new Date(d) : null);
    const e = toDate(earliest);
    const l = toDate(latest);

    if (!e || !l || !selectedStations?.length) {
      setSeriesByStation({});
      setLoadingByStation({});
      setErrorByStation({});
      return;
    }

    let cancelled = false;
    const myGen = ++genRef.current;

    const nextLoading: StationLoading = {};
    const nextErrors: StationErrors = {};
    for (const st of selectedStations) {
      nextLoading[st] = true;
      nextErrors[st] = null;
    }
    setLoadingByStation(nextLoading);
    setErrorByStation(nextErrors);

    (async () => {
      const results: StationSeries = {};
      await Promise.all(
        selectedStations.map(async (stationName) => {
          try {
            const params = new URLSearchParams();
            params.set("station_name", stationName.trim());
            params.set("earliest", e.toISOString());
            params.set("latest", l.toISOString());

            const res = await fetch(`http://127.0.0.1:8000/api/weather?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const apiJson: ApiSeries = await res.json();
            results[stationName] = normalizeSeries(apiJson);
          } catch (err) {
            results[stationName] = {};
            nextErrors[stationName] = err instanceof Error ? err.message : String(err);
          } finally {
            nextLoading[stationName] = false;
          }
        })
      );

      if (cancelled || myGen !== genRef.current) return;
      setSeriesByStation(results);
      setLoadingByStation({ ...nextLoading });
      setErrorByStation({ ...nextErrors });
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedStations, earliest, latest]);

  const palette = ["#4b7bec", "#20bf6b", "#fa8231", "#a55eea", "#fd9644", "#10b981", "#ef4444"];

  const stationsToRender = useMemo(
    () => (selectedStations ?? []).filter((s) => s && s.trim().length > 0),
    [selectedStations]
  );

  // Build the combined series (for >3 stations)
  const combinedSeries = useMemo<Series>(() => combineStationSeries(seriesByStation), [seriesByStation]);

  // Metric keys across selected stations (for ≤3 stations)
  const metricKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const station of Object.values(seriesByStation)) {
      for (const k of Object.keys(station)) keys.add(k);
    }
    return Array.from(keys).sort();
  }, [seriesByStation]);

  const anyLoading = Object.values(loadingByStation).some(Boolean);
  const errorCount = Object.values(errorByStation).filter(Boolean).length;
  const contributing = Object.values(seriesByStation).filter((s) => Object.keys(s).length > 0).length;

  if (!stationsToRender.length) return <div style={{ padding: 24 }}>Choose one or more stations to see data.</div>;
  if (!earliest || !latest) return <div style={{ padding: 24 }}>Pick a date range to see data.</div>;

  const entries = Object.entries(combinedSeries);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ margin: "0 0 4px" }}>
        {stationsToRender.length <= 3
          ? `Weather Summary — Multiple Stations (${stationsToRender.length})`
          : `Weather Summary — Combined (${stationsToRender.length} stations)`}
      </h2>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
        Range: {new Date(earliest as any).toISOString()} → {new Date(latest as any).toISOString()}
      </div>

      <div style={{ fontSize: 12, color: "#666" }}>
        {anyLoading && <span>Loading data… </span>}
        {!anyLoading && (
          <>
            <span>Contributing stations: {contributing}/{stationsToRender.length}</span>
            {errorCount > 0 && (
              <span style={{ color: "crimson" }}> — {errorCount} fetch error{errorCount > 1 ? "s" : ""}</span>
            )}
          </>
        )}
      </div>

      {stationsToRender.length <= 3 ? (
        <>
          {metricKeys.length === 0 && !anyLoading && (
            <div style={{ padding: 12, color: "#555" }}>No data available.</div>
          )}
          {metricKeys.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              {metricKeys.map((metric) => (
                <MultiMetricCard
                  key={metric}
                  metric={metric}
                  seriesByStation={seriesByStation}
                  stationOrder={stationsToRender}
                  colors={palette}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {entries.length === 0 && !anyLoading && (
            <div style={{ padding: 12, color: "#555" }}>No combined data available.</div>
          )}
          {entries.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              {entries.map(([name, values], i) => (
                <MetricCard key={name} name={name} values={values} color={palette[i % palette.length]} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
