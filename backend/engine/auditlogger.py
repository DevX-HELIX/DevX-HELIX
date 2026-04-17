"""
auditlogger.py
Persists every validation run to MongoDB Atlas policy_runs collection.
Called once per POST /api/validate request, after report is built.
"""

from datetime import datetime, timezone


def log_run(db, run_id: str, status: str, metadata: dict, result: dict) -> None:
    """
    Write the full run record to MongoDB.

    Args:
        db          : PyMongo database object (may be None if DB is unavailable)
        run_id      : UUID string for this run
        status      : "PASSED" | "ADVISORY" | "BLOCKED"
        metadata    : dict with team, environment, commit_sha, triggered_by, artifact_type
        result      : the full report dict from reportbuilder.build_report()
    """
    if db is None:
        print("[auditlogger] Warning: No database connection — run not persisted.")
        return

    doc = {
        "run_id":       run_id,
        "status":       status,
        "timestamp":    datetime.now(timezone.utc),
        "team":         metadata.get("team", "unknown"),
        "environment":  metadata.get("environment", "unknown"),
        "commit_sha":   metadata.get("commit_sha", "unknown"),
        "triggered_by": metadata.get("triggered_by", "ci"),
        "artifact_type":metadata.get("artifact_type", "unknown"),
        "counts":       result.get("counts", {}),
        "violations":   result.get("blocking_violations", []) + result.get("advisory_violations", []),
    }

    try:
        db.policy_runs.insert_one(doc)
    except Exception as e:
        print(f"[auditlogger] Error writing to MongoDB: {e}")
