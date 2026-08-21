from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows the frontend (running on a different port) to call this backend

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "success": True,
        "data": {
            "status": "operational"
        }
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)