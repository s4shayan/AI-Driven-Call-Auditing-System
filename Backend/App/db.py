from sqlalchemy import create_engine, text
import urllib.parse

# Database Configuration
DB_USER = "sa"
DB_PASSWORD = "123"
DB_HOST = "DESKTOP-EK30LOR"
DB_NAME = "CallAuditingSystem"
DB_PORT = "1433"
DB_DRIVER = "ODBC Driver 17 for SQL Server"

# Construct connection string
# matches: mssql+pyodbc://sa:123@DESKTOP-EK30LOR/CallAuditingSystem?driver=ODBC+Driver+17+for+SQL+Server
driver_encoded = urllib.parse.quote_plus(DB_DRIVER)
connection_string = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}?driver={driver_encoded}"

engine = create_engine(connection_string)
