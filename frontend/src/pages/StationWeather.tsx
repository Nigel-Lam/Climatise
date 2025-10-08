import React, { useEffect, useMemo, useState } from "react";
import { useStationStore } from "../store";
import VegaLiteChart from "../components/Charts";


type ApiSeries = Record<string, Array<number | null> | undefined>;
type Series = Record<string, number[]>; // normalized to numbers (NaN for missing)

function normalizeSeries(api: ApiSeries): Series {
  const out: Series = {};

  const solar =
    api["solar_radiation"] ?? api["solar_raditation"];
  if (Array.isArray(solar)) {
    out["solar_radiation"] = solar.map(v => (v ?? NaN));
  }

  for (const [key, arr] of Object.entries(api)) {
    if (key === "solar_radiation" || key === "solar_raditation") continue;
    if (Array.isArray(arr)) {
      out[key] = arr.map(v => (v ?? NaN));
    }
  }
  return out;
}

function prettyName(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
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

  // ViewBox units (width is normalized so we can use width:100%)
  const W = 100;
  const H = height;

  if (clean.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: H, display: "block" }}
      />
    );
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const stepX = clean.length > 1 ? W / (clean.length - 1) : 0;

  const points = clean
    .map((v, i) => {
      const x = clean.length > 1 ? i * stepX : W; // single point -> right edge
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .join(" ");

  const lastX = clean.length > 1 ? (clean.length - 1) * stepX : W;
  const lastY = H - ((clean.at(-1)! - min) / range) * H;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: H, display: "block" }}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        points={points}
        vectorEffect="non-scaling-stroke"
      />
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
    <div style={{
      border: "1px solid #e6e6e6", borderRadius: 12, padding: 16,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)", background: "#fff",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, color: "#666" }}>{prettyName(name)}</div>
        <div style={{
          fontSize: 12,
          color: delta > 0 ? "#16a34a" : delta < 0 ? "#dc2626" : "#666",
          fontVariantNumeric: "tabular-nums",
        }}>
          {Number.isFinite(delta) && (delta > 0 ? "▲ " : delta < 0 ? "▼ " : "• ")}
          {Number.isFinite(delta) ? formatValue(name, Math.abs(delta)) : "–"}
        </div>
      </div>

      <div style={{ color }}>
        <VegaLiteChart name={name} values={values}/>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555", fontVariantNumeric: "tabular-nums" }}>
        <span>Now: <strong style={{ color: "#111" }}>{last != null ? formatValue(name, last) : "–"}</strong></span>
        <span>Min: {formatValue(name, min)}</span>
        <span>Max: {formatValue(name, max)}</span>
      </div>
    </div>
  );
}

// --- Main: uses zustand deps + fetches wide JSON ---
export default function StationWeatherCards() {
  const { stationName, earliest, latest } = useStationStore();
  const [series, setSeries] = useState<Series>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stationName?.trim() || !earliest || !latest) {
      setSeries({});
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("station_name", stationName.trim());
        params.set("earliest", earliest.toISOString());
        params.set("latest", latest.toISOString());

        const res = await fetch(`http://127.0.0.1:8000/api/weather?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const apiJson: ApiSeries = await res.json(); // <-- wide object
        const normalized = normalizeSeries(apiJson);
        if (!cancelled) setSeries(normalized);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setSeries({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [stationName, earliest, latest]); // zustand deps

  const palette = ["#4b7bec", "#20bf6b", "#fa8231", "#a55eea", "#fd9644", "#10b981", "#ef4444"];
  const entries = useMemo(() => Object.entries(series), [series]);

  if (!stationName?.trim()) return <div style={{ padding: 24 }}>Choose a station to see data.</div>;
  if (!earliest || !latest) return <div style={{ padding: 24 }}>Pick a date range to see data.</div>;
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;
  if (entries.length === 0) return <div style={{ padding: 24 }}>No data.</div>;

  return (
    <div style={{width:'100%', height:'100%'}}>
      <h2 style={{ margin: "0 0 12px" }}>Weather Summary — {stationName}</h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
        gap: 16,
      }}>
        {entries.map(([name, values], i) => (
          <MetricCard key={name} name={name} values={values} color={palette[i % palette.length]} />
        ))}
      </div>
    </div>
  );
}
