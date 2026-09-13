export type UserRole = "RESIDENT" | "ADMIN";

export type MoveRequestType = "MOVE_IN" | "MOVE_OUT";

export type MoveRequestStatus =
  | "DRAFT"
  | "INCOMPLETE"
  | "READY_FOR_SUBMISSION"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_INFORMATION"
  | "APPROVED"
  | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  communityId: string;
  unitId?: string;
}

export interface CommunityMoveInRules {
  allowedDays: string[];
  startTime: string;
  endTime: string;
  requiredFields: string[];
}

export interface CommunityMoveOutRules {
  allowedDays: string[];
  startTime: string;
  endTime: string;
  requiredFields: string[];
  inspectionRequired: boolean;
  duesClearanceRequired: boolean;
}

export interface CommunityConfiguration {
  moveIn: CommunityMoveInRules;
  moveOut: CommunityMoveOutRules;
}

export interface Community {
  id: string;
  name: string;
  configuration: CommunityConfiguration;
}

export interface MoveInDetails {
  moveDate?: string;
  slot?: string;
  movingCompany?: string;
  vehicleNumber?: string;
  numberOfVehicles?: number;
}

export interface MoveOutDetails {
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
  type: MoveRequestType;
  status: MoveRequestStatus;
  residentId: string;
  communityId: string;
  unitId: string;
  details: MoveInDetails | MoveOutDetails;
  aiSummary?: string;
  aiRecommendation?: string;

  adminNote?: string;

  createdAt: string;
  updatedAt: string;
}
