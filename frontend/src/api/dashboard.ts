import { get } from "./client";
import type { DashboardStats } from "./contracts";

/** Fetch compliance stats from GET /api/dashboard/stats */
export async function fetchDashboardStats(signal?: AbortSignal): Promise<DashboardStats> {
  return get<DashboardStats>("/api/dashboard/stats", undefined, signal);
}
