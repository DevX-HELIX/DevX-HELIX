import { get, patch } from "./client";
import type { Policy, PolicyMode } from "./contracts";

/** Fetch all policies from GET /api/policies */
export async function fetchPolicies(signal?: AbortSignal): Promise<Policy[]> {
  return get<Policy[]>("/api/policies", undefined, signal);
}

/** Toggle enforce/audit mode via PATCH /api/policies/:policy_id/mode */
export async function updatePolicyMode(
  policy_id: string,
  mode: PolicyMode,
  signal?: AbortSignal,
): Promise<Policy> {
  return patch<Policy>(`/api/policies/${policy_id}/mode`, { mode }, signal);
}
