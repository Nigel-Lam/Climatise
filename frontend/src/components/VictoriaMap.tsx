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
  const { earliest, latest, selectedStations } = useStationStore();
  const [mapData, setMapData] = useState<MapDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vegaContainerRef = useRef<HTMLDivElement>(null);
  const vegaViewRef = useRef<any>(null);
  const [regionData, setRegionData] = useState<any[]>([]);

  // Projection state so we can zoom/pan to a clicked station
  const [projectionCenter, setProjectionCenter] = useState<[number, number]>([145.1938, -36.2004]);
  const [projectionScale, setProjectionScale] = useState<number>(5500);

  // Calculate distance between two lat/lon points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Watch for station selection changes and zoom accordingly
  useEffect(() => {
    if (selectedStations.length === 1) {
      // Exactly one station selected - zoom to it
      const stationName = selectedStations[0];
      const coords = STATION_COORDS[stationName];
      if (coords) {
        console.log('Zooming to selected station:', stationName, 'at', coords.lon, coords.lat);
        setProjectionCenter([coords.lon, coords.lat]);
        setProjectionScale(15000);
      }
    } else {
      // Multiple stations or none - reset to full Victoria view
      console.log('Resetting to full Victoria view');
      setProjectionCenter([145.1938, -36.2004]);
      setProjectionScale(5500);
    }
  }, [selectedStations]);

  // Calculate regional temperature data when station data changes
  useEffect(() => {
    if (mapData.length === 0) {
      setRegionData([]);
      return;
    }

    // Fetch the GeoJSON to get actual region centroids
    fetch('https://raw.githubusercontent.com/Nigel-Lam/Climatise/refs/heads/main/geojson/SA3_2021_AUST_GDA2020.json')
      .then(res => res.json())
      .then(topoData => {
        // Parse TopoJSON and extract Victoria regions with their bounding boxes
        const regions: any[] = [];
        
        if (topoData.objects && topoData.objects.SA3_2021_AUST_GDA2020) {
          const geometries = topoData.objects.SA3_2021_AUST_GDA2020.geometries;
          
          // Log first few Victoria codes to debug
          const vicGeoms = geometries.filter((g: any) => g.properties?.STE_NAME21 === 'Victoria');
          console.log('Sample Victoria region codes:', vicGeoms.slice(0, 5).map((g: any) => ({
            code: g.properties.SA3_CODE21,
            name: g.properties.SA3_NAME21
          })));
          
          geometries.forEach((geom: any) => {
            if (geom.properties && geom.properties.STE_NAME21 === 'Victoria') {
              const code = geom.properties.SA3_CODE21;
              const name = geom.properties.SA3_NAME21;
              
              const regionTemp = calculateRegionTemperature(code, name);
              
              // Always add region even if temp is null - Vega will handle missing data
              regions.push({
                region_code: code,
                region_name: name,
                avg_temp: regionTemp !== null ? regionTemp : 15 // Use fallback temp of 15°C if calculation fails
              });
            }
          });
        }
        
        console.log('Region data sample:', regions.slice(0, 3));
        setRegionData(regions);
      })
      .catch(err => {
        console.error('Failed to fetch region data:', err);
        setRegionData([]);
      });
  }, [mapData]);

  // Calculate temperature for a region based on nearby stations
  const calculateRegionTemperature = (code: string, _name: string): number | null => {
    if (mapData.length === 0) return null;

    // Map of region codes to approximate centroids (lat, lon)
    const regionCentroids: Record<string, [number, number]> = {
      // Melbourne metro
      "20104": [-37.81, 144.96], "20601": [-37.82, 144.95], "20602": [-37.84, 144.98],
      "20603": [-37.85, 145.00], "20604": [-37.81, 145.00], "20605": [-37.79, 145.03],
      "20606": [-37.82, 145.05], "20607": [-37.83, 145.08], "20608": [-37.84, 145.12],
      "20609": [-37.82, 145.15], "20610": [-37.85, 145.16], "20611": [-37.88, 145.12],
      "20612": [-37.88, 145.20], "20613": [-37.81, 145.23], "20614": [-37.73, 145.35],
      "20615": [-37.89, 145.30], "20616": [-37.75, 145.45], "20617": [-37.97, 145.23],
      "20618": [-38.05, 145.28], "20619": [-38.13, 145.30], "20620": [-38.08, 145.40],
      "20621": [-38.14, 145.12], "20622": [-38.25, 145.15], "20623": [-38.35, 144.96],
      "20624": [-38.45, 145.05], "20625": [-37.90, 144.68], "20626": [-37.78, 144.85],
      "20627": [-37.75, 144.95], "20628": [-37.68, 144.90], "20629": [-37.70, 144.88],
      "20630": [-37.58, 144.72], "20631": [-37.68, 144.58], "20632": [-37.55, 144.45],
      
      // Regional Victoria
      "20101": [-38.15, 144.36], "20102": [-38.31, 144.33], "20103": [-38.40, 144.10],
      "20201": [-37.56, 143.85], "20202": [-37.42, 143.60], "20203": [-37.30, 143.20],
      "20301": [-36.76, 144.28], "20302": [-36.45, 144.15], "20303": [-36.85, 144.70],
      "20304": [-36.27, 143.35], "20401": [-36.38, 145.40], "20402": [-36.10, 145.30],
      "20403": [-36.43, 145.65], "20501": [-37.10, 147.60], "20502": [-36.86, 147.28],
      "20503": [-37.05, 147.13], "20504": [-36.10, 146.90], "20505": [-36.42, 146.31],
      "20506": [-36.10, 146.51], "20701": [-38.18, 146.42], "20702": [-37.92, 146.03],
      "20703": [-37.84, 146.27], "20704": [-37.90, 147.00], "20705": [-37.70, 148.00],
      "20706": [-37.89, 147.57], "20801": [-38.38, 142.48], "20802": [-38.08, 142.81],
      "20803": [-37.85, 142.35], "20804": [-38.32, 141.60], "20805": [-37.65, 142.06],
      "20806": [-37.70, 141.85], "20901": [-36.67, 142.17], "20902": [-37.07, 142.74],
      "20903": [-37.03, 141.30], "20904": [-36.32, 141.65], "21001": [-35.38, 143.53],
      "21002": [-34.24, 142.09], "21003": [-35.18, 142.50]
    };

    const centroid = regionCentroids[code];
    if (!centroid) {
      // Fallback: use average of all stations
      const avgTemp = mapData.reduce((sum, s) => sum + s.avg_temp, 0) / mapData.length;
      return Math.round(avgTemp * 10) / 10;
    }

    // Find 3 nearest stations using inverse distance weighting
    const stationsWithDist = mapData.map(station => ({
      ...station,
      distance: calculateDistance(centroid[0], centroid[1], station.lat, station.lon)
    })).sort((a, b) => a.distance - b.distance).slice(0, 3);

    if (stationsWithDist.length === 0) return null;

    let weightedSum = 0;
    let weightTotal = 0;

    stationsWithDist.forEach(station => {
      const weight = 1 / (station.distance + 0.1);
      weightedSum += station.avg_temp * weight;
      weightTotal += weight;
    });

    return weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 10) / 10 : null;
  };

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
    "$schema": "https://vega.github.io/schema/vega-lite/v6.4.1.json",
    "width": "container",
    "height": "container",
    "title": "Victorian Weather Stations - Average Temperature",
    
    "projection": {
      "type": "mercator",
      "center": [projectionCenter[0], projectionCenter[1]],
      "scale": projectionScale
    },

    "datasets": {
      "regionWeather": [],
      "stations": []
    },

    "layer": [
      // Victoria regions with interpolated temperature
      {
        "data": {
          "url": "https://raw.githubusercontent.com/Nigel-Lam/Climatise/refs/heads/main/geojson/SA3_2021_AUST_GDA2020.json",
          "format": { "type": "topojson", "feature": "SA3_2021_AUST_GDA2020" }
        },
        "transform": [
          { "filter": "datum.properties.STE_NAME21 === 'Victoria' " },
          {
            "lookup": "properties.SA3_CODE21",
            "from": {
              "data": { "name": "regionWeather" },
              "key": "region_code",
              "fields": ["avg_temp", "region_name"]
            }
          }
        ],
        "mark": { 
          "type": "geoshape",
          "stroke": "white",
          "strokeWidth": 0.5
        },
        "encoding": {
          "fill": {
            "field": "avg_temp",
            "type": "quantitative",
            "scale": {
              "scheme": "redblue",
              "reverse": true,
              "domain": [5, 35]
            },
            "legend": null
          },
          "tooltip": [
            { "field": "properties.SA3_NAME21", "type": "nominal", "title": "Region" },
            { "field": "avg_temp", "type": "quantitative", "title": "Est. Avg Temp (°C)", "format": ".1f" }
          ]
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
          "strokeWidth": 1.5,
          "cursor": "pointer"
        },
        "encoding": {
          "longitude": { "field": "lon", "type": "quantitative" },
          "latitude": { "field": "lat", "type": "quantitative" },
          "color": {
            "field": "avg_temp",
            "type": "quantitative",
            "scale": {
              "scheme": "redblue",
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
  }), [projectionCenter, projectionScale]);

  // Embed the Vega-Lite visualization when data changes
  useEffect(() => {
    // Clean up any previous embedded view before re-embedding
    if (vegaViewRef.current) {
      try {
        vegaViewRef.current.finalize();
      } catch {}
      vegaViewRef.current = null;
    }

    // Wait for both station data AND region data before embedding
    if (vegaContainerRef.current && mapData.length > 0 && regionData.length > 0) {
      console.log('Embedding with', regionData.length, 'regions. Sample:', regionData[0]);
      
      // Create a spec with datasets populated
      const specWithData = {
        ...vegaSpec,
        datasets: {
          regionWeather: regionData,
          stations: mapData
        }
      } as any;

      console.log('Spec with datasets:', specWithData.datasets);

      vegaEmbed(vegaContainerRef.current, specWithData, { actions: false })
        .then(res => {
          vegaViewRef.current = res.view;
          console.log('Vega successfully embedded with', regionData.length, 'regions and', mapData.length, 'stations');
        })
        .catch(err => {
          console.error("Vega-Embed error:", err);
          setError(err.message);
        });
    }

    return () => {
      if (vegaViewRef.current) {
        try {
          vegaViewRef.current.finalize();
        } catch {}
        vegaViewRef.current = null;
      }
    };
  }, [mapData, regionData, vegaSpec]);

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

  if (mapData.length > 0 && regionData.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
        Calculating regional temperatures...
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

