"""
audit.py
GET /api/audit             — paginated, filterable list of all validation runs
GET /api/audit/<run_id>    — single run detail
"""

from flask import Blueprint, request, jsonify

audit_bp = Blueprint("audit", __name__)


def _serialize(doc: dict) -> dict:
    """Convert MongoDB doc to JSON-safe dict."""
    doc.pop("_id", None)
    if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
        doc["timestamp"] = doc["timestamp"].isoformat()
    return doc


@audit_bp.route("/api/audit", methods=["GET"])
def get_audit_logs():
    from app import db
    if db is None:
        return jsonify({"runs": [], "total": 0, "page": 1, "limit": 20}), 200

    # ── Query params ───────────────────────────────────────────────────────────
    team        = request.args.get("team")
    environment = request.args.get("environment")
    status      = request.args.get("status")
    page        = max(int(request.args.get("page",  1)), 1)
    limit       = min(int(request.args.get("limit", 20)), 100)
    skip        = (page - 1) * limit

    # ── Build filter ───────────────────────────────────────────────────────────
    query = {}
    if team:        query["team"]        = team
    if environment: query["environment"] = environment
    if status:      query["status"]      = status.upper()

    # ── Execute ────────────────────────────────────────────────────────────────
    total  = db.policy_runs.count_documents(query)
    cursor = db.policy_runs.find(query).sort("timestamp", -1).skip(skip).limit(limit)
    runs   = [_serialize(doc) for doc in cursor]

    return jsonify({
        "runs":  runs,
        "total": total,
        "page":  page,
        "limit": limit,
    }), 200


@audit_bp.route("/api/audit/<run_id>", methods=["GET"])
def get_audit_log(run_id):
    from app import db
    if db is None:
        return jsonify({"error": "No database connection"}), 500

    doc = db.policy_runs.find_one({"run_id": run_id})
    if not doc:
        return jsonify({"error": "Run not found"}), 404

    return jsonify(_serialize(doc)), 200
