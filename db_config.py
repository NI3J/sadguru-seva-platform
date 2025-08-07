import os
import pymysql
from dotenv import load_dotenv

load_dotenv("database.env")  # or just load_dotenv() if renamed to `.env`

def get_db_connection():
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST"),
        port=int(os.getenv("MYSQL_PORT")),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DB"),
        cursorclass=pymysql.cursors.DictCursor  # Optional: for JSON-style rows
    )
