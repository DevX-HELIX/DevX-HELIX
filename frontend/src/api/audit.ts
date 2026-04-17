import { get } from "./client";
import type { AuditListResponse, AuditRunDetail, AuditFilters } from "./contracts";

/** Fetch paginated audit run list from GET /api/audit */
export async function fetchAuditRuns(
  filters?: AuditFilters,
  signal?: AbortSignal,
): Promise<AuditListResponse> {
  const params: Record<string, unknown> = {};
  if (filters?.team)          params.team        = filters.team;
  if (filters?.environment)   params.environment = filters.environment;
  if (filters?.status)        params.status      = filters.status;
  if (filters?.artifact_type) params.artifact_type = filters.artifact_type;
  if (filters?.page)          params.page        = filters.page;
  if (filters?.limit)         params.limit       = filters.limit;

  return get<AuditListResponse>("/api/audit", params, signal);
}

/** Fetch a single run detail from GET /api/audit/:run_id */
export async function fetchRunDetail(
  run_id: string,
  signal?: AbortSignal,
): Promise<AuditRunDetail> {
  return get<AuditRunDetail>(`/api/audit/${run_id}`, undefined, signal);
}
