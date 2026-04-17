import { motion } from "framer-motion";
import {
  GitPullRequest,
  GitCommit,
  ExternalLink,
  AlertOctagon,
  RefreshCw,
  Terminal,
  Activity,
  CheckCircle2,
  User,
  ShieldAlert,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MetricCard } from "@/components/common/MetricCard";
import { ViolationRow } from "@/components/common/ViolationRow";
import type { Violation } from "@/api/contracts";

export default function CurrentRun() {
  const commitSha = "9304637";

  const violations: Violation[] = [
    {
      policy_id: "POL-001",
      policy_name: "Mandatory resource tags",
      severity: "High",
      mode: "enforce",
      resource: 'aws_db_instance "prod"',
      what_failed: "Missing mandatory tags: owner, env, cost-centre",
      why_it_matters:
        "Without tags, cloud costs cannot be attributed to teams and audits fail.",
      remediation:
        'Add the following to your resource block:\n  tags = { owner = "your-team", env = "staging", cost-centre = "eng-123" }',
    },
    {
      policy_id: "POL-007",
      policy_name: "No Exposed Secrets in Env Vars",
      severity: "Critical",
      mode: "enforce",
      resource: "Dockerfile",
      what_failed:
        "Suspicious env var 'DB_PASSWORD' has a hardcoded value — use secretKeyRef instead",
      why_it_matters:
        "Hardcoding secrets in infrastructure definitions compromises the credentials if the code is leaked.",
      remediation:
        "Remove the hardcoded secret and reference it via AWS Secrets Manager, Vault, or GitHub Secrets instead.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-6 px-6 py-6 max-w-5xl mx-auto"
    >
      {/* Header section styling for a "Current PR / Active Pipeline" feel */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-500 shadow-sm mt-1">
            <GitPullRequest className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                test: add bad terraform for CI demo
              </h1>
              <span className="text-slate-400 font-medium text-xl">#1</span>
              <StatusBadge status={"BLOCKED"} size="md" />
            </div>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5 flex-wrap">
              <User className="h-3.5 w-3.5" />
              <span className="font-semibold text-slate-700">Sahil-memane</span>
              <span>wants to merge 1 commit into</span>
              <span className="font-mono text-xs bg-slate-100 text-blue-600 px-1.5 py-0.5 rounded border border-slate-200">
                main
              </span>
              <span>from</span>
              <span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                test/bad-terraform
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="https://github.com/DevX-HELIX/DevX-HELIX/actions/runs/24557323314"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ExternalLink className="h-4 w-4" />
            View in GitHub
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Run Metadata Cards */}
        <MetricCard
          label="Validation Status"
          value="Failed"
          icon={<AlertOctagon className="h-4 w-4 text-red-500" />}
          accent="red"
          sub="Pipeline Blocked"
        />
        <MetricCard
          label="Triggered By"
          value="Actions"
          icon={<Activity className="h-4 w-4 text-blue-500" />}
          accent="blue"
          sub="policy-check (pull_request)"
        />
        <MetricCard
          label="Job ID"
          value="71796985459"
          icon={<Terminal className="h-4 w-4" />}
        />
        <MetricCard
          label="Commit"
          value={commitSha}
          icon={<GitCommit className="h-4 w-4" />}
          sub="View commit diff"
        />
      </div>

      {/* Main Validation Result Panel */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mt-2">
        <div className="bg-red-50 border-b border-red-100 p-5 flex items-start gap-4">
          <ShieldAlert className="h-7 w-7 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-red-900 leading-tight">
              Deployment blocked — enforced policy violations detected.
            </h2>
            <p className="text-sm text-red-700 mt-1 max-w-3xl">
              DevX-HELIX natively intercepted the infrastructure payload in the
              CI pipeline. Fix all blocking issues defined in your declarative
              YAML policies before merging.
            </p>
          </div>
        </div>

        <div className="p-0 border-b border-slate-100">
          <div className="flex border-b border-slate-200">
            <button className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-red-700 border-b-2 border-red-500 bg-red-50/50">
              <AlertOctagon className="h-4 w-4" />
              Blocking Violations
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                2
              </span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
              <CheckCircle2 className="h-4 w-4" />
              Advisory Warnings
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                0
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50/50">
          <div className="space-y-4">
            {violations.map((v, i) => (
              <ViolationRow key={`${v.policy_id}-${i}`} violation={v} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Real-time sync feedback area to mimic live pipeline */}
      <div className="flex items-center justify-center gap-3 p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-slate-500 text-sm">
        <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
        Listening for new commits to <code className="font-semibold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded ml-1 mr-0.5">test/bad-terraform</code>...
      </div>
    </motion.div>
  );
}
