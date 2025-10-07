import sqlite3

from datetime import datetime
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],  # This is NOT insecure since we are ONLY serving climatise locally and NOT online (!)
    allow_credentials=True,
    allow_methods=['*'],  # "..."
    allow_headers=['*'],  # "..."
)


@app.get('/api/stations')
def get_stations() -> list[str]:
    with sqlite3.connect('../data/victoria.db') as connection:
        results = connection.execute(
            '''
            SELECT DISTINCT station_name
            FROM "victoria.db"
            '''
        ).fetchall()

        return [
            station_name
            for station_name, # If there is only one column `sqlite3` needs you to unpack it with an extra comma.
            in results
        ]


@app.get("/api/weather")
def get_weather_by_station_name(
        station_name: str = Query(),  # Enforces that each of these are given as query parameters in the URL.
        earliest: datetime = Query(), # "..."
        latest: datetime = Query()    # "..."
) -> dict:
    with sqlite3.connect('../data/victoria.db') as connection:
        results = connection.execute(
            '''
            SELECT -- We can actually handle a lot of the manipulation at query-time:
                    COALESCE(ROUND(maximum_temperature, 1), 0.0) AS maximum_temperature,
                    COALESCE(ROUND(minimum_temperature, 1), 0.0) AS minimum_temperature,
                    COALESCE(ROUND(average_wind_speed, 1), 0.0) AS average_wind_speed,
                    COALESCE(ROUND(maximum_relative_humidity, 1), 0.0) AS maximum_relative_humidity,
                    COALESCE(ROUND(minimum_relative_humidity, 1), 0.0) AS minimum_relative_humidity
            FROM "victoria.db"
            WHERE UPPER(station_name) = UPPER(:station_name)
                AND (:earliest IS NULL OR date >= :earliest)
                AND (:latest IS NULL OR date <= :latest)
            ORDER BY date DESC
            ''',
            {
                'station_name': station_name,  # Personally, I prefer using named rather than positional parameters.
                'earliest': earliest.strftime("%Y-%m-%d %H:%M:%S"),
                'latest': latest.strftime("%Y-%m-%d %H:%M:%S"),
            }
        ).fetchall()

        print({
                'station_name': station_name,  # Personally, I prefer using named rather than positional parameters.
                'earliest': earliest.strftime("%Y-%m-%d %H:%M:%S"),
                'latest': latest.strftime("%Y-%m-%d %H:%M:%S"),
            })
        print(results)

        metrics = {
            'maximum_temperature': [],
            'minimum_temperature': [],
            'average_temperature': [],
            'average_humidity': [],
            'wind_speed': [],
        }

        for maximum_temperature, minimum_temperature, average_wind_speed, maximum_relative_humidity, minimum_relative_humidity in results:
            metrics['maximum_temperature'].append(maximum_temperature)
            metrics['minimum_temperature'].append(minimum_temperature)
            metrics['average_temperature'].append(round((maximum_temperature + minimum_temperature) / 2, 1))
            metrics['average_humidity'].append(round((maximum_relative_humidity + minimum_relative_humidity) / 2, 1))
            metrics['wind_speed'].append(average_wind_speed)

        return metrics
