from pydantic import BaseModel, Field

class Observation(BaseModel):
    station_name: str = Field(..., alias='Station Name')
    date: str = Field(..., alias='Date')
    transpiration: float = Field(..., alias='Evapo- Transpiration 0000-2400 (mm)')
    rain: float = Field(..., alias='Rain 0900-0900 (mm)')
    evaporation: float = Field(..., alias='Pan Evaporation 0900-0900 (mm)')
    maximum_temperature: float = Field(..., alias='Maximum Temperature (°C)')
    minimum_temperature: float = Field(..., alias='Minimum Temperature (°C)')
    maximum_relative_humidity: float = Field(..., alias='Maximum Relative Humidity (%)')
    minimum_relative_humidity: float = Field(..., alias='Minimum Relative Humidity (%)')
    average_wind_speed: float = Field(..., alias='Average 10m Wind Speed (m/sec)')
    solar_radiation: float = Field(..., alias='Solar Radiation (MJ/sq m)')
