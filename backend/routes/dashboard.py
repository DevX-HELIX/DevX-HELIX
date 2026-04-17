"""
dashboard.py
GET /api/dashboard/stats — compliance score, pass rate, top violations, recent runs.
"""

from flask import Blueprint, jsonify

dashboard_bp = Blueprint("dashboard", __name__)


def _serialize_run(doc: dict) -> dict:
    doc.pop("_id", None)
    if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
        doc["timestamp"] = doc["timestamp"].isoformat()
    return doc


@dashboard_bp.route("/api/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    from app import db

    empty = {
        "compliance_score": 100,
        "pass_rate":        100,
        "total_runs":       0,
        "blocked_count":    0,
        "advisory_count":   0,
        "top_violations":   [],
        "recent_runs":      [],
    }

    if db is None:
        return jsonify(empty), 200

    total = db.policy_runs.count_documents({})
    if total == 0:
        return jsonify(empty), 200

    passed_count  = db.policy_runs.count_documents({"status": "PASSED"})
    blocked_count = db.policy_runs.count_documents({"status": "BLOCKED"})
    advisory_count= db.policy_runs.count_documents({"status": "ADVISORY"})
    pass_rate     = round((passed_count / total) * 100, 1)

    # Top violated policies — grouped by policy_name for a cleaner chart label
    pipeline = [
        {"$unwind": "$violations"},
        {"$group": {
            "_id":   "$violations.policy_name",
            "count": {"$sum": 1},
        }},
        {"$sort":  {"count": -1}},
        {"$limit": 5},
        {"$project": {"_id": 0, "policy_name": "$_id", "count": 1}},
    ]
    top_violations = list(db.policy_runs.aggregate(pipeline))

    # Recent 10 runs for the dashboard table
    cursor      = db.policy_runs.find({}, {
        "run_id": 1, "status": 1, "timestamp": 1,
        "team": 1, "environment": 1, "artifact_type": 1, "counts": 1,
    }).sort("timestamp", -1).limit(10)
    recent_runs = [_serialize_run(doc) for doc in cursor]

    return jsonify({
        "compliance_score": pass_rate,
        "pass_rate":        pass_rate,
        "total_runs":       total,
        "blocked_count":    blocked_count,
        "advisory_count":   advisory_count,
        "top_violations":   top_violations,
        "recent_runs":      recent_runs,
    }), 200
