import type {
  Community,
  MoveRequest,
  MoveRequestType,
} from "../types/domain.js";

export interface RuleValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

function getDayName(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  return date
    .toLocaleDateString("en-US", {
      weekday: "long",
    })
    .toUpperCase();
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function isTimeWithinRange(
  time: string,
  startTime: string,
  endTime: string,
): boolean {
  const requested = timeToMinutes(time);
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  return requested >= start && requested <= end;
}

function validateRequiredFields(
  request: MoveRequest,
  requiredFields: string[],
): string[] {
  const issues: string[] = [];

  for (const field of requiredFields) {
    const value = request.details[field as keyof typeof request.details];

    if (value === undefined || value === null || value === "") {
      issues.push(`Missing required field: ${field}`);
    }
  }

  return issues;
}

export function validateMoveRequest(
  request: MoveRequest,
  community: Community,
): RuleValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  const rules =
    request.type === "MOVE_IN"
      ? community.configuration.moveIn
      : community.configuration.moveOut;

  // ------------------------------------------
  // Required fields
  // ------------------------------------------

  issues.push(...validateRequiredFields(request, rules.requiredFields));

  // ------------------------------------------
  // Date validation
  // ------------------------------------------

  if (request.details.moveDate) {
    const day = getDayName(request.details.moveDate);

    if (!rules.allowedDays.includes(day)) {
      issues.push(
        `Move ${request.type === "MOVE_IN" ? "in" : "out"} is not allowed on ${day}.`,
      );
    }
  }

  // ------------------------------------------
  // Time / slot validation
  // ------------------------------------------

  if (request.details.slot) {
    const startTime = request.details.slot.split("-")[0]?.trim();

    if (
      startTime &&
      !isTimeWithinRange(startTime, rules.startTime, rules.endTime)
    ) {
      issues.push(
        `Requested time ${startTime} is outside the allowed window of ${rules.startTime} to ${rules.endTime}.`,
      );
    }
  }

  // ------------------------------------------
  // Move-out specific rules
  // ------------------------------------------

  if (request.type === "MOVE_OUT") {
    const moveOutRules = community.configuration.moveOut;

    const details = request.details;

    if (
      moveOutRules.inspectionRequired &&
      "inspectionScheduled" in details &&
      details.inspectionScheduled !== true
    ) {
      warnings.push("Move-out inspection has not been scheduled.");
    }

    if (
      moveOutRules.duesClearanceRequired &&
      "duesCleared" in details &&
      details.duesCleared !== true
    ) {
      warnings.push("Outstanding dues clearance has not been confirmed.");
    }

    if (
      "accessCardsReturned" in details &&
      details.accessCardsReturned !== true
    ) {
      warnings.push("Access-card return has not been confirmed.");
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}
