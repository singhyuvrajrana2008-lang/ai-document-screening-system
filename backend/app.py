from flask import Flask, jsonify
from flask_cors import CORS
from config import supabase

app = Flask(__name__)
CORS(app)

@app.route("/api/health", methods=["GET"])
def health_check():
    db_status = "connected"
    try:
        # Simple real query: count rows in reference_records (the demo/mock table)
        supabase.table("reference_records").select("id", count="exact").limit(1).execute()
    except Exception as e:
        db_status = f"error: {str(e)}"

    return jsonify({
        "success": True,
        "data": {
            "status": "operational",
            "database": db_status
        }
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)