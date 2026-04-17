"""
validate.py
POST /api/validate  — the main endpoint.
This route is a thin orchestrator only.
All business logic lives in engine modules.
"""

from flask import Blueprint, request, jsonify
import uuid

from engine.artifact_parser  import parse_artifact
from engine.policyrunner     import evaluate_artifact
from engine.reportbuilder    import build_report
from engine.auditlogger      import log_run

validate_bp = Blueprint("validate", __name__)


@validate_bp.route("/api/validate", methods=["POST"])
def validate_artifact():
    data = request.json or {}

    artifact_type = data.get("type")
    content       = data.get("content")

    if not artifact_type or not content:
        return jsonify({"error": "Missing required fields: 'type' and 'content'"}), 400

    # ── Step 1: Parse ──────────────────────────────────────────────────────────
    try:
        artifact = parse_artifact(artifact_type, content)
    except ValueError as e:
        return jsonify({"error": f"Artifact parse error: {e}"}), 400

    # ── Step 2: Evaluate ───────────────────────────────────────────────────────
    violations = evaluate_artifact(artifact)

    # ── Step 3: Build report ───────────────────────────────────────────────────
    run_id = str(uuid.uuid4())
    result, http_code = build_report(violations, run_id)

    # ── Step 4: Persist ────────────────────────────────────────────────────────
    from app import db
    metadata = {
        "team":          data.get("team",         "unknown"),
        "environment":   data.get("environment",  "unknown"),
        "commit_sha":    data.get("commit_sha",   "unknown"),
        "triggered_by":  data.get("triggered_by", "ci"),
        "artifact_type": artifact_type,
    }
    log_run(db, run_id, result["status"], metadata, result)

    # ── Step 5: Respond ────────────────────────────────────────────────────────
    return jsonify(result), http_code


@validate_bp.route("/api/auto-fix", methods=["POST"])
def auto_fix():
    """Placeholder — returns remediation hints from the last violation report."""
    return jsonify({
        "message": "Auto-fix is advisory only. Apply the remediation steps shown in the violation report."
    }), 200
