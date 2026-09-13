import { moveRequests, persistRequests } from "../data/requests.js";

import type { MoveRequest, MoveRequestStatus } from "../types/domain.js";

export function createRequest(request: MoveRequest): MoveRequest {
  moveRequests.push(request);
  persistRequests();

  return request;
}

export function getRequestById(requestId: string): MoveRequest | undefined {
  return moveRequests.find((request) => request.id === requestId);
}

export function getRequests(): MoveRequest[] {
  return moveRequests;
}

export function updateRequest(
  requestId: string,
  updates: Partial<MoveRequest>,
): MoveRequest {
  const request = getRequestById(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  Object.assign(request, updates);

  request.updatedAt = new Date().toISOString();

  persistRequests();

  return request;
}

export function updateRequestStatus(
  requestId: string,
  status: MoveRequestStatus,
): MoveRequest {
  return updateRequest(requestId, { status });
}

export function updateRequestDetails(
  requestId: string,
  details: Partial<MoveRequest["details"]>,
): MoveRequest {
  const request = getRequestById(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  request.details = {
    ...request.details,
    ...details,
  };

  request.updatedAt = new Date().toISOString();

  persistRequests();

  return request;
}
