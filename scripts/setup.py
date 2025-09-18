import json
import sqlite3
import pandas as pd

from data.schema import Observation


def get_observations() -> pd.DataFrame:
    with open('../data/victoria.json', encoding='utf-8') as f:
        victoria = json.load(f)

    observations = []

    for station_records in victoria.values():
        for record in station_records:
            observation = Observation.model_validate(record)
            observations.append(observation.model_dump())

    return pd.DataFrame.from_records(observations)


def create_database() -> None:
    df = get_observations()

    connection = sqlite3.connect('../data/victoria.db')

    df.to_sql('observations', connection, if_exists='replace', index=False)


if __name__ == "__main__":
    create_database()
