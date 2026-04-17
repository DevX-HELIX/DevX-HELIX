"""
reportbuilder.py
Builds the structured JSON response body from a list of Violation objects.
Determines run status: PASSED | ADVISORY | BLOCKED.
Splits violations into blocking (enforce) and advisory (audit) lists.
"""

from models.models import Violation


def build_report(violations: list[Violation], run_id: str) -> tuple[dict, int]:
    """
    Build the full response dict and HTTP status code.

    Returns:
        (result_dict, http_status_code)
        - 422 if any blocking (enforce-mode) violations exist
        - 200 otherwise
    """
    blocking = [v for v in violations if v.mode == "enforce"]
    advisory  = [v for v in violations if v.mode == "audit"]

    if blocking:
        status = "BLOCKED"
    elif advisory:
        status = "ADVISORY"
    else:
        status = "PASSED"

    counts = {
        "blocking": len(blocking),
        "advisory": len(advisory),
        "total":    len(violations),
    }

    result = {
        "run_id":             run_id,
        "status":             status,
        "counts":             counts,
        "blocking_violations": [v.to_dict() for v in blocking],
        "advisory_violations": [v.to_dict() for v in advisory],
    }

    http_code = 422 if blocking else 200
    return result, http_code


def format_terminal_output(result: dict) -> str:
    """
    Produce the human-readable terminal string that GitHub Actions prints.
    Matches the exact format described in Section 5.4 of the implementation guide.
    """
    lines = [f"\nStatus: {result['status']}\n"]

    for v in result.get("blocking_violations", []):
        lines.append(f"  ❌ BLOCKED  {v['policy_name']} on {v['resource']}")
        lines.append(f"     What failed  : {v['what_failed']}")
        lines.append(f"     Why it matters: {v['why_it_matters']}")
        lines.append(f"     Fix           : {v['remediation']}\n")

    for v in result.get("advisory_violations", []):
        lines.append(f"  ⚠️  ADVISORY  {v['policy_name']} on {v['resource']}")
        lines.append(f"     What failed  : {v['what_failed']}")
        lines.append(f"     Why it matters: {v['why_it_matters']}")
        lines.append(f"     Fix           : {v['remediation']}\n")

    if result["status"] == "BLOCKED":
        lines.append("Deployment blocked by policy violations.")

    return "\n".join(lines)
