import requests
import json

base_url = "http://localhost:8080/api/validate"

# Test 1: Should return 422 BLOCKED (missing tags + public IP)
payload1 = {
    "type": "terraform",
    "content": "{\"resource_changes\":[{\"type\":\"aws_ecs_service\",\"name\":\"api\",\"change\":{\"after\":{\"tags\":{},\"assign_public_ip\":true,\"health_check\":null}}}]}",
    "team": "backend",
    "environment": "staging",
    "commit_sha": "abc123"
}

print("Running Test 1 (Expected 422)...")
try:
    r1 = requests.post(base_url, json=payload1)
    print(f"Status: {r1.status_code}")
    print(json.dumps(r1.json(), indent=2))
except Exception as e:
    print("Test 1 failed:", e)

# Test 2: Should return 200 PASSED
payload2 = {
    "type": "terraform",
    "content": "{\"resource_changes\":[{\"type\":\"aws_ecs_service\",\"name\":\"api\",\"change\":{\"after\":{\"tags\":{\"owner\":\"team\",\"env\":\"staging\",\"cost-centre\":\"eng-001\"},\"assign_public_ip\":false,\"health_check\":{\"enabled\":true}}}}]}",
    "team": "backend",
    "environment": "staging",
    "commit_sha": "abc124"
}

print("\nRunning Test 2 (Expected 200)...")
try:
    r2 = requests.post(base_url, json=payload2)
    print(f"Status: {r2.status_code}")
    print(json.dumps(r2.json(), indent=2))
except Exception as e:
    print("Test 2 failed:", e)
