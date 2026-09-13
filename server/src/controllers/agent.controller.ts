import { MoveAgent } from "../agents/move-agents.js";

import type {
  AgentContext,
} from "../types/agent.js";

const moveAgent = new MoveAgent();

export async function processAgentMessage(
  message: string,
  context: AgentContext
) {
  return moveAgent.processMessage(
    message,
    context
  );
}