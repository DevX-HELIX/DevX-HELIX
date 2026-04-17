# PolicyOps (formerly DevX-HELIX)

**PolicyOps** is a comprehensive Policy-as-Code governance and validation engine. It enables platform teams and developers to automatically validate infrastructure artifacts (Terraform, Kubernetes, Dockerfiles) against organizational policies defined in YAML. 

By catching compliance violations early in the CI/CD pipeline, PolicyOps ensures that deployments strictly follow security best practices, cost-control measures, and operational requirements without slowing down delivery speeds.

## Features

- **Multi-Artifact Support**: Seamlessly parses and validates infrastructure declarations, including:
  - Terraform (`.json` output formats or configuration files)
  - Kubernetes manifests (`.yaml` / `.yml`)
  - Dockerfiles
- **YAML-Based Policy Engine**: Write understandable and declarative policies in YAML. Group them into distinct domains like `security`, `tagging`, `networking`, `resources`, etc.
- **Enforcement & Audit Modes**:
  - **Enforce**: Block non-compliant deployments directly in the CI/CD pipeline (returns HTTP 422).
  - **Audit**: Log compliance issues for tracking without blocking the pipeline (returns HTTP 200).
- **Interactive Governance Console**: A React/Vite-based frontend using Tailwind CSS for real-time visualization of runs, policy violations, compliance scores, and audit trails.
- **MongoDB-Backed Audit Logging**: Preserves a historical record of validations, providing trend analysis and analytics capability.

## Project Structure

```text
PolicyOps/
├── backend/            # Flask & Python validation engine
│   ├── app.py          # Entry point
│   ├── engine/         # Core logic (parsers, policy loader, runners)
│   ├── routes/         # API Controllers
│   ├── models/         # Data & Response models
│   └── requirements.txt
├── frontend/           # React/Vite interactive console
│   ├── src/            # React components, UI pages, and API clients
│   └── package.json
├── policies/           # YAML-defined organizational policies
│   ├── health/         # Health & Liveness policies
│   ├── networking/     # Network compliance policies
│   ├── resources/      # Cost/Resource constraints
│   ├── security/       # Container and Access security defaults
│   └── tagging/        # Required operational/cost-center tags
└── test_artifacts/     # Test cases (good/bad configurations)
```

## Getting Started

### Prerequisites

- **Python 3.9+** (for the Backend Engine)
- **Node.js 18+** & **npm** (for the Governance Console)
- **MongoDB Atlas Cluster** (or local Mongo instance)

### 1. Starting the Backend (Validation Engine)

The backend handles the policy parsing and validation checks.

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# On Windows: venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask app (runs on port 8080 by default)
python app.py
```
> **Note:** If you do not have a MongoDB URI set up in a `.env` file (`MONGODB_URI=...`), the engine will gracefully fall back to running without persistent audit logging.

### 2. Starting the Frontend (Governance Console)

The frontend provides the main dashboard and interactive validation interface.

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
Navigate to `http://localhost:5173/` in your browser.

## How Policies Work

Policies are defined in YAML format within the `policies/` directory. They can restrict things like missing tags, unauthorized base images, or missing resource limits.

### Example Policy (`policies/tagging/mandatory_tags.yaml`)

```yaml
policy_id: "TAG-001"
name: "Mandatory Tags Enforcement"
description: "Ensure all resources are tagged with owner, env, and cost-centre"
applies_to: ["terraform", "kubernetes"]
severity: "High"
mode: "enforce"
category: "tagging"
```
*Note: Policy logic handlers map closely between these definitions and the backend parsers (`backend/engine/policyrunner.py`).*

## CI/CD Validation Integration

You can integrate PolicyOps directly into GitHub Actions, GitLab CI, or Jenkins pipelines.

**Example Validation Request:**
```bash
curl -X POST http://localhost:8080/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "terraform",
    "team": "platform-engineering",
    "environment": "production",
    "content": "{... stringified raw configuration ...}"
  }'
```

If the request violates an `enforce`-mode policy, the API will respond with HTTP `422 Unprocessable Entity` — which typically signals your CI runner to fail and immediately prevent non-compliant infrastructure from being provisioned.