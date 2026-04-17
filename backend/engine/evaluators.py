from dataclasses import dataclass

@dataclass
class Violation:
    policy_id: str
    policy_name: str
    severity: str
    mode: str
    resource: str
    what_failed: str
    why_it_matters: str
    remediation: str

EVALUATORS = {}

# -- POL-005: Required Health Checks --
def eval_POL005(artifact, policy):
    """Check that all services have health checks defined."""
    violations = []
    artifact_type = artifact["artifact_type"]

    if artifact_type == "terraform":
        for res in artifact.get("resources", []):
            if res.get("health_check") is None:
                violations.append(Violation(
                    policy_id=policy["id"],
                    policy_name=policy["name"],
                    severity=policy["severity"],
                    mode=policy["mode"],
                    resource=res.get("name", "unknown"),
                    what_failed="No health check defined",
                    why_it_matters=policy["why_it_matters"],
                    remediation=policy["remediation"],
                ))

    elif artifact_type == "kubernetes":
        for res in artifact.get("resources", []):
            if res.get("kind") not in ["Deployment", "StatefulSet", "DaemonSet"]:
                continue
            for container in res.get("containers", []):
                has_liveness = "livenessProbe" in container
                has_readiness = "readinessProbe" in container
                if not has_liveness and not has_readiness:
                    violations.append(Violation(
                        policy_id=policy["id"],
                        policy_name=policy["name"],
                        severity=policy["severity"],
                        mode=policy["mode"],
                        resource=f"{res.get('name', 'unknown')}/{container.get('name', 'unknown')}",
                        what_failed="No livenessProbe or readinessProbe defined",
                        why_it_matters=policy["why_it_matters"],
                        remediation=policy["remediation"],
                    ))

    elif artifact_type == "dockerfile":
        if not artifact.get("has_healthcheck", False):
            violations.append(Violation(
                policy_id=policy["id"],
                policy_name=policy["name"],
                severity=policy["severity"],
                mode=policy["mode"],
                resource="Dockerfile",
                what_failed="No HEALTHCHECK instruction found",
                why_it_matters=policy["why_it_matters"],
                remediation=policy["remediation"],
            ))

    return violations


# -- POL-006: Minimum Replica Count --
def eval_POL006(artifact, policy):
    """Check that Deployments have at least the minimum replica count."""
    violations = []
    minimum = policy["rules"][0].get("minimum", 2)

    for res in artifact.get("resources", []):
        if res.get("kind") != "Deployment":
            continue
        actual = res.get("replicas", 1)
        if actual < minimum:
            violations.append(Violation(
                policy_id=policy["id"],
                policy_name=policy["name"],
                severity=policy["severity"],
                mode=policy["mode"],
                resource=res.get("name", "unknown"),
                what_failed=f"Replicas set to {actual}, minimum required is {minimum}",
                why_it_matters=policy["why_it_matters"],
                remediation=policy["remediation"],
            ))

    return violations


# -- POL-007: No Exposed Secrets in Env Vars --
def eval_POL007(artifact, policy):
    """Check for hardcoded secrets in environment variables."""
    import re
    violations = []
    suspicious_names = policy["rules"][0].get("suspicious_patterns",
        ["password", "secret", "token", "key", "apikey", "api_key"])
    base64_pattern = policy["rules"][0].get("base64_pattern",
        r"^[A-Za-z0-9+/]{20,}={0,2}$")

    artifact_type = artifact["artifact_type"]

    if artifact_type == "kubernetes":
        for res in artifact.get("resources", []):
            for container in res.get("containers", []):
                for env in container.get("env", []):
                    env_name = env.get("name", "")
                    env_value = env.get("value", "")

                    # Check if name matches suspicious patterns
                    name_suspicious = any(
                        pattern in env_name.lower()
                        for pattern in suspicious_names
                    )

                    # Check if value looks like base64 encoded secret
                    value_is_base64 = bool(re.match(base64_pattern, str(env_value))) if env_value else False

                    # Flag if name is suspicious AND value is plain text (not a secretKeyRef)
                    if name_suspicious and env_value:
                        violations.append(Violation(
                            policy_id=policy["id"],
                            policy_name=policy["name"],
                            severity=policy["severity"],
                            mode=policy["mode"],
                            resource=f"{res.get('name', 'unknown')}/{container.get('name', 'unknown')}",
                            what_failed=f"Suspicious env var '{env_name}' has a hardcoded value — use secretKeyRef instead",
                            why_it_matters=policy["why_it_matters"],
                            remediation=policy["remediation"],
                        ))
                    elif value_is_base64 and not name_suspicious:
                        violations.append(Violation(
                            policy_id=policy["id"],
                            policy_name=policy["name"],
                            severity=policy["severity"],
                            mode=policy["mode"],
                            resource=f"{res.get('name', 'unknown')}/{container.get('name', 'unknown')}",
                            what_failed=f"Env var '{env_name}' value looks like a base64-encoded secret",
                            why_it_matters=policy["why_it_matters"],
                            remediation=policy["remediation"],
                        ))

    elif artifact_type == "dockerfile":
        for env in artifact.get("env_vars", []):
            env_name = env.get("name", "") if isinstance(env, dict) else str(env).split("=")[0]
            env_value = env.get("value", "") if isinstance(env, dict) else "=".join(str(env).split("=")[1:]) if "=" in str(env) else ""

            name_suspicious = any(
                pattern in env_name.lower()
                for pattern in suspicious_names
            )
            if name_suspicious and env_value:
                violations.append(Violation(
                    policy_id=policy["id"],
                    policy_name=policy["name"],
                    severity=policy["severity"],
                    mode=policy["mode"],
                    resource="Dockerfile",
                    what_failed=f"ENV variable '{env_name}' appears to contain a hardcoded secret",
                    why_it_matters=policy["why_it_matters"],
                    remediation=policy["remediation"],
                ))

    return violations


# -- POL-008: Blocked Port Exposure --
def eval_POL008(artifact, policy):
    """Check for blocked ports (SSH, RDP, DB ports) being exposed."""
    violations = []
    blocked = policy["rules"][0].get("blocked_ports", [22, 3389, 5432, 6379, 27017])

    artifact_type = artifact["artifact_type"]

    if artifact_type == "kubernetes":
        for res in artifact.get("resources", []):
            for container in res.get("containers", []):
                for port in container.get("ports", []):
                    port_num = port.get("containerPort", 0) if isinstance(port, dict) else port
                    if port_num in blocked:
                        violations.append(Violation(
                            policy_id=policy["id"],
                            policy_name=policy["name"],
                            severity=policy["severity"],
                            mode=policy["mode"],
                            resource=f"{res.get('name', 'unknown')}/{container.get('name', 'unknown')}",
                            what_failed=f"Blocked port {port_num} is exposed",
                            why_it_matters=policy["why_it_matters"],
                            remediation=policy["remediation"],
                        ))

    elif artifact_type == "dockerfile":
        for port in artifact.get("exposed_ports", []):
            port_num = int(port) if isinstance(port, str) and port.isdigit() else port
            if port_num in blocked:
                violations.append(Violation(
                    policy_id=policy["id"],
                    policy_name=policy["name"],
                    severity=policy["severity"],
                    mode=policy["mode"],
                    resource="Dockerfile",
                    what_failed=f"Blocked port {port_num} is exposed via EXPOSE directive",
                    why_it_matters=policy["why_it_matters"],
                    remediation=policy["remediation"],
                ))

    return violations


# Register your evaluators
EVALUATORS["POL-005"] = eval_POL005
EVALUATORS["POL-006"] = eval_POL006
EVALUATORS["POL-007"] = eval_POL007
EVALUATORS["POL-008"] = eval_POL008
