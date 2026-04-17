"""
PolicyOps Policy-as-Code Validation Engine
Flask entry point — registers blueprints, connects MongoDB, serves frontend.
"""

import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── MongoDB Connection ──
MONGODB_URI = os.environ.get("MONGODB_URI", "")
db = None
if MONGODB_URI:
    try:
        client = MongoClient(MONGODB_URI)
        db = client.policydb
        if db is not None:
            db.policy_runs.create_index([("timestamp", -1)])
            db.policy_runs.create_index([("team", 1), ("status", 1)])
            db.policies.create_index([("policy_id", 1)], unique=True)
        print("Connected to MongoDB Atlas")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        print("   Running without database — audit logging disabled")
else:
    print("No MONGODB_URI set — running without database")


# ── Health Check ──
@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "devx-helix-policy-engine",
        "db_connected": db is not None,
    })


# ── Import and register route blueprints ──
# These will be created by Member A — uncomment as they become available:
from routes.validate import validate_bp
from routes.policies import policies_bp
from routes.audit import audit_bp
from routes.dashboard import dashboard_bp
app.register_blueprint(validate_bp)
app.register_blueprint(policies_bp)
app.register_blueprint(audit_bp)
app.register_blueprint(dashboard_bp)


# ── Serve React Frontend (Static Files) ──
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """Serve React SPA — all non-API routes fall through to index.html."""
    if path and os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return send_from_directory(FRONTEND_DIR, "index.html")
    return jsonify({"message": "PolicyOps API is running. Frontend not built yet."}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug = os.environ.get("FLASK_ENV", "production") != "production"
    print(f"PolicyOps starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
