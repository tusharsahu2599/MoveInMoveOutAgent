import type { MoveRequest } from "../types/domain.js";
import { createRequest, getRequestById } from "./request.service.js";
import { transitionStatus } from "./workflow.service.js";

export function submitMoveRequest(request: MoveRequest): MoveRequest {
  const existing = getRequestById(request.id);

  // Already submitted — make submission idempotent.
  if (existing?.status === "SUBMITTED") {
    return existing;
  }

  // Existing request — transition it to SUBMITTED.
  if (existing) {
    existing.status = transitionStatus(existing.status, "SUBMITTED");

    existing.updatedAt = new Date().toISOString();

    return existing;
  }

  // New request — transition READY_FOR_SUBMISSION → SUBMITTED.
  const submittedRequest: MoveRequest = {
    ...request,
    status: transitionStatus(request.status, "SUBMITTED"),
    createdAt: request.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return createRequest(submittedRequest);
}
