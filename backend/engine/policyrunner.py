"""
policyrunner.py
Evaluation orchestration layer.
Loads policies fresh on every call (satisfies hot-reload constraint C-6).
Calls the registered evaluator function per applicable policy.
Returns a flat list of Violation objects.
"""

from engine.policy_loader import load_all_policies
from engine.evaluators import EVALUATORS
from models.models import Violation


def evaluate_artifact(artifact: dict) -> list[Violation]:
    """
    Run every applicable policy against the normalized artifact.
    Returns a list of Violation objects (empty list = no violations).
    """
    policies = load_all_policies()
    violations: list[Violation] = []

    for policy in policies:
        artifact_type = artifact.get("artifact_type", "")
        if artifact_type not in policy.get("applies_to", []):
            continue

        policy_id = policy.get("id")
        eval_fn = EVALUATORS.get(policy_id)

        if not eval_fn:
            print(f"[policyrunner] Warning: No evaluator registered for {policy_id}")
            continue

        try:
            result = eval_fn(artifact, policy)
            if result:
                violations.extend(result)
        except Exception as e:
            print(f"[policyrunner] Error in evaluator {policy_id}: {e}")

    return violations
