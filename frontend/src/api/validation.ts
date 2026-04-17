import { post } from "./client";
import type { ValidationRequest, ValidationResponse } from "./contracts";

/**
 * Run a validation against POST /api/validate.
 * Returns the full result including blocking + advisory violations.
 * The backend returns 422 when blocking violations exist — our client
 * normalises this into an ApiError, so we must catch 422 specially
 * since the body is still a valid ValidationResponse.
 */
export async function runValidation(
  req: ValidationRequest,
  signal?: AbortSignal,
): Promise<ValidationResponse> {
  try {
    return await post<ValidationResponse>("/api/validate", req, signal);
  } catch (err: unknown) {
    // 422 = blocked by enforce-mode policies — still a valid structured response
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status: number }).status === 422 &&
      "body" in err &&
      err["body"] &&
      typeof err["body"] === "object" &&
      "run_id" in (err["body"] as object)
    ) {
      return (err as { body: ValidationResponse }).body;
    }
    throw err;
  }
}
