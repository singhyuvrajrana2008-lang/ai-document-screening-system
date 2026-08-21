"""Application configuration and Supabase service-role client."""

import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

# Load backend/.env even when Flask is started from the repository root.
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

SUPABASE_URL = (
    os.getenv("SUPABASE_URL")
    or os.getenv("DATABASE_URL")
    or os.getenv("VITE_SUPABASE_URL")
)
SUPABASE_SERVICE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("STORAGE_KEY")
)

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env. "
        "Legacy DATABASE_URL/STORAGE_KEY names are also supported."
    )

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
