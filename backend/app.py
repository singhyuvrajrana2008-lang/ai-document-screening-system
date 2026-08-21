from flask import Flask, jsonify
from flask_cors import CORS

from config import supabase
from run_screening import run_screening
from screenings import create_screening, upload_document

app = Flask(__name__)
CORS(app)

@app.route("/api/health", methods=["GET"])
def health_check():
    db_status = "connected"
    try:
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


app.add_url_rule("/api/screenings", view_func=create_screening, methods=["POST"])
app.add_url_rule(
    "/api/screenings/<screening_id>/documents",
    view_func=upload_document,
    methods=["POST"],
)
app.add_url_rule(
    "/api/screenings/<screening_id>/run",
    view_func=run_screening,
    methods=["POST"],
)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
