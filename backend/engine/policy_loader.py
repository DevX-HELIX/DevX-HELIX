"""
policy_loader.py  (IMPROVED)
Hot-reloads all YAML policy files from the /policies/ directory tree.
No caching — every call reads fresh files. Satisfies constraint C-6.
Fails loudly on schema errors and duplicate IDs.
"""

import os
import glob
import yaml

REQUIRED_FIELDS = [
    "id", "name", "category", "severity",
    "mode", "description", "why_it_matters",
    "applies_to", "rules", "remediation",
]


def load_all_policies(policies_path: str = None) -> list[dict]:
    if policies_path is None:
        policies_path = os.environ.get("POLICIES_PATH", "./policies")

    if not os.path.isdir(policies_path):
        fallback = os.path.join(os.path.dirname(__file__), "..", "..", "policies")
        if os.path.isdir(fallback):
            policies_path = fallback

    pattern = os.path.join(policies_path, "**", "*.yaml")
    files   = sorted(glob.glob(pattern, recursive=True))

    seen_ids: dict[str, str] = {}   # policy_id → filepath
    policies = []

    for filepath in files:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                policy = yaml.safe_load(f)
        except Exception as e:
            raise RuntimeError(f"[policy_loader] Failed to parse {filepath}: {e}")

        if not policy or not isinstance(policy, dict):
            print(f"[policy_loader] Skipping empty/invalid file: {filepath}")
            continue

        if "id" not in policy:
            raise ValueError(f"[policy_loader] Policy file missing 'id' field: {filepath}")

        pid = policy["id"]

        # Duplicate detection — raise so the engine fails loudly
        if pid in seen_ids:
            raise ValueError(
                f"[policy_loader] Duplicate policy ID '{pid}' found in:\n"
                f"  {seen_ids[pid]}\n  {filepath}\n"
                f"Delete one file — only one YAML per policy ID is allowed."
            )
        seen_ids[pid] = filepath

        # Schema validation
        missing = [f for f in REQUIRED_FIELDS if f not in policy]
        if missing:
            raise ValueError(
                f"[policy_loader] Policy '{pid}' in {filepath} is missing required fields: {missing}"
            )

        policies.append(policy)

    return policies


def load_policy_by_id(policy_id: str, policies_path: str = None) -> dict | None:
    for policy in load_all_policies(policies_path):
        if policy["id"] == policy_id:
            return policy
    return None
