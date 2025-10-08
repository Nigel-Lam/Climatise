import { NavBar } from "../components/NavBar";
import { WeatherStationFilter } from "../components/WeatherStationFilter";
import { DateRangePicker } from "../components/DateRangePicker";
import StationWeather from "./StationWeather.tsx";
import  { VictoriaMap }  from "../components/VictoriaMap.tsx";

const HomePage = () => {
  return (
    <div className="flex flex-col w-screen h-screen">
      {/* NavBar */}
      <div className="NavBar w-full">
        <NavBar />
      </div>

      {/* Main Content */}

      <div className="mainContentWrapper flex w-full h-full flex-1">
        <div className="vizColumn flex flex-col w-2/3 h-full">
          <div className="mainViz flex w-full h-4/6 p-2">
            <VictoriaMap/>
          </div>

          <div className="secondaryViz flex w-full h-2/6 p-2">
            <StationWeather/>
          </div>
        </div>

        <div className="filterColumn flex flex-col w-3/6 h-full">
          <div className="dateFilter flex w-full h-3/6 p-2 bg-white shrink mt-2">
            <DateRangePicker />
            {/* <span className="border-2 h-full w-full">Date Filter/Calender</span> */}
          </div>

          <div className="stationFilter flex w-full h-2/6 p-2">
            <span className="border-2 h-full w-full">
              Weather Station Filter <WeatherStationFilter />
            </span>
          </div>

          <div className="fillerSpace flex w-full h-1/6 p-2">
            <span className="border-2 h-full w-full">Filler Space</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
