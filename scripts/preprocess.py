import os
from pathlib import Path
import pandas as pd

RAW_DIR = os.path.join("data", "vic")

BOM_COLUMNS = [
    "Station Name",
    "Date",
    "Evapo- Transpiration 0000-2400 (mm)",
    "Rain 0900-0900 (mm)",
    "Pan Evaporation 0900-0900 (mm)",
    "Maximum Temperature (°C)",
    "Minimum Temperature (°C)",
    "Maximum Relative Humidity (%)",
    "Minimum Relative Humidity (%)",
    "Average 10m Wind Speed (m/sec)",
    "Solar Radiation (MJ/sq m)"
]

def clean_csv(path: str) -> pd.DataFrame:
    """
    Read a BOM CSV, skip header/footer, return cleaned DataFrame
    with original BOM column names.
    """
    for enc in ["utf-8-sig", "latin1"]:
        try:
            # Skip top 9 rows which are metadata
            df = pd.read_csv(path, skiprows=9, header=None, encoding=enc)
            break
        except Exception:
            continue
    else:
        print(f"Failed to read {path}")
        return pd.DataFrame()

    # Drop empty columns
    df = df.dropna(how="all", axis=1)

    # Drop last row if it contains 'Totals' or similar
    if df.iloc[-1].astype(str).str.contains("Total|totals", case=False).any():
        df = df.iloc[:-1]

    # Keep only the first 11 columns (BOM_COLUMNS)
    df = df.iloc[:, :len(BOM_COLUMNS)]
    df.columns = BOM_COLUMNS

    # Fill station name if empty
    df["Station Name"] = df["Station Name"].fillna(Path(path).parent.name)

    # Convert Date
    df["Date"] = pd.to_datetime(df["Date"], format="%d/%m/%Y", errors="coerce")
    df = df.dropna(subset=["Date"])
    df["Date"] = df["Date"].dt.strftime("%Y-%m-%d")

    # Convert numeric columns
    numeric_cols = BOM_COLUMNS[2:]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    return df


def preprocess_all_stations() -> pd.DataFrame:
    """Go through all VIC stations, return combined DataFrame."""
    all_dfs = []

    for station_dir in os.listdir(RAW_DIR):
        station_path = os.path.join(RAW_DIR, station_dir)
        if not os.path.isdir(station_path):
            continue

        csv_files = [f for f in os.listdir(station_path) if f.endswith(".csv")]
        if not csv_files:
            continue

        # Process all CSV files (not just newest)
        for csv_file in sorted(csv_files):
            path = os.path.join(station_path, csv_file)
            print(f"Preprocessing {path}")

            try:
                df = clean_csv(path)
                if not df.empty:
                    all_dfs.append(df)
            except Exception as e:
                print(f"Failed to process {path}: {e}")

    if all_dfs:
        combined_df = pd.concat(all_dfs, ignore_index=True)
        print(f"Total records after preprocessing: {len(combined_df)}")
        return combined_df

    print("No records found after preprocessing.")
    return pd.DataFrame()


if __name__ == "__main__":
    df = preprocess_all_stations()
    print(df.head())
