import { useState } from "react";

type ApiRow = {
  index: number;
  station_name: string;
  date: string; // "YYYY-MM-DD HH:mm:ss"
  transpiration: number | null;
  rain: number | null;
  evaporation: number | null;
  maximum_temperature: number | null;
  minimum_temperature: number | null;
  maximum_relative_humidity: number | null;
  minimum_relative_humidity: number | null;
  average_wind_speed: number | null;
  // backend has a typo "solar_raditation"
  solar_raditation?: number | null;
  solar_radiation?: number | null; // in case you fix it later
};

type UiRow = {
  key: string;
  ts: string;
  transpiration: number | null;
  rain: number | null;
  evaporation: number | null;
  maxTemp: number | null;
  minTemp: number | null;
  maxRH: number | null;
  minRH: number | null;
  wind: number | null;
  solar: number | null;
};

function toUiRow(r: ApiRow): UiRow {
  return {
    key: String(r.index ?? `${r.station_name}-${r.date}`),
    ts: r.date,
    transpiration: r.transpiration ?? null,
    rain: r.rain ?? null,
    evaporation: r.evaporation ?? null,
    maxTemp: r.maximum_temperature ?? null,
    minTemp: r.minimum_temperature ?? null,
    maxRH: r.maximum_relative_humidity ?? null,
    minRH: r.minimum_relative_humidity ?? null,
    wind: r.average_wind_speed ?? null,
    solar: (r.solar_radiation ?? r.solar_raditation) ?? null, // handle typo
  };
}

export default function StationWeather() {
  const [station, setStation] = useState("");
  const [rows, setRows] = useState<UiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    if (!station.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather/${encodeURIComponent(station.trim())}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiRow[] = await res.json();
      setRows(data.map(toUiRow));
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Weather Lookup</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchData();
        }}
        style={{ marginBottom: 12 }}
      >
        <input
          value={station}
          onChange={(e) => setStation(e.target.value)}
          placeholder="Enter station name (e.g., AVALON AIRPORT)"
          style={{ marginRight: 8, width: 320 }}
        />
        <button type="submit" disabled={loading}>Fetch</button>
      </form>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {rows.length > 0 && (
        <table border={1} cellPadding={6} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Transpiration (mm)</th>
              <th>Rain (mm)</th>
              <th>Evaporation (mm)</th>
              <th>Max Temp (°C)</th>
              <th>Min Temp (°C)</th>
              <th>Max RH (%)</th>
              <th>Min RH (%)</th>
              <th>Wind (m/s)</th>
              <th>Solar (MJ/m²)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>{r.ts}</td>
                <td>{r.transpiration ?? "-"}</td>
                <td>{r.rain ?? "-"}</td>
                <td>{r.evaporation ?? "-"}</td>
                <td>{r.maxTemp ?? "-"}</td>
                <td>{r.minTemp ?? "-"}</td>
                <td>{r.maxRH ?? "-"}</td>
                <td>{r.minRH ?? "-"}</td>
                <td>{r.wind ?? "-"}</td>
                <td>{r.solar ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && rows.length === 0 && (
        <p>Type a station name and click Fetch.</p>
      )}
    </div>
  );
}
