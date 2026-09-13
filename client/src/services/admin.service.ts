export interface MoveRequestDetails {
  moveDate?: string;
  slot?: string;
  movingCompany?: string;
  vehicleNumber?: string;
  numberOfVehicles?: number;
  inspectionScheduled?: boolean;
  duesCleared?: boolean;
  accessCardsReturned?: boolean;
}

export interface MoveRequest {
  id: string;
  type: "MOVE_IN" | "MOVE_OUT";
  status:
    | "DRAFT"
    | "INCOMPLETE"
    | "READY_FOR_SUBMISSION"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "NEEDS_INFORMATION"
    | "APPROVED"
    | "REJECTED";
  residentId: string;
  communityId: string;
  unitId: string;
  details: MoveRequestDetails;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRequest {
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

const API_BASE_URL = "http://localhost:3001/api/admin";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Admin API request failed");
  }

  // Supports the API's { success, data } response format.
  if (data?.success === true) {
    return data.data;
  }

  // Also supports a direct response object if an endpoint returns one.
  if (data?.data !== undefined) {
    return data.data;
  }

  return data as T;
}

export async function getAdminRequests(): Promise<AdminRequest[]> {
  return request<AdminRequest[]>("/requests");
}

export async function getAdminRequest(
  requestId: string,
): Promise<AdminRequest> {
  return request<AdminRequest>(`/requests/${requestId}`);
}

export async function startReview(requestId: string): Promise<AdminRequest> {
  return request<AdminRequest>(`/requests/${requestId}/review`, {
    method: "POST",
  });
}

export async function approveRequest(requestId: string): Promise<AdminRequest> {
  return request<AdminRequest>(`/requests/${requestId}/approve`, {
    method: "POST",
  });
}

export async function rejectRequest(
  requestId: string,
  reason: string,
): Promise<AdminRequest> {
  return request<AdminRequest>(`/requests/${requestId}/reject`, {
    method: "POST",
    body: JSON.stringify({
      reason,
    }),
  });
}

export async function requestMoreInformation(
  requestId: string,
  note: string,
): Promise<AdminRequest> {
  return request<AdminRequest>(`/requests/${requestId}/needs-information`, {
    method: "POST",
    body: JSON.stringify({
      note,
    }),
  });
}
