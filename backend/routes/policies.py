"""
policies.py
GET  /api/policies             — list all policies with current mode from MongoDB
PATCH /api/policies/<id>/mode  — toggle mode, persists to MongoDB (not YAML)
"""

from flask import Blueprint, request, jsonify
from engine.policy_loader import load_all_policies
from datetime import datetime, timezone

policies_bp = Blueprint("policies", __name__)


def _get_db():
    from app import db
    return db


def _ensure_policies_seeded(db):
    """
    On first call, seed the policies collection from YAML files.
    This runs only when the collection is empty.
    """
    if db is None:
        return
    if db.policies.count_documents({}) == 0:
        yaml_policies = load_all_policies()
        for p in yaml_policies:
            db.policies.update_one(
                {"policy_id": p["id"]},
                {"$setOnInsert": {
                    "policy_id":       p["id"],
                    "name":            p.get("name"),
                    "category":        p.get("category"),
                    "severity":        p.get("severity"),
                    "mode":            p.get("mode", "audit"),
                    "enabled":         True,
                    "description":     p.get("description"),
                    "applies_to":      p.get("applies_to", []),
                    "why_it_matters":  p.get("why_it_matters"),
                    "remediation":     p.get("remediation"),
                    "last_modified_at": datetime.now(timezone.utc),
                }},
                upsert=True,
            )


@policies_bp.route("/api/policies", methods=["GET"])
def get_policies():
    db = _get_db()
    _ensure_policies_seeded(db)

    if db is None:
        # Fallback: return from YAML if no DB
        return jsonify(load_all_policies()), 200

    docs = list(db.policies.find({}, {"_id": 0}))
    return jsonify(docs), 200


@policies_bp.route("/api/policies/<policy_id>/mode", methods=["PATCH"])
def update_policy_mode(policy_id):
    db = _get_db()
    data     = request.json or {}
    new_mode = data.get("mode")

    if new_mode not in ("enforce", "audit"):
        return jsonify({"error": "mode must be 'enforce' or 'audit'"}), 400

    if db is None:
        return jsonify({"error": "No database connection"}), 500

    _ensure_policies_seeded(db)

    result = db.policies.update_one(
        {"policy_id": policy_id},
        {"$set": {
            "mode":            new_mode,
            "last_modified_at": datetime.now(timezone.utc),
        }}
    )

    if result.matched_count == 0:
        return jsonify({"error": f"Policy {policy_id} not found"}), 404

    updated = db.policies.find_one({"policy_id": policy_id}, {"_id": 0})
    return jsonify(updated), 200
