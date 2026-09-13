export interface ResidentRequest {
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
  details: {
    moveDate?: string;
    slot?: string;
    movingCompany?: string;
    vehicleNumber?: string;
    numberOfVehicles?: number;
    inspectionScheduled?: boolean;
    duesCleared?: boolean;
    accessCardsReturned?: boolean;
  };
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = "http://localhost:3001/api/resident";

async function request<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ?? data?.message ?? "Unable to retrieve resident request",
    );
  }

  if (data?.success === true) {
    return data.data;
  }

  return data as T;
}

export async function getResidentRequest(
  requestId: string,
): Promise<ResidentRequest> {
  return request<ResidentRequest>(`/requests/${requestId}`);
}

export async function getLatestResidentRequest(
  residentId: string,
): Promise<ResidentRequest | null> {
  return request<ResidentRequest | null>(
    `/requests?residentId=${encodeURIComponent(residentId)}`,
  );
}
