import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import RouteMap from "./RouteMap";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouteMap />
  </StrictMode>
);
