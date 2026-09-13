import OpenAI from "openai";
import "dotenv/config";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ OPENAI_API_KEY is not configured. LLM mode will be unavailable.");
}

const client = apiKey ? new OpenAI({ apiKey }) : null;

export interface MoveExtraction {
  requestType?: "MOVE_IN" | "MOVE_OUT";
  moveDate?: string;
  slot?: string;
  movingCompany?: string;
  vehicleNumber?: string;
  numberOfVehicles?: number;
}

export async function extractMoveDetails(
  message: string,
  currentRequest?: unknown,
  conversationHistory?: unknown,
): Promise<MoveExtraction> {
  if (!client) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "move_request_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            requestType: {
              type: ["string", "null"],
              enum: ["MOVE_IN", "MOVE_OUT", null],
            },
            moveDate: {
              type: ["string", "null"],
            },
            slot: {
              type: ["string", "null"],
            },
            movingCompany: {
              type: ["string", "null"],
            },
            vehicleNumber: {
              type: ["string", "null"],
            },
            numberOfVehicles: {
              type: ["number", "null"],
            },
          },
          required: [
            "requestType",
            "moveDate",
            "slot",
            "movingCompany",
            "vehicleNumber",
            "numberOfVehicles",
          ],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "system",
        content: `
You are the information extraction component of ANACITY's move-in/move-out workflow.

Your job is ONLY to extract structured information from the user's message.

IMPORTANT:
- Never copy surrounding conversational text into a field.
- Never invent information.
- If a value is not present, return null.
- Extract only the actual value belonging to each field.

REQUEST TYPE:
- "move in", "moving in", "move into", "shift into" => MOVE_IN
- "move out", "moving out", "vacate", "leave the apartment" => MOVE_OUT

DATE:
- Convert explicit dates to YYYY-MM-DD.
- Resolve natural-language dates such as:
  - tomorrow
  - next Monday
  - this Friday
  - September 20
- Use the current date as the reference date.
- Current date: 2026-09-13.
- If the user says "next Monday", return 2026-09-14.

TIME:
- Convert times into a two-hour slot.
- Example: "10 AM" => "10:00-12:00"
- Example: "2 PM" => "14:00-16:00"
- Example: "around 11 in the morning" => "11:00-13:00"

MOVING COMPANY:
- Extract ONLY the company name.
- Example:
  "ABC Movers will handle it"
  => "ABC Movers"
- Do NOT return text such as:
  "will handle it and the vehicle number is..."

VEHICLE NUMBER:
- Extract ONLY the registration number.
- Example:
  "vehicle number is CG04AB1234"
  => "CG04AB1234"

NUMBER OF VEHICLES:
- Extract a numeric value only when explicitly provided.

Current request context:
${JSON.stringify(currentRequest ?? null)}

Conversation history:
${JSON.stringify(conversationHistory ?? [])}
`,
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("LLM returned an empty response");
  }

  return JSON.parse(content) as MoveExtraction;
}