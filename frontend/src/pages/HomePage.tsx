import { NavBar } from "../components/NavBar";
import { WeatherStationFilter } from "../components/WeatherStationFilter";
import { WeatherStationFilterBoxes } from "../components/WeatherStationFilterBoxes.tsx";
import { DateRangePicker } from "../components/DateRangePicker";
import StationWeather from "./StationWeather.tsx";
import MultiStationWeatherCards from "./StationWeatherMulti.tsx";
import { VictoriaMap } from "../components/VictoriaMap.tsx";

const HomePage = () => {
  return (
    // Outer padding that everyone respects
    <div className="flex w-screen box-border p-4">
      <div className="flex flex-col flex-1">
        {/* NavBar */}
        <div className="mb-4">
          <NavBar />
        </div>

        {/* Main Content */}
        <div className="flex flex-1 gap-4">
          {/* Left: 2/3 width, split vertically in half */}
          <div className="flex basis-3/4 flex-col gap-4">
            <div className="flex-1 rounded-lg rounded-box border border-gray-300 p-4">
              <VictoriaMap />
            </div>
            <div className="flex-0 basis-1/4 rounded-lg rounded-box border border-gray-300 p-4">
              {/* <StationWeather /> */}
              <MultiStationWeatherCards />
            </div>
          </div>

          <div className="flex basis-1/3 flex-col gap-4">
            <div className="shrink-0 rounded-lg bg-white">
              <div className="p-2">
                <DateRangePicker />
              </div>
            </div>

            <div className="flex-1 rounded-lg">
                <WeatherStationFilterBoxes />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
