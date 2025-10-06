import requests
import json
import sys



def metrics(station_name):

    BASE_URL = "http://localhost:3001"

    url = f"{BASE_URL}/api/weather/{station_name}"

    try:
        response = requests.get(url)
        response.raise_for_status() 
    except requests.exceptions.RequestException as e:
        print(f"Error calling backend: {e}")
        exit(1)

    data = response.json()

    if not data:
        print(f"Error: No data found for station '{station_name}'")
        return None

    max_temps = []
    min_temps = []
    daily_averages = []
    daily_wind = []
    daily_average_humidity = []


    for row in data:
        max_temp = row.get("maximum_temperature")
        min_temp = row.get("minimum_temperature")
        wind_speed = row.get("average_wind_speed")
        max_humidity = row.get("maximum_relative_humidity")
        min_humidity = row.get("minimum_relative_humidity")

        if max_temp is not None:
            max_temps.append(round(max_temp, 1))
        if min_temp is not None:
            min_temps.append(round(min_temp, 1))

        if max_temp is not None and min_temp is not None:
            daily_averages.append(round((max_temp + min_temp) / 2, 1))
        
        if wind_speed is not None:
            daily_wind.append(round(wind_speed, 1))

        if max_humidity is not None and min_humidity is not None:
            daily_average_humidity.append(round((max_humidity + min_humidity) / 2, 1))


    result_data = {
        "metrics": {
            "Max Temp": round(max(max_temps), 1),
            "Min Temp": round(min(min_temps), 1),
            "Average Temperature": round(sum(daily_averages) / len(daily_averages), 1),
            "Average Wind Speed": round(sum(daily_wind) / len(daily_wind), 1),
            "Average Humidity": round(sum(daily_average_humidity) / len(daily_average_humidity), 1),
            "Days Counted": len(daily_averages)
        },
        "raw_data": {
            "Max Temps": max_temps,
            "Min Temps": min_temps,
            "Daily Averages": daily_averages,
            "Daily Wind": daily_wind,
            "Daily Humidity": daily_average_humidity
            }
    }
    return result_data


if __name__ == "__main__":
    import sys
    station_name = sys.argv[1] if len(sys.argv) > 1 else None
    if not station_name:
        print(json.dumps({"error": "No station provided"}))
        sys.exit(1)
    
    result = metrics(station_name)
    print(json.dumps(result))