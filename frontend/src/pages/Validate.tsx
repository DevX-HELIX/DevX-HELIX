/**
 * Validate.tsx
 * Policy-as-Code Validation Simulator — the centerpiece page.
 * Connects to POST /api/validate and renders blocking/advisory violations.
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, RefreshCw, Copy, Check, ExternalLink, ChevronRight,
  FileCode, AlertOctagon, AlertTriangle, CheckCircle2,
  Layers, Database, Container, Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { runValidation } from "@/api/validation";
import { ApiError } from "@/api/client";
import type { ArtifactType, ValidationResponse } from "@/api/contracts";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ViolationRow } from "@/components/common/ViolationRow";
import { CodeViewer } from "@/components/common/CodeViewer";
import { JsonAccordion } from "@/components/common/JsonAccordion";

// ─── Example payloads ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: The Terraform parser expects Terraform Plan JSON
// (output of `terraform show -json plan.bin`), NOT HCL .tf files.
// The kubernetes parser expects YAML manifests.
// The dockerfile parser expects raw Dockerfile text.
// ─────────────────────────────────────────────────────────────────────────────

const TERRAFORM_BAD: string = JSON.stringify(
  {
    resource_changes: [
      {
        type: "aws_ecs_task_definition",
        name: "insecure_service",
        change: {
          after: {
            // No tags → triggers POL-001 (mandatory tags)
            tags: {},
            // Unapproved image → triggers POL-003
            image: "docker.io/nginx:latest",
            // No CPU/memory → triggers POL-004
            cpu: null,
            memory: null,
            // Public IP → triggers POL-002
            assign_public_ip: true,
            // No health check → triggers POL-005
            health_check: null,
          },
        },
      },
      {
        type: "aws_ecs_service",
        name: "payment_service",
        change: {
          after: {
            tags: {},
            image: "public.ecr.aws/nginx:latest",
            cpu: 256,
            memory: 512,
            assign_public_ip: false,
            health_check: null,
          },
        },
      },
    ],
  },
  null,
  2,
);

const TERRAFORM_GOOD: string = JSON.stringify(
  {
    resource_changes: [
      {
        type: "aws_ecs_task_definition",
        name: "secure_service",
        change: {
          after: {
            // Required tags present → passes POL-001
            tags: { team: "platform", env: "production" },
            // Approved registry → passes POL-003
            image: "123456789.dkr.ecr.us-east-1.amazonaws.com/secure-app:1.2.3",
            // CPU and memory set → passes POL-004
            cpu: 512,
            memory: 1024,
            // No public IP → passes POL-002
            assign_public_ip: false,
            // Health check defined → passes POL-005
            health_check: {
              command: ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
              interval: 30,
              timeout: 10,
              retries: 3,
            },
          },
        },
      },
    ],
  },
  null,
  2,
);

const EXAMPLES: Record<ArtifactType, { good: string; bad: string }> = {
  terraform: {
    bad:  TERRAFORM_BAD,
    good: TERRAFORM_GOOD,
  },

  kubernetes: {
    bad: `# BAD Kubernetes — running as root, no resource limits
apiVersion: apps/v1
kind: Deployment
metadata:
  name: insecure-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: insecure-app
  template:
    metadata:
      labels:
        app: insecure-app
    spec:
      containers:
      - name: app
        image: nginx:latest
        securityContext:
          runAsRoot: true        # violates K8S-ROOT policy
          privileged: true       # violates K8S-PRIVILEGED policy
        # No resource limits — violates K8S-LIMITS policy`,

    good: `# GOOD Kubernetes — non-root, resource limits set
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: secure-app
  template:
    metadata:
      labels:
        app: secure-app
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
      - name: app
        image: nginx:1.25.3
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop: ["ALL"]
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "256Mi"`,
  },

  dockerfile: {
    bad: `# BAD Dockerfile — runs as root, uses latest tag, exposes secrets
FROM ubuntu:latest

RUN apt-get update && apt-get install -y curl

ENV DB_PASSWORD=supersecret123
ENV API_KEY=sk-live-abcd1234

RUN useradd -m appuser
# Missing USER instruction — runs as root
EXPOSE 22
EXPOSE 80

CMD ["bash"]`,

    good: `# GOOD Dockerfile — non-root user, pinned image, no secrets
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app
COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["./server"]`,
  },
};

// ─── Pipeline steps ───────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  "Parse Artifact",
  "Load Policies",
  "Match Rules",
  "Evaluate",
  "Report",
  "Persist",
];

// ─── Artifact type config ─────────────────────────────────────────────────────

const ARTIFACT_OPTIONS: { value: ArtifactType; label: string; icon: typeof Layers }[] = [
  { value: "terraform",   label: "Terraform",   icon: Layers },
  { value: "kubernetes",  label: "Kubernetes",  icon: Database },
  { value: "dockerfile",  label: "Dockerfile",  icon: Container },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Validate() {
  const navigate = useNavigate();

  // Form state
  const [artifactType, setArtifactType] = useState<ArtifactType>("terraform");
  const [content, setContent] = useState("");
  const [team, setTeam] = useState("platform");
  const [environment, setEnvironment] = useState("production");
  const [commitSha, setCommitSha] = useState("a1b2c3d");
  const [triggeredBy, setTriggeredBy] = useState("ci/github-actions");

  // Run state
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"blocking" | "advisory">("blocking");
  const [copiedId, setCopiedId] = useState(false);
  const [lastRequest, setLastRequest] = useState<object | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleLoadExample = (type: "good" | "bad") => {
    setContent(EXAMPLES[artifactType][type]);
    setResult(null);
    setError(null);
  };

  const handleRun = async () => {
    if (!content.trim()) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const req = {
      type: artifactType,
      content: content.trim(),
      team,
      environment,
      commit_sha: commitSha,
      triggered_by: triggeredBy,
    };

    setLastRequest(req);
    setRunning(true);
    setResult(null);
    setError(null);

    try {
      const res = await runValidation(req, abortRef.current.signal);
      setResult(res);
      setActiveTab(res.blocking_violations.length > 0 ? "blocking" : "advisory");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setRunning(false);
    }
  };

  const handleCopyRunId = () => {
    if (!result?.run_id) return;
    navigator.clipboard.writeText(result.run_id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const hasResult = result !== null;
  const blockingCount = result?.blocking_violations?.length ?? 0;
  const advisoryCount = result?.advisory_violations?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-6 max-w-6xl mx-auto px-6 py-6"
    >
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Validation Simulator</h1>
        <p className="text-slate-500 text-sm mt-1">
          Submit infrastructure code against active policies to evaluate compliance before deployment.
        </p>
      </div>

      {/* Pipeline stepper */}
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-3 shadow-sm">
        <div className="flex items-center gap-0 overflow-x-auto">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-0 flex-shrink-0">
              <div
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  running && i === 3
                    ? "bg-blue-600 text-white animate-pulse"
                    : hasResult
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-500 bg-slate-50"
                }`}
              >
                {step}
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 mx-1 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Input form ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Artifact type selector */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Artifact Type
            </label>
            <div className="flex flex-col gap-2">
              {ARTIFACT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => { setArtifactType(value); setContent(""); setResult(null); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md border text-sm font-medium transition-all text-left ${
                    artifactType === value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${artifactType === value ? "text-blue-500" : "text-slate-400"}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata fields */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              CI/CD Metadata
            </label>
            <div className="space-y-3">
              {[
                { label: "Team", value: team, onChange: setTeam, placeholder: "platform" },
                { label: "Environment", value: environment, onChange: setEnvironment, placeholder: "production" },
                { label: "Commit SHA", value: commitSha, onChange: setCommitSha, placeholder: "a1b2c3d", mono: true },
                { label: "Triggered By", value: triggeredBy, onChange: setTriggeredBy, placeholder: "ci/github-actions", mono: true },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${field.mono ? "font-mono text-xs" : ""}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Load examples */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Load Example
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleLoadExample("bad")}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
              >
                <AlertOctagon className="h-3.5 w-3.5" />
                Invalid Example
              </button>
              <button
                onClick={() => handleLoadExample("good")}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Compliant Example
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Payload editor + results ── */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Payload editor */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">Payload Editor</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                  {artifactType}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">{content.length} chars</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Paste your ${artifactType} configuration here...`}
              className="w-full h-64 p-4 font-mono text-xs text-slate-800 placeholder:text-slate-400 resize-y focus:outline-none bg-white border-0"
              spellCheck={false}
            />
          </div>

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={running || !content.trim()}
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm transition-all shadow-sm ${
              running || !content.trim()
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {running ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Running Validation...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Validation
              </>
            )}
          </button>

          {/* Error state */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertOctagon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Backend Error</p>
                  <p className="text-xs text-red-600 font-mono mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Result panel ── */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                {/* Result banner */}
                <div
                  className={`rounded-lg border p-4 ${
                    result.status === "BLOCKED"
                      ? "bg-red-50 border-red-200"
                      : result.status === "ADVISORY"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-emerald-50 border-emerald-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {result.status === "BLOCKED" ? (
                        <AlertOctagon className="h-6 w-6 text-red-500 flex-shrink-0" />
                      ) : result.status === "ADVISORY" ? (
                        <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={result.status} size="md" />
                        </div>
                        <p className="text-sm text-slate-700 mt-1">
                          {result.status === "BLOCKED"
                            ? "Deployment blocked — enforced policy violations detected. Fix all blocking issues before deploying."
                            : result.status === "ADVISORY"
                            ? "Deployment allowed with warnings — advisory violations require attention but do not block."
                            : "Passed all enforced checks — deployment is clear to proceed."}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-white border border-slate-200 font-mono text-slate-700">
                          🔴 {result.counts.blocking} blocking
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-white border border-slate-200 font-mono text-slate-700">
                          🟡 {result.counts.advisory} advisory
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Run ID + actions */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">Run ID:</span>
                    <span className="text-xs font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {result.run_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyRunId}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      {copiedId ? (
                        <><Check className="h-3 w-3 text-emerald-500" /> Copied</>
                      ) : (
                        <><Copy className="h-3 w-3" /> Copy ID</>
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/run/${result.run_id}`)}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View in Audit
                    </button>
                  </div>
                </div>

                {/* Violations tabs */}
                {(blockingCount > 0 || advisoryCount > 0) && (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    {/* Tab headers */}
                    <div className="flex border-b border-slate-200">
                      <button
                        onClick={() => setActiveTab("blocking")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                          activeTab === "blocking"
                            ? "text-red-700 border-b-2 border-red-500 bg-red-50/50"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <AlertOctagon className="h-4 w-4" />
                        Blocking Violations
                        {blockingCount > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                            {blockingCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab("advisory")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                          activeTab === "advisory"
                            ? "text-amber-700 border-b-2 border-amber-500 bg-amber-50/50"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Advisory Violations
                        {advisoryCount > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                            {advisoryCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Violation list */}
                    <div className="p-4 space-y-3">
                      {activeTab === "blocking" && (
                        blockingCount === 0 ? (
                          <p className="text-center text-sm text-slate-400 py-6">No blocking violations.</p>
                        ) : (
                          result.blocking_violations.map((v, i) => (
                            <ViolationRow key={`${v.policy_id}-${i}`} violation={v} index={i} />
                          ))
                        )
                      )}
                      {activeTab === "advisory" && (
                        advisoryCount === 0 ? (
                          <p className="text-center text-sm text-slate-400 py-6">No advisory violations.</p>
                        ) : (
                          result.advisory_violations.map((v, i) => (
                            <ViolationRow key={`${v.policy_id}-${i}`} violation={v} index={i} />
                          ))
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Raw request / response accordions */}
                <div className="space-y-2">
                  <JsonAccordion label="Raw Request" data={lastRequest} />
                  <JsonAccordion label="Raw Response" data={result} />
                </div>

                {/* Code viewer of payload */}
                <CodeViewer code={content} label={`${artifactType} payload`} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty prompt before first run */}
          {!result && !running && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
              <FileCode className="h-8 w-8 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">No validation run yet</p>
              <p className="text-xs text-slate-400 mt-1">Load an example or paste your payload, then click Run Validation.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
