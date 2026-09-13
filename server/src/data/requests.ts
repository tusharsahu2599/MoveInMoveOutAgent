import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { MoveRequest } from "../types/domain.js";

const requestsFile = resolve(process.cwd(), "src/data/requests.json");

function loadRequests(): MoveRequest[] {
  if (!existsSync(requestsFile)) {
    writeFileSync(requestsFile, "[]", "utf-8");
    return [];
  }

  try {
    const contents = readFileSync(requestsFile, "utf-8");

    if (!contents.trim()) {
      return [];
    }

    return JSON.parse(contents) as MoveRequest[];
  } catch {
    console.error("Unable to read requests.json");
    return [];
  }
}

export const moveRequests: MoveRequest[] = loadRequests();

export function persistRequests(): void {
  writeFileSync(requestsFile, JSON.stringify(moveRequests, null, 2), "utf-8");
}
