"""
artifact_parser.py
Parses raw infrastructure artifacts into a normalised dictionary format
that every policy evaluator can work with.

Supports: Terraform plan JSON, Kubernetes manifest YAML, Dockerfile
"""

import json
import yaml
import re


def parse_artifact(artifact_type: str, content: str) -> dict:
    """Dispatch to the correct parser based on artifact type."""
    parsers = {
        "terraform": parse_terraform_plan,
        "kubernetes": parse_k8s_manifest,
        "dockerfile": parse_dockerfile,
    }
    parser = parsers.get(artifact_type)
    if not parser:
        raise ValueError(f"Unknown artifact type: {artifact_type}. Supported: {list(parsers.keys())}")
    return parser(content)


def parse_terraform_plan(plan_json: str) -> dict:
    """
    Parse Terraform plan JSON (output of `terraform show -json plan.bin`).
    Extracts resource_changes and flattens the 'after' state of each resource.
    """
    plan = json.loads(plan_json)
    resources = []
    for change in plan.get("resource_changes", []):
        after = change.get("change", {}).get("after", {})
        resources.append({
            "type": "terraform",
            "resource_type": change.get("type", ""),
            "name": change.get("name", ""),
            "tags": after.get("tags", {}),
            "image": after.get("image", ""),
            "cpu": after.get("cpu", None),
            "memory": after.get("memory", None),
            "public_ip": after.get("assign_public_ip", False),
            "env_vars": after.get("environment", []),
            "ports": after.get("port_mappings", []),
            "health_check": after.get("health_check", None),
        })
    return {"artifact_type": "terraform", "resources": resources}


def parse_k8s_manifest(manifest_yaml: str) -> dict:
    """
    Parse Kubernetes manifest YAML (supports multi-document with ---).
    Extracts metadata, spec, containers, and replicas from workload kinds.
    """
    docs = list(yaml.safe_load_all(manifest_yaml))
    resources = []
    for doc in docs:
        if not doc:
            continue
        kind = doc.get("kind", "")
        metadata = doc.get("metadata", {})
        spec = doc.get("spec", {})

        # Extract containers from workload kinds
        containers = []
        if kind in ["Deployment", "StatefulSet", "DaemonSet"]:
            template_spec = spec.get("template", {}).get("spec", {})
            containers = template_spec.get("containers", [])
        elif kind == "Pod":
            containers = spec.get("containers", [])

        # Extract service-specific fields
        service_type = ""
        if kind == "Service":
            service_type = spec.get("type", "ClusterIP")

        resources.append({
            "type": "kubernetes",
            "kind": kind,
            "name": metadata.get("name", ""),
            "labels": metadata.get("labels", {}),
            "containers": containers,
            "replicas": spec.get("replicas", 1),
            "service_type": service_type,
        })
    return {"artifact_type": "kubernetes", "resources": resources}


def parse_dockerfile(content: str) -> dict:
    """
    Parse a Dockerfile by line-by-line string inspection.
    No Docker SDK needed — simple and fast.
    """
    lines = content.strip().splitlines()

    # Extract base image from FROM instruction
    base_image = ""
    for line in lines:
        stripped = line.strip()
        if stripped.upper().startswith("FROM"):
            parts = stripped.split()
            if len(parts) >= 2:
                base_image = parts[1]
            break  # Use first FROM (multi-stage: first base matters most)

    # Extract exposed ports
    exposed_ports = []
    for line in lines:
        stripped = line.strip()
        if stripped.upper().startswith("EXPOSE"):
            parts = stripped.split()
            for port in parts[1:]:
                # Handle formats like "8080/tcp" or just "8080"
                port_num = port.split("/")[0]
                try:
                    exposed_ports.append(int(port_num))
                except ValueError:
                    exposed_ports.append(port_num)

    # Extract environment variables
    env_vars = []
    for line in lines:
        stripped = line.strip()
        if stripped.upper().startswith("ENV"):
            env_content = stripped[3:].strip()
            # Handle both "ENV KEY=VALUE" and "ENV KEY VALUE" formats
            if "=" in env_content:
                key = env_content.split("=")[0].strip()
                value = "=".join(env_content.split("=")[1:]).strip()
            else:
                parts = env_content.split(None, 1)
                key = parts[0] if parts else ""
                value = parts[1] if len(parts) > 1 else ""
            env_vars.append({"name": key, "value": value})

    # Check for HEALTHCHECK instruction
    has_healthcheck = any(
        line.strip().upper().startswith("HEALTHCHECK")
        for line in lines
        if not line.strip().upper().startswith("HEALTHCHECK NONE")
    )

    return {
        "artifact_type": "dockerfile",
        "base_image": base_image,
        "exposed_ports": exposed_ports,
        "env_vars": env_vars,
        "has_healthcheck": has_healthcheck,
    }
