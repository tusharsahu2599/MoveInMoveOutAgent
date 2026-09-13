import type { MoveRequest } from "../types/domain.js";
import {
  getRequestById,
  getRequests,
  updateRequest,
} from "./request.service.js";
import { transitionStatus } from "./workflow.service.js";
import { demoCommunity } from "../data/community.js";
import { demoUsers } from "../data/users.js";
import { validateMoveRequest } from "../rules/move.rules.js";

export interface AdminRequestView {
  request: MoveRequest;
  residentName: string;
  residentEmail: string;
  communityName: string;
  validation: {
    valid: boolean;
    issues: string[];
    warnings: string[];
  };
  recommendation: "APPROVE" | "REVIEW" | "REJECT";
  summary: string;
}

function buildRequestView(request: MoveRequest): AdminRequestView {
  const resident = demoUsers.find((user) => user.id === request.residentId);

  const validation = validateMoveRequest(request, demoCommunity);

  let recommendation: AdminRequestView["recommendation"] = "APPROVE";

  if (validation.issues.length > 0) {
    recommendation = "REJECT";
  } else if (validation.warnings.length > 0) {
    recommendation = "REVIEW";
  }

  const moveType = request.type === "MOVE_IN" ? "move-in" : "move-out";

  const summary =
    `${moveType.toUpperCase()} request from ${resident?.name ?? "Unknown resident"} ` +
    `for unit ${request.unitId}. ` +
    `Requested date: ${request.details.moveDate ?? "Not provided"}. ` +
    `Slot: ${request.details.slot ?? "Not provided"}. ` +
    `Moving company: ${request.details.movingCompany ?? "Not provided"}. ` +
    `Vehicle: ${request.details.vehicleNumber ?? "Not provided"}.`;

  return {
    request,
    residentName: resident?.name ?? "Unknown resident",
    residentEmail: resident?.email ?? "Unknown email",
    communityName: demoCommunity.name,
    validation,
    recommendation,
    summary,
  };
}

export function getAdminRequests(): AdminRequestView[] {
  return getRequests()
    .filter(
      (request) =>
        request.status === "SUBMITTED" ||
        request.status === "UNDER_REVIEW" ||
        request.status === "NEEDS_INFORMATION" ||
        request.status === "APPROVED" ||
        request.status === "REJECTED",
    )
    .map(buildRequestView);
}

export function getAdminRequestById(
  requestId: string,
): AdminRequestView | undefined {
  const request = getRequestById(requestId);

  if (!request) {
    return undefined;
  }

  return buildRequestView(request);
}

export function startReview(requestId: string): AdminRequestView {
  const request = getRequestById(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  request.status = transitionStatus(request.status, "UNDER_REVIEW");

  updateRequest(requestId, {
    status: request.status,
  });

  return buildRequestView(request);
}
export function approveRequest(requestId: string): AdminRequestView {
  const request = getRequestById(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  request.status = transitionStatus(request.status, "APPROVED");

  updateRequest(requestId, {
    status: request.status,
  });

  return buildRequestView(request);
}

export function rejectRequest(
  requestId: string,
  reason?: string,
): AdminRequestView {
  const request = getRequestById(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  request.status = transitionStatus(request.status, "REJECTED");

  updateRequest(requestId, {
    status: request.status,
    adminNote: reason?.trim() || "Request rejected by community admin.",
  });

  return buildRequestView(request);
}

export function requestMoreInformation(
  requestId: string,
  note?: string,
): AdminRequestView {
  const request = getRequestById(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  request.status = transitionStatus(request.status, "NEEDS_INFORMATION");

  updateRequest(requestId, {
    status: request.status,
    adminNote:
      note?.trim() ||
      "Additional information is required before this request can be approved.",
  });

  return buildRequestView(request);
}
