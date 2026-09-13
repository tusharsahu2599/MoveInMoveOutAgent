import { extractMoveDetails } from "./llm.service.js";

const result = await extractMoveDetails(
  "I want to move into my apartment next Monday at 10 AM. ABC Movers will handle it and the vehicle number is CG04AB1234.",
  undefined,
  [],
);

console.log(JSON.stringify(result, null, 2));
