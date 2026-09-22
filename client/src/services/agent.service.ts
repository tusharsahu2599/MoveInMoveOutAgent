export interface AgentContext {
  residentId: string;
  communityId: string;
  unitId: string;
  requestId?: string;
  requestType?: "MOVE_IN" | "MOVE_OUT";
  currentRequest?: unknown;
  conversationHistory: {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
  }[];
}

export interface AgentResponse {
  message: string;
  action: string;
  status?: string;
  extractedData?: Record<string, unknown>;
  missingFields?: string[];
  validationIssues?: string[];
  request?: unknown;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export async function sendAgentMessage(
  message: string,
  context: AgentContext,
): Promise<AgentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/agent/message`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      message,
      context,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to communicate with agent");
  }

  const result = await response.json();

  return result.data;
}
