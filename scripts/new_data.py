import json
import os
from data.schema import Observation
from scripts.preprocess import preprocess_all_stations

DB_PATH = "db.json"

def load_db():
    if os.path.exists(DB_PATH):
        with open(DB_PATH, "r", encoding="latin1") as f:
            return json.load(f)
    return []

def save_db(data):
    with open(DB_PATH, "w", encoding="latin1") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def insert_new_data():
    df = preprocess_all_stations()
    db = load_db()

    for row in df.to_dict(orient="records"):
        try:
            obs = Observation(**row)
            db.append(obs.dict())
        except Exception as e:
            print(f"Validation failed for row {row.get('date')} at {row.get('station_name')}: {e}")

    save_db(db)
    print(f"Database updated with {len(df)} records.")

if __name__ == "__main__":
    insert_new_data()
