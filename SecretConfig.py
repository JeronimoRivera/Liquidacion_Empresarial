import os
from pathlib import Path

from dotenv import dotenv_values, load_dotenv


_ENV_FILE = Path(__file__).resolve().parent / ".env"
load_dotenv(_ENV_FILE)
_FILE_CONFIG = dotenv_values(_ENV_FILE)

PGHOST = os.getenv("HOST", "")
PGDATABASE = os.getenv("DBNAME", "")
# USER is commonly set by the operating system, so prefer the explicit
# Neon-specific variable, then the .env database setting.
PGUSER = os.getenv("NEON_DB_USER") or _FILE_CONFIG.get("USER") or ""
PGPASSWORD = os.getenv("PASSWORD", "")
PGPORT = int(os.getenv("PORT", "5432"))