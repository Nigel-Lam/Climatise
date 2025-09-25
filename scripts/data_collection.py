from ftplib import FTP
import os

FTP_SERVER = "ftp.bom.gov.au"
FTP_DIR = "/anon/gen/clim_data/IDCKWCDEA0/tables/vic"
LOCAL_DIR = "./data/vic"
os.makedirs(LOCAL_DIR, exist_ok=True)

def download_newest_csv_per_station():
    ftp = FTP(FTP_SERVER)
    ftp.login()
    ftp.cwd(FTP_DIR)

    station_folders = ftp.nlst()

    for station in station_folders:
        station_path = FTP_DIR + "/" + station
        try:
            ftp.cwd(station_path)
            files = [f for f in ftp.nlst() if f.endswith(".csv")]
            if not files:
                continue

            newest_file = sorted(files)[-1]

            local_station_dir = os.path.join(LOCAL_DIR, station)
            os.makedirs(local_station_dir, exist_ok=True)
            local_path = os.path.join(local_station_dir, newest_file)

            with open(local_path, "wb") as f:
                ftp.retrbinary("RETR " + newest_file, f.write)

            print(f"{station}: downloaded {newest_file}")
        except Exception as e:
            print(f"Failed for {station}: {e}")

    ftp.quit()
    print("All newest CSVs downloaded.")

if __name__ == "__main__":
    download_newest_csv_per_station()
