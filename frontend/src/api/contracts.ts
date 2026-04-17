/**
 * contracts.ts
 * TypeScript interfaces that exactly match the PolicyOps backend API responses.
 * Field names are taken directly from the Python backend models and route handlers.
 */

// ─── Primitive types ──────────────────────────────────────────────────────────

export type ArtifactType = "terraform" | "kubernetes" | "dockerfile";
export type ValidationStatus = "PASSED" | "ADVISORY" | "BLOCKED";
export type PolicyMode = "enforce" | "audit";
export type Severity = "Critical" | "High" | "Medium" | "Low";

// ─── Validation ───────────────────────────────────────────────────────────────

/** Body sent to POST /api/validate */
export interface ValidationRequest {
  type: ArtifactType;           // backend reads data.get("type")
  content: string;              // backend reads data.get("content")
  team?: string;
  environment?: string;
  commit_sha?: string;
  triggered_by?: string;
}

/**
 * Violation object returned by the engine (from models/models.py Violation.to_dict())
 * The backend uses what_failed / why_it_matters rather than description.
 */
export interface Violation {
  policy_id: string;
  policy_name: string;
  severity: Severity;
  mode: PolicyMode;
  resource: string;
  what_failed: string;
  why_it_matters: string;
  remediation: string;
}

/** Counts sub-object inside a validation result */
export interface ViolationCounts {
  blocking: number;
  advisory: number;
  total: number;
}

/** Response from POST /api/validate */
export interface ValidationResponse {
  run_id: string;
  status: ValidationStatus;
  counts: ViolationCounts;
  blocking_violations: Violation[];   // enforce-mode violations → 422
  advisory_violations: Violation[];   // audit-mode violations  → 200
}

// ─── Policies ─────────────────────────────────────────────────────────────────

/** Policy document from GET /api/policies (seeded from YAML into MongoDB) */
export interface Policy {
  policy_id: string;
  name: string;
  category: string;
  severity: Severity;
  mode: PolicyMode;
  enabled: boolean;
  description?: string;
  applies_to: ArtifactType[];         // formerly artifact_types in YAML
  why_it_matters?: string;
  remediation?: string;
  last_modified_at?: string;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

/** One row in GET /api/audit response (runs array) */
export interface AuditRun {
  run_id: string;
  timestamp: string;
  team: string;
  environment: string;
  artifact_type: string;
  commit_sha: string;
  triggered_by: string;
  status: ValidationStatus;
  counts: ViolationCounts;
}

/** Paginated list response from GET /api/audit */
export interface AuditListResponse {
  runs: AuditRun[];
  total: number;
  page: number;
  limit: number;
}

/** Query parameters for GET /api/audit */
export interface AuditFilters {
  team?: string;
  environment?: string;
  status?: ValidationStatus;
  artifact_type?: ArtifactType;
  page?: number;
  limit?: number;
}

/** Full detail for GET /api/audit/:run_id — includes all violations */
export interface AuditRunDetail extends AuditRun {
  violations: Violation[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/** Top violated policy entry */
export interface TopViolation {
  policy_name: string;
  count: number;
}

/** Response from GET /api/dashboard/stats */
export interface DashboardStats {
  compliance_score: number;
  pass_rate: number;
  total_runs: number;
  blocked_count: number;
  advisory_count: number;
  top_violations: TopViolation[];
  recent_runs: AuditRun[];
}
