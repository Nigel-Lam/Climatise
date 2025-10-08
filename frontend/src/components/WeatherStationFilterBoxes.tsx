import { useEffect, useMemo, useState } from "react";
import { useStationStore } from "../store.ts";

export const WeatherStationFilterBoxes = () => {
  const [stations, setStations] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const { setSelectedStations } = useStationStore();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await fetch("http://127.0.0.1:8000/api/stations");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const results: string[] = await response.json();
        setStations(results ?? []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load stations");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Push selection to the store whenever it changes.
    useEffect(() => {
       setSelectedStations(selected);
    }, [selected, setSelectedStations]);

  const allSelected = useMemo(
    () => stations.length > 0 && selected.length === stations.length,
    [stations.length, selected.length]
  );

  const toggleOne = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.length === stations.length ? [] : stations));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <span className="loading loading-spinner loading-sm" />
        <span className="text-sm opacity-70">Loading stations…</span>
      </div>
    );
  }

  if (err) {
    return (
      <div className="alert alert-error">
        <span>Couldn’t load stations: {err}</span>
      </div>
    );
  }

  if (stations.length === 0) {
    return <div className="opacity-70">No stations found.</div>;
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center">
        <h2 className="text-lg font-semibold">Weather Station Filter</h2>
        <button className="btn btn-sm ml-4" onClick={() => setSelected([])}>
          Clear selection
        </button>
        <button className="btn btn-sm bg-amber-200 ml-2" onClick={() => setSelected(stations)}>
          Select all
        </button>
        <div className="badge ml-4 bg-blue-50">{selected.length} selected</div>
      </header>

      <fieldset className="border rounded-box border-black p-3 h-9/10">
        <legend className="px-1 text-sm opacity-95">
          Choose one or more stations
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-full overflow-auto pr-1">
          {stations.map((stationName) => {
            const id = `station-${stationName.replace(/\s+/g, "-")}`;
            const checked = selected.includes(stationName);
            return (
              <label
                key={stationName}
                htmlFor={id}
                className={`flex items-center gap-3 p-3 rounded-box border cursor-pointer transition bg-blue-50 hover:bg-blue-100
                  ${checked ? "border-primary ring-1 ring-primary/40" : "border-base-300 hover:border-base-200"}`}
              >
                <input
                  id={id}
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={checked}
                  onChange={() => toggleOne(stationName)}
                />
                <span className="truncate">{stationName}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
};
