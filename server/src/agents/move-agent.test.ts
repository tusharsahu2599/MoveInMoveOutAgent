import { MoveAgent } from "./move-agents.js";

import type {
  AgentContext,
} from "../types/agent.js";

const agent = new MoveAgent();

let context: AgentContext = {
  residentId: "resident-001",
  communityId: "community-001",
  unitId: "A-1204",
  conversationHistory: [],
};

let response =
  await agent.processMessage(
    "I want to move in on 2026-09-14 at 10 AM",
    context
  );

console.log("\nAI:", response.message);

console.log(
  "\nMissing:",
  response.missingFields
);

// Simulate the user answering
context = {
  ...context,

  currentRequest: response.request,

  conversationHistory: [
    ...context.conversationHistory,

    {
      role: "user",
      content:
        "I want to move in on 2026-09-14 at 10 AM",
      timestamp: new Date().toISOString(),
    },

    {
      role: "assistant",
      content: response.message,
      timestamp: new Date().toISOString(),
    },
  ],
};

response =
  await agent.processMessage(
    "The moving company is ABC Movers",
    context
  );

console.log("\nAI:", response.message);

console.log(
  "\nMissing:",
  response.missingFields
);