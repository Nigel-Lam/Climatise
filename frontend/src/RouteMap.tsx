import { BrowserRouter, Route, Routes } from "react-router-dom";
import StationWeather from "./pages/StationWeather";
import HomePage from "./HomePage";

function RouteMap() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/example" element={<StationWeather />} />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default RouteMap;
