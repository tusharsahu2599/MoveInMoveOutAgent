import type { MoveRequestStatus } from "../types/domain.js";

const allowedTransitions: Record<MoveRequestStatus, MoveRequestStatus[]> = {
  DRAFT: ["INCOMPLETE", "READY_FOR_SUBMISSION"],

  INCOMPLETE: ["READY_FOR_SUBMISSION"],

  READY_FOR_SUBMISSION: ["SUBMITTED"],

  SUBMITTED: ["UNDER_REVIEW"],

  UNDER_REVIEW: ["APPROVED", "REJECTED", "NEEDS_INFORMATION"],

  NEEDS_INFORMATION: ["UNDER_REVIEW", "NEEDS_INFORMATION"],

  APPROVED: [],

  REJECTED: [],
};

export function canTransition(
  current: MoveRequestStatus,
  next: MoveRequestStatus,
): boolean {
  return allowedTransitions[current].includes(next);
}

export function transitionStatus(
  current: MoveRequestStatus,
  next: MoveRequestStatus,
): MoveRequestStatus {
  if (!canTransition(current, next)) {
    throw new Error(`Invalid status transition: ${current} → ${next}`);
  }

  return next;
}
