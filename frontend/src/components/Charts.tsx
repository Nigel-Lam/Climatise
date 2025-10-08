import { useEffect, useRef } from "react";
import embed from "vega-embed";
import type { VisualizationSpec } from "vega-embed";

interface VegaLiteChartProps {
  name: string;
  values: number[];
}

export default function VegaLiteChart({ name, values }: VegaLiteChartProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = "";

    const cleaned = values
    .map((v, i) => ({ x: i, y: Number.isFinite(v) ? v : null }))
    .filter(d => d.y !== null);

    const maxPoints = 100;
    const step = Math.ceil(cleaned.length / maxPoints);
    const downsampled = cleaned.filter((_, i) => i % step === 0);

    const spec: VisualizationSpec = {
      width: "container",
      height: 100,
      data: { values: downsampled },
      mark: { type: "line", point: false, tooltip: true, interpolate: "monotone"},
      encoding: {
        x: { field: "x", type: "quantitative", axis: null },
        y: { field: "y", type: "quantitative",  axis: { title: null } }
        
      },
      config: {
        axis: { labelFontSize: 10, titleFontSize: 12 },
        view: { stroke: "transparent" },
      },
    };

    embed(ref.current, spec)
      .then(() => {
        console.log("Chart rendered for:", name);
      })
      .catch(err => {
        console.error("Vega embed error:", err);
      });
  }, [name, values]);

  return (
  <div
    ref={ref}
    style={{
      minHeight: 120,
      width: "100%",
      overflow: "visible",
    }}
  />);
}