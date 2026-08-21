import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ.get("DATABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("STORAGE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError(
        "Missing DATABASE_URL or STORAGE_KEY in your .env file. "
        "Check backend/.env exists and both values are filled in."
    )

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
