# routes/storage.py

import csv, os
from datetime import datetime

def save_bhakt_to_csv(name, email, phone, seva_interest, city, filename="static/bhaktgan_data.csv"):
    file_exists = os.path.isfile(filename)
    with open(filename, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        if not file_exists:
            writer.writerow(["नाव", "ईमेल", "फोन", "सेवा", "शहर", "नोंदणी वेळ"])
        writer.writerow([name, email, phone, seva_interest, city, datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
