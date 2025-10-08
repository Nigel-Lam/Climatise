import { useEffect, useState, useMemo, useRef } from "react";
import vegaEmbed from "vega-embed";
import { useStationStore } from "../store";

// Type for our map data points
type MapDataPoint = {
  station: string;
  lat: number;
  lon: number;
  max_temp: number;
  min_temp: number;
  avg_temp: number;
  avg_humidity: number;
  wind_speed: number;
};

// Station coordinates - hardcoded for now
const STATION_COORDS: Record<string, { lat: number; lon: number }> = {
  "AIREYS INLET": { lat: -38.46, lon: 144.09 },
  "AVALON AIRPORT": { lat: -38.04, lon: 144.47 },
  "BAIRNSDALE AIRPORT": { lat: -37.89, lon: 147.57 },
  "BALLARAT AERODROME": { lat: -37.52, lon: 143.79 },
  "BENDIGO AIRPORT": { lat: -36.74, lon: 144.33 },
  "BREAKWATER (GEELONG RACECOURSE)": { lat: -38.15, lon: 144.36 },
  "CAPE NELSON LIGHTHOUSE": { lat: -38.42, lon: 141.59 },
  "CAPE OTWAY LIGHTHOUSE": { lat: -38.86, lon: 143.51 },
  "CASTERTON": { lat: -37.59, lon: 141.40 },
  "CERBERUS": { lat: -38.36, lon: 145.18 },
  "CHARLTON": { lat: -36.27, lon: 143.35 },
  "COLAC (MOUNT GELLIBRAND)": { lat: -38.33, lon: 143.58 },
  "COLDSTREAM": { lat: -37.73, lon: 145.40 },
  "EDENHOPE AIRPORT": { lat: -37.03, lon: 141.30 },
  "EILDON FIRE TOWER": { lat: -37.23, lon: 145.91 },
  "ESSENDON AIRPORT": { lat: -37.73, lon: 144.90 },
  "FALLS CREEK": { lat: -36.86, lon: 147.28 },
  "FERNY CREEK": { lat: -37.89, lon: 145.35 },
  "FRANKSTON (BALLAM PARK)": { lat: -38.16, lon: 145.15 },
  "GABO ISLAND LIGHTHOUSE": { lat: -37.57, lon: 149.91 },
  "HAMILTON AIRPORT": { lat: -37.65, lon: 142.06 },
  "HORSHAM AERODROME": { lat: -36.67, lon: 142.17 },
  "LAVERTON RAAF": { lat: -37.86, lon: 144.75 },
  "LONGERENONG": { lat: -36.67, lon: 142.30 },
  "MALLACOOTA": { lat: -37.60, lon: 149.75 },
  "MANGALORE AIRPORT": { lat: -36.88, lon: 145.18 },
  "MELBOURNE (OLYMPIC PARK)": { lat: -37.83, lon: 144.98 },
  "MELBOURNE AIRPORT": { lat: -37.67, lon: 144.83 },
  "MILDURA AIRPORT": { lat: -34.24, lon: 142.09 },
  "MOORABBIN AIRPORT": { lat: -37.98, lon: 145.10 },
  "MORTLAKE RACECOURSE": { lat: -38.08, lon: 142.81 },
  "MORWELL (LATROBE VALLEY AIRPORT)": { lat: -38.21, lon: 146.47 },
  "MOUNT BAW BAW": { lat: -37.84, lon: 146.27 },
  "MOUNT BULLER": { lat: -37.15, lon: 146.43 },
  "MOUNT HOTHAM": { lat: -37.05, lon: 147.13 },
  "NHILL AERODROME": { lat: -36.32, lon: 141.65 },
  "OMEO": { lat: -37.10, lon: 147.60 },
  "ORBOST": { lat: -37.70, lon: 148.46 },
  "POINT COOK RAAF": { lat: -37.93, lon: 144.75 },
  "PORTLAND AIRPORT": { lat: -38.32, lon: 141.47 },
  "PORT FAIRY": { lat: -38.39, lon: 142.23 },
  "RUTHERGLEN RESEARCH": { lat: -36.10, lon: 146.51 },
  "SCORESBY RESEARCH INSTITUTE": { lat: -37.90, lon: 145.23 },
  "SHEPPARTON AIRPORT": { lat: -36.43, lon: 145.39 },
  "STAWELL AERODROME": { lat: -37.07, lon: 142.74 },
  "SWAN HILL AERODROME": { lat: -35.38, lon: 143.53 },
  "WANGARATTA AERO": { lat: -36.42, lon: 146.31 },
  "WARRNAMBOOL AIRPORT NDB": { lat: -38.30, lon: 142.45 },
  "WILSONS PROMONTORY LIGHTHOUSE": { lat: -39.13, lon: 146.42 },
  "YARRAWONGA": { lat: -36.03, lon: 146.00 }
};

export function VictoriaMap() {
  const { earliest, latest } = useStationStore();
  const [mapData, setMapData] = useState<MapDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vegaContainerRef = useRef<HTMLDivElement>(null);

  // Fetch data whenever dates change (same pattern as StationWeather.tsx)
  useEffect(() => {
    if (!earliest || !latest) {
      setMapData([]);
      setError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      
      try {
        const allData: MapDataPoint[] = [];
        
        // Fetch data for each station
        for (const [stationName, coords] of Object.entries(STATION_COORDS)) {
          if (cancelled) break;
          
          try {
            const params = new URLSearchParams();
            params.set("station_name", stationName);
            params.set("earliest", earliest.toISOString());
            params.set("latest", latest.toISOString());

            const res = await fetch(`http://127.0.0.1:8000/api/weather?${params.toString()}`);
            
            if (res.ok) {
              const data = await res.json();
              
              // Get the most recent values (last in array)
              const maxTempArray = data.maximum_temperature || [];
              const minTempArray = data.minimum_temperature || [];
              const avgTempArray = data.average_temperature || [];
              const avgHumidityArray = data.average_humidity || [];
              const windSpeedArray = data.wind_speed || [];
              
              // Use last value (most recent)
              const maxTemp = maxTempArray[0] ?? 0;
              const minTemp = minTempArray[0] ?? 0;
              const avgTemp = avgTempArray[0] ?? 0;
              const avgHumidity = avgHumidityArray[0] ?? 0;
              const windSpeed = windSpeedArray[0] ?? 0;
              
              allData.push({
                station: stationName,
                lat: coords.lat,
                lon: coords.lon,
                max_temp: maxTemp,
                min_temp: minTemp,
                avg_temp: avgTemp,
                avg_humidity: avgHumidity,
                wind_speed: windSpeed
              });
            }
          } catch (err) {
            console.warn(`Failed to fetch data for ${stationName}:`, err);
            // Continue with other stations
          }
        }
        
        if (!cancelled) {
          setMapData(allData);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setMapData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [earliest, latest]);

  // Vega-Lite specification
  const vegaSpec = useMemo(() => ({
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "width": 700,
    "height": 500,
    "title": "Victorian Weather Stations - Average Temperature",
    
    "projection": {
      "type": "mercator",
      "center": [145.1938, -36.2004],
      "scale": 3750
    },

    "layer": [
      // Background map of Victoria
      {
        "data": {
          "url": "https://raw.githubusercontent.com/Nigel-Lam/Climatise/refs/heads/main/geojson/SA3_2021_AUST_GDA2020.json",
          "format": { "type": "topojson", "feature": "SA3_2021_AUST_GDA2020" }
        },
        "transform": [
          { "filter": "datum.properties.STE_NAME21 === 'Victoria' " }
        ],
        "mark": { 
          "type": "geoshape", 
          "fill": "#e8e8e8", 
          "stroke": "white",
          "strokeWidth": 0.5
        }
      },

      // Weather station points
      {
        "data": { "name": "stations" },
        "mark": {
          "type": "circle",
          "size": 150,
          "opacity": 0.85,
          "stroke": "white",
          "strokeWidth": 1.5
        },
        "encoding": {
          "longitude": { "field": "lon", "type": "quantitative" },
          "latitude": { "field": "lat", "type": "quantitative" },
          "color": {
            "field": "avg_temp",
            "type": "quantitative",
            "scale": {
              "scheme": "redyellowblue",
              "reverse": true,
              "domain": [5, 35]
            },
            "title": "Avg Temp (°C)"
          },
          "tooltip": [
            { "field": "station", "type": "nominal", "title": "Station" },
            { "field": "avg_temp", "type": "quantitative", "title": "Avg Temp (°C)", "format": ".1f" },
            { "field": "max_temp", "type": "quantitative", "title": "Max Temp (°C)", "format": ".1f" },
            { "field": "min_temp", "type": "quantitative", "title": "Min Temp (°C)", "format": ".1f" },
            { "field": "avg_humidity", "type": "quantitative", "title": "Avg Humidity (%)", "format": ".1f" },
            { "field": "wind_speed", "type": "quantitative", "title": "Wind Speed (m/s)", "format": ".1f" }
          ]
        }
      }
    ]
  }), []);

  // Embed the Vega-Lite visualization when data changes
  useEffect(() => {
    if (vegaContainerRef.current && mapData.length > 0) {
      // Create a spec with inline data
      const specWithData = {
        ...vegaSpec,
        layer: vegaSpec.layer.map((layer: any) => {
          if (layer.data && layer.data.name === "stations") {
            return {
              ...layer,
              data: { values: mapData }
            };
          }
          return layer;
        })
      };

      vegaEmbed(vegaContainerRef.current, specWithData, { actions: false })
        .catch(err => {
          console.error("Vega-Embed error:", err);
          setError(err.message);
        });
    }
  }, [mapData, vegaSpec]);

  // Render states (same pattern as StationWeather.tsx)
  if (!earliest || !latest) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
        Pick a date range to see the weather map
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
        Loading weather data for {Object.keys(STATION_COORDS).length} stations...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: "crimson" }}>
        Error loading map: {error}
      </div>
    );
  }

  if (mapData.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
        No weather data available for the selected date range
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div ref={vegaContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

