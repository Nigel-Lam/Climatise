import sqlite3

from datetime import datetime
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from scripts.data_collection import download_new_csvs, save_last_download_time
from scripts.preprocess import preprocess_all_stations
from data.schema import Observation


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],  # This is NOT insecure since we are ONLY serving climatise locally and NOT online (!)
    allow_credentials=True,
    allow_methods=['*'],  # "..."
    allow_headers=['*'],  # "..."
)

DB_PATH = "./data/victoria.db"

def refresh_data():
    print("Starting data refresh...")
    import os
    print("DB_PATH:", DB_PATH, "Exists:", os.path.exists(DB_PATH))

    download_new_csvs()  # your data_collection handles last_download internally

    df = preprocess_all_stations()
    if df.empty:
        print("No new data to process.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS victoria (
        station_name TEXT,
        date TEXT,
        evapo_transpiration REAL,
        rain REAL,
        pan_evaporation REAL,
        maximum_temperature REAL,
        minimum_temperature REAL,
        maximum_relative_humidity REAL,
        minimum_relative_humidity REAL,
        average_wind_speed REAL,
        solar_radiation REAL
    )
    """)

    inserted_count = 0
    for row in df.to_dict(orient="records"):
        try:
            obs = Observation(**row)
            cursor.execute("""
                INSERT OR IGNORE INTO victoria VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                obs.station_name,
                obs.date,
                obs.transpiration,
                obs.rain,
                obs.evaporation,
                obs.maximum_temperature,
                obs.minimum_temperature,
                obs.maximum_relative_humidity,
                obs.minimum_relative_humidity,
                obs.average_wind_speed,
                obs.solar_radiation
            ))
            inserted_count += 1
        except Exception as e:
            print(f"Validation failed for {row.get('Date')} at {row.get('Station Name')}: {e}")

    conn.commit()
    conn.close()
    print(f"Inserted {inserted_count} new records into SQLite.")

    save_last_download_time(datetime.now())
    print("Data refresh complete.")


@app.on_event("startup")
def startup_event():
    refresh_data()


@app.get('/api/stations')
def get_stations() -> list[str]:
    with sqlite3.connect(DB_PATH) as connection:
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
    with sqlite3.connect(DB_PATH) as connection:
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
