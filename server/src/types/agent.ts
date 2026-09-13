import type {
  MoveRequest,
  MoveRequestStatus,
  MoveRequestType,
} from "./domain.js";

export interface AgentContext {
  residentId: string;
  communityId: string;
  unitId: string;

  requestId?: string;

  requestType?: MoveRequestType;

  currentRequest?: MoveRequest;

  conversationHistory: ConversationMessage[];
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export type AgentAction =
  | "ASK_QUESTION"
  | "VALIDATE"
  | "SHOW_SUMMARY"
  | "SUBMIT_REQUEST"
  | "RECOMMEND"
  | "HANDOFF_TO_ADMIN"
  | "UPDATE_REQUEST";

export interface AgentResponse {
  message: string;

  action: AgentAction;

  status?: MoveRequestStatus;

  extractedData?: Record<string, unknown>;

  missingFields?: string[];

  validationIssues?: string[];

  request?: MoveRequest;
}
