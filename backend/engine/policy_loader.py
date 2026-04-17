"""
policy_loader.py
Hot-reloads all YAML policy files from the /policies/ directory tree.
No caching — every call reads fresh files. This satisfies constraint C-6.
"""

import os
import glob
import yaml


def load_all_policies(policies_path: str = None) -> list[dict]:
    """
    Walk the policies directory tree and load every .yaml file.
    Returns a list of policy dicts, each matching the schema in Section 3.
    """
    if policies_path is None:
        policies_path = os.environ.get("POLICIES_PATH", "./policies")
        
    # We resolve it relatively if it's running from inside the app vs root
    # A robust check
    if not os.path.isdir(policies_path):
        # Try finding it relative to the script directory up one level
        possible_path = os.path.join(os.path.dirname(__file__), "..", "..", "policies")
        if os.path.isdir(possible_path):
            policies_path = possible_path

    pattern = os.path.join(policies_path, "**", "*.yaml")
    policy_files = glob.glob(pattern, recursive=True)

    policies = []
    for filepath in sorted(policy_files):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                policy = yaml.safe_load(f)

            if policy and isinstance(policy, dict) and "id" in policy:
                required_fields = [
                    "id", "name", "category", "severity",
                    "mode", "description", "why_it_matters",
                    "applies_to", "rules", "remediation"
                ]
                missing = [f for f in required_fields if f not in policy]
                if missing:
                    print(f"Warning: Policy {filepath} missing fields: {missing}")
                else:
                    policies.append(policy)
            else:
                print(f"Warning: Skipping invalid policy file: {filepath}")
        except Exception as e:
            print(f"Error loading {filepath}: {e}")

    return policies


def load_policy_by_id(policy_id: str, policies_path: str = None) -> dict | None:
    """Load a single policy by its ID."""
    for policy in load_all_policies(policies_path):
        if policy["id"] == policy_id:
            return policy
    return None


if __name__ == "__main__":
    # Quick test: run this file directly to verify all YAMLs load
    policies = load_all_policies()
    print(f"\nLoaded {len(policies)} policies:\n")
    for p in policies:
        print(f"  {p['id']} | {p['name']:40s} | {p['severity']:8s} | mode={p['mode']:7s} | applies_to={p['applies_to']}")
