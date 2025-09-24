from ftplib import FTP
import os

FTP_SERVER = "ftp.bom.gov.au"
FTP_DIR = "/anon/gen/fwo"
LOCAL_DIR = "./data"
os.makedirs(LOCAL_DIR, exist_ok=True)

def download_vic_data():
    ftp = FTP(FTP_SERVER)
    ftp.login()
    ftp.cwd(FTP_DIR)

    files = [f for f in ftp.nlst() if f.startswith("IDV") and f.endswith(".amoc.xml")]

    if not files:
        raise ValueError("No VIC AMOC XML files found!")

    latest_file = sorted(files)[-1]

    local_path = os.path.join(LOCAL_DIR, latest_file)
    with open(local_path, "wb") as f:
        ftp.retrbinary("RETR " + latest_file, f.write)

    ftp.quit()
    print(f"Downloaded VIC feed: {latest_file}")
    return local_path

if __name__ == "__main__":
    path = download_vic_data()
