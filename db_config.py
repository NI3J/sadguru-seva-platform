import os
import pymysql
from dotenv import load_dotenv
from contextlib import contextmanager

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

@contextmanager
def get_db_cursor():
    """Context manager for database cursor operations"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        yield cursor
    except Exception as e:
        if connection:
            connection.rollback()
        raise e
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
