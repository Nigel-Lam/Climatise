from ftplib import FTP
import os
import json
from datetime import datetime, timedelta

FTP_SERVER = "ftp.bom.gov.au"
FTP_DIR = "/anon/gen/clim_data/IDCKWCDEA0/tables/vic"
LOCAL_DIR = "./data/vic"
STATE_FILE = "./data/last_download.json"

os.makedirs(LOCAL_DIR, exist_ok=True)


def get_last_download_time():
    """Load the last download timestamp if it exists, otherwise set to 2 months ago."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            data = json.load(f)
            return datetime.fromisoformat(data["last_download"])
    else:
        # Default: assume 2 months ago to ensure full initial coverage
        default_time = datetime.now().replace(day=1) - timedelta(days=60)
        return default_time

def save_last_download_time(timestamp: datetime):
    """Save the last successful download timestamp."""
    with open(STATE_FILE, "w") as f:
        json.dump({"last_download": timestamp.isoformat()}, f)


def download_new_csvs():
    ftp = FTP(FTP_SERVER)
    ftp.login()
    ftp.cwd(FTP_DIR)

    last_download = get_last_download_time()
    now = datetime.now()
    print(f"Last update: {last_download.strftime('%Y-%m-%d')}")

    # Generate list of months between last_download and now
    month_list = []
    current = last_download.replace(day=1)
    while current <= now:
        month_list.append(current.strftime("%Y%m"))
        # move to next month
        next_month = (current.month % 12) + 1
        year = current.year + (current.month // 12)
        current = current.replace(year=year, month=next_month)

    print(f"Fetching months: {month_list}")

    station_folders = ftp.nlst()

    for station in station_folders:
        try:
            ftp.cwd(FTP_DIR + "/" + station)
            files = [f for f in ftp.nlst() if f.endswith(".csv")]

            # Match any file that contains one of the months we need
            target_files = [f for f in files if any(m in f for m in month_list)]
            if not target_files:
                continue

            local_station_dir = os.path.join(LOCAL_DIR, station)
            os.makedirs(local_station_dir, exist_ok=True)

            for csv_file in sorted(target_files):
                local_path = os.path.join(local_station_dir, csv_file)
                if not os.path.exists(local_path):
                    with open(local_path, "wb") as f:
                        ftp.retrbinary("RETR " + csv_file, f.write)
                    print(f"{station}: downloaded {csv_file}")
                else:
                    print(f"{station}: already has {csv_file}, skipped")

        except Exception as e:
            print(f"Failed for {station}: {e}")

    ftp.quit()
    save_last_download_time(now)
    print("All required CSVs downloaded and timestamp updated.")


if __name__ == "__main__":
    download_new_csvs()
