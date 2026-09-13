import type { MoveRequest, MoveRequestType } from "../types/domain.js";
import type { AgentContext, AgentResponse } from "../types/agent.js";
import { validateMoveRequest } from "../rules/move.rules.js";
import { demoCommunity } from "../data/community.js";
import { extractMoveDetails } from "../services/llm.service.js";
import { submitMoveRequest } from "../services/submission.service.js";
import {
  updateRequest,
  updateRequestDetails,
} from "../services/request.service.js";
import { transitionStatus } from "../services/workflow.service.js";

export class MoveAgent {
  async processMessage(
    message: string,
    context: AgentContext,
  ): Promise<AgentResponse> {
    const normalizedMessage = message.toLowerCase().trim();

    // --------------------------------------------------
    // Handle resident response to an admin information request
    // --------------------------------------------------

    if (
      context.currentRequest &&
      context.currentRequest.status === "NEEDS_INFORMATION"
    ) {
      const existingRequest = context.currentRequest;
      const requestType = existingRequest.type;

      const extractedData = this.extractInformation(message, requestType);

      const hasExtractedInformation = Object.keys(extractedData).length > 0;

      if (!hasExtractedInformation) {
        return {
          message:
            existingRequest.adminNote ??
            "Please provide the additional information requested by the community admin.",
          action: "ASK_QUESTION",
          status: existingRequest.status,
          request: existingRequest,
        };
      }

      try {
        const updatedRequest = updateRequestDetails(
          existingRequest.id,
          extractedData as Partial<MoveRequest["details"]>,
        );

        const nextStatus = transitionStatus(
          updatedRequest.status,
          "UNDER_REVIEW",
        );

        const persistedRequest = updateRequest(existingRequest.id, {
          status: nextStatus,
        });

        return {
          message:
            "Thanks. I've updated your move request with the information you provided.\n\n" +
            "Your request has been sent back to the community admin for review.",
          action: "UPDATE_REQUEST",
          status: nextStatus,
          extractedData,
          request: persistedRequest,
        };
      } catch (error) {
        console.error(
          "Unable to update request after admin information request:",
          error,
        );

        return {
          message:
            "I couldn't update your request right now. Please try again.",
          action: "VALIDATE",
          request: existingRequest,
        };
      }
    }

    const isConfirmation =
      /^(yes|yes[, ]+(please[ ,]*)?submit( it)?|submit( it)?|confirm(ed)?|looks (good|correct)|proceed|go ahead)$/i.test(
        normalizedMessage,
      );
    if (
      isConfirmation &&
      context.currentRequest &&
      context.currentRequest.status === "READY_FOR_SUBMISSION"
    ) {
      try {
        const submittedRequest = submitMoveRequest(context.currentRequest);

        return {
          message:
            `Your ${
              submittedRequest.type === "MOVE_IN" ? "move-in" : "move-out"
            } request has been submitted successfully.\n\n` +
            `Request ID: ${submittedRequest.id}\n` +
            `Status: ${submittedRequest.status}\n\n` +
            `The community admin can now review your request.`,
          action: "SUBMIT_REQUEST",
          status: submittedRequest.status,
          request: submittedRequest,
        };
      } catch (error) {
        console.error("Submission error:", error);

        return {
          message:
            "I couldn't submit the request right now. Please review the details and try again.",
          action: "VALIDATE",
          request: context.currentRequest,
        };
      }
    }
    // ------------------------
    // llm
    // ----------------------
    try {
      const llmData = await extractMoveDetails(
        message,
        context.currentRequest,
        context.conversationHistory,
      );

      const extractedData = Object.fromEntries(
        Object.entries(llmData).filter(([, value]) => value !== null),
      );

      const existingDetails = context.currentRequest?.details ?? {};

      const details = {
        ...existingDetails,
        ...extractedData,
      };

      const requestType =
        llmData.requestType ??
        context.requestType ??
        context.currentRequest?.type;

      if (!requestType) {
        return {
          message:
            "Sure. I can help with your move. Would you like to raise a move-in or move-out request?",
          action: "ASK_QUESTION",
          extractedData,
        };
      }

      const temporaryRequest: MoveRequest = {
        id: context.requestId ?? `temp-${Date.now()}`,
        type: requestType,
        // status: "DRAFT",
        status: "READY_FOR_SUBMISSION",
        residentId: context.residentId,
        communityId: context.communityId,
        unitId: context.unitId,
        details,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const validation = validateMoveRequest(temporaryRequest, demoCommunity);

      const missingFields = validation.issues
        .filter((issue) => issue.startsWith("Missing required field:"))
        .map((issue) => issue.replace("Missing required field: ", ""));

      if (missingFields.length > 0) {
        const nextField = missingFields[0];

        const questions: Record<string, string> = {
          moveDate: "What date would you like to move?",
          slot: "What time slot would you prefer?",
          movingCompany: "Which moving company will you be using?",
          vehicleNumber: "What is the vehicle registration number?",
        };

        return {
          message: questions[nextField] ?? `Please provide the ${nextField}.`,
          action: "ASK_QUESTION",
          extractedData,
          missingFields,
          validationIssues: validation.issues,
          request: temporaryRequest,
        };
      }

      if (!validation.valid) {
        return {
          message:
            "I found an issue with the request. Let me help you correct it.",
          action: "VALIDATE",
          extractedData,
          validationIssues: validation.issues,
          request: temporaryRequest,
        };
      }

      return {
        message: `
I have all the required information.

Move type: ${requestType === "MOVE_IN" ? "Move-in" : "Move-out"}
Date: ${details.moveDate}
Time: ${details.slot}
Moving company: ${details.movingCompany}
Vehicle: ${details.vehicleNumber}

Please review these details before submitting your request.
    `.trim(),
        action: "SHOW_SUMMARY",
        extractedData,
        request: temporaryRequest,
      };
    } catch (error) {
      console.warn(
        "LLM unavailable, falling back to deterministic agent:",
        error,
      );
    }

    // ------------------------------------------
    // 1. Determine move type
    // ------------------------------------------

    // let requestType = context.requestType;
    let requestType = context.requestType ?? context.currentRequest?.type;

    if (!requestType) {
      if (
        normalizedMessage.includes("move in") ||
        normalizedMessage.includes("moving in") ||
        normalizedMessage.includes("move into") ||
        normalizedMessage.includes("moving into") ||
        normalizedMessage.includes("shift into") ||
        normalizedMessage.includes("shifting into")
      ) {
        requestType = "MOVE_IN";
      }

      if (
        normalizedMessage.includes("move out") ||
        normalizedMessage.includes("moving out") ||
        normalizedMessage.includes("vacate") ||
        normalizedMessage.includes("vacating") ||
        normalizedMessage.includes("leaving the apartment") ||
        normalizedMessage.includes("shift out")
      ) {
        requestType = "MOVE_OUT";
      }
    }

    if (!requestType) {
      return {
        message:
          "I can help you with either a move-in or move-out request. Which one would you like to arrange?",
        action: "ASK_QUESTION",
      };
    }

    // ------------------------------------------
    // 2. Extract information
    // ------------------------------------------

    const extractedData = this.extractInformation(message, requestType);

    // ------------------------------------------
    // 3. Merge with existing request context
    // ------------------------------------------

    const existingDetails = context.currentRequest?.details ?? {};

    const details = {
      ...existingDetails,
      ...extractedData,
    };

    // ------------------------------------------
    // 4. Determine missing fields
    // ------------------------------------------

    const missingFields = this.getMissingFields(requestType, details);

    // ------------------------------------------
    // 5. If information is missing,
    //    ask the next useful question
    // ------------------------------------------

    if (missingFields.length > 0) {
      return {
        message: this.questionForField(missingFields[0], requestType),

        action: "ASK_QUESTION",

        extractedData,

        missingFields,
      };
    }

    // ------------------------------------------
    // 6. Build temporary request
    // ------------------------------------------

    const request: MoveRequest = {
      id: context.requestId ?? `TEMP-${Date.now()}`,

      type: requestType,

      // status: "DRAFT",
      status: "READY_FOR_SUBMISSION",

      residentId: context.residentId,

      communityId: context.communityId,

      unitId: context.unitId,

      details,

      createdAt: context.currentRequest?.createdAt ?? new Date().toISOString(),

      updatedAt: new Date().toISOString(),
    };

    // ------------------------------------------
    // 7. Validate using deterministic rules
    // ------------------------------------------

    const validation = validateMoveRequest(request, demoCommunity);

    if (!validation.valid) {
      return {
        message:
          `I found a few issues with the request:\n\n` +
          validation.issues.map((issue) => `• ${issue}`).join("\n"),

        action: "VALIDATE",

        extractedData,

        missingFields: [],

        validationIssues: validation.issues,

        request,
      };
    }

    // ------------------------------------------
    // 8. Request is complete
    // ------------------------------------------

    return {
      message:
        "Great! I have all the information needed for your move request.\n\n" +
        'Please review the summary above. If everything looks correct, reply with "Yes, submit it".',

      action: "SHOW_SUMMARY",

      extractedData,

      missingFields: [],

      request,
    };
  }

  // ==================================================
  // INFORMATION EXTRACTION
  // ==================================================

  private extractInformation(
    message: string,
    requestType: MoveRequestType,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // ------------------------------------------
    // Normalize only for matching.
    // Keep the original message for extracted values.
    // ------------------------------------------
    const normalizedMessage = message.toLowerCase();

    // ------------------------------------------
    // Date
    // ------------------------------------------

    // ISO format:
    // 2026-09-14
    const isoDateMatch = message.match(/\b(\d{4}-\d{2}-\d{2})\b/);

    if (isoDateMatch) {
      result.moveDate = isoDateMatch[1];
    }

    // Month-name formats:
    // September 14, 2026
    // Sep 14, 2026
    // September 14 2026
    if (!result.moveDate) {
      const monthDateMatch = message.match(
        /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(\d{4})\b/i,
      );

      if (monthDateMatch) {
        const [, monthName, day, year] = monthDateMatch;

        const monthMap: Record<string, number> = {
          january: 0,
          february: 1,
          march: 2,
          april: 3,
          may: 4,
          june: 5,
          july: 6,
          august: 7,
          september: 8,
          october: 9,
          november: 10,
          december: 11,

          jan: 0,
          feb: 1,
          mar: 2,
          apr: 3,
          jun: 5,
          jul: 6,
          aug: 7,
          sep: 8,
          sept: 8,
          oct: 9,
          nov: 10,
          dec: 11,
        };

        const month = monthMap[monthName.toLowerCase()];
        const numericDay = Number(day);
        const numericYear = Number(year);

        if (month !== undefined) {
          const date = new Date(numericYear, month, numericDay);

          // Prevent invalid dates such as February 31.
          if (
            date.getFullYear() === numericYear &&
            date.getMonth() === month &&
            date.getDate() === numericDay
          ) {
            result.moveDate = `${numericYear}-${String(month + 1).padStart(2, "0")}-${String(numericDay).padStart(2, "0")}`;
          }
        }
      }
    }

    // Day-month-year format:
    // 14 September 2026
    if (!result.moveDate) {
      const dayMonthDateMatch = message.match(
        /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{4})\b/i,
      );

      if (dayMonthDateMatch) {
        const [, day, monthName, year] = dayMonthDateMatch;

        const monthMap: Record<string, number> = {
          january: 0,
          february: 1,
          march: 2,
          april: 3,
          may: 4,
          june: 5,
          july: 6,
          august: 7,
          september: 8,
          october: 9,
          november: 10,
          december: 11,

          jan: 0,
          feb: 1,
          mar: 2,
          apr: 3,
          jun: 5,
          jul: 6,
          aug: 7,
          sep: 8,
          sept: 8,
          oct: 9,
          nov: 10,
          dec: 11,
        };

        const month = monthMap[monthName.toLowerCase()];
        const numericDay = Number(day);
        const numericYear = Number(year);

        if (month !== undefined) {
          const date = new Date(numericYear, month, numericDay);

          if (
            date.getFullYear() === numericYear &&
            date.getMonth() === month &&
            date.getDate() === numericDay
          ) {
            result.moveDate = `${numericYear}-${String(month + 1).padStart(2, "0")}-${String(numericDay).padStart(2, "0")}`;
          }
        }
      }
    }

    // Natural-language dates
    if (!result.moveDate) {
      if (normalizedMessage.includes("tomorrow")) {
        const tomorrow = new Date();

        tomorrow.setDate(tomorrow.getDate() + 1);

        result.moveDate = tomorrow.toISOString().split("T")[0];
      }
    }

    // ------------------------------------------
    // Time
    // ------------------------------------------

    const timeMatch = message.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);

    if (timeMatch) {
      let hour = Number(timeMatch[1]);

      const minutes = Number(timeMatch[2] ?? "00");

      const period = timeMatch[3].toLowerCase();

      if (period === "pm" && hour !== 12) {
        hour += 12;
      }

      if (period === "am" && hour === 12) {
        hour = 0;
      }

      const endHour = hour + 2;

      if (endHour <= 23) {
        result.slot =
          `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}-` +
          `${String(endHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      }
    }

    // ------------------------------------------
    // Vehicle number
    // ------------------------------------------

    const vehicleMatch = message.match(/\b[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}\b/i);

    if (vehicleMatch) {
      result.vehicleNumber = vehicleMatch[0].toUpperCase();
    }

    // ------------------------------------------
    // Moving company
    // ------------------------------------------

    const companyPatterns = [
      // "ABC Movers will handle it"
      /\b([A-Z][A-Za-z0-9&.'-]{1,30})\s+(Movers?|Packers?)\b/,

      // "ABC Movers"
      /\b([A-Za-z0-9&.'-]{2,30})\s+(Movers?|Packers?)\b/i,

      // "moving company is ABC Logistics"
      /(?:moving company|company)\s+(?:is|:)\s+([A-Za-z][A-Za-z0-9&.'-]*(?:\s+[A-Za-z][A-Za-z0-9&.'-]*){0,3})(?=\s+(?:will|is|and|with|using)\b|[,.]|$)/i,
    ];

    for (const pattern of companyPatterns) {
      const companyMatch = message.match(pattern);

      if (companyMatch?.[1]) {
        const suffix = companyMatch[2];

        result.movingCompany = suffix
          ? `${companyMatch[1]} ${suffix}`.trim()
          : companyMatch[1].trim();

        break;
      }
    }

    // ------------------------------------------
    // Move-out confirmations
    // ------------------------------------------

    if (requestType === "MOVE_OUT") {
      const positive =
        /\b(yes|yeah|yep|sure|confirmed|done|cleared|scheduled)\b/i;

      const negative = /\b(no|not|nope|pending|outstanding)\b/i;

      if (/inspection/i.test(message) && positive.test(message)) {
        result.inspectionScheduled = true;
      }

      if (/inspection/i.test(message) && negative.test(message)) {
        result.inspectionScheduled = false;
      }

      if (
        /(dues|outstanding dues|payment)/i.test(message) &&
        positive.test(message)
      ) {
        result.duesCleared = true;
      }

      if (
        /(dues|outstanding dues|payment)/i.test(message) &&
        negative.test(message)
      ) {
        result.duesCleared = false;
      }

      if (
        /(access card|access cards|card return)/i.test(message) &&
        positive.test(message)
      ) {
        result.accessCardsReturned = true;
      }

      if (
        /(access card|access cards|card return)/i.test(message) &&
        negative.test(message)
      ) {
        result.accessCardsReturned = false;
      }
    }

    return result;
  }

  // ==================================================
  // MISSING INFORMATION
  // ==================================================

  private getMissingFields(
    requestType: MoveRequestType,
    details: Record<string, unknown>,
  ): string[] {
    const requiredFields =
      requestType === "MOVE_IN"
        ? ["moveDate", "slot", "movingCompany", "vehicleNumber"]
        : [
            "moveDate",
            "slot",
            "movingCompany",
            "vehicleNumber",
            "inspectionScheduled",
            "duesCleared",
            "accessCardsReturned",
          ];

    return requiredFields.filter(
      (field) =>
        details[field] === undefined ||
        details[field] === null ||
        details[field] === "",
    );
  }

  // ==================================================
  // QUESTION GENERATOR
  // ==================================================

  private questionForField(
    field: string,
    requestType: MoveRequestType,
  ): string {
    const questions: Record<string, string> = {
      moveDate: `When are you planning to move ${
        requestType === "MOVE_IN" ? "in" : "out"
      }? Please provide the date in YYYY-MM-DD format.`,

      slot: "What time would you prefer for the move? Please provide a time such as 10 AM.",

      movingCompany: "Which moving company will you be using?",

      vehicleNumber:
        "What is the vehicle registration number that the movers will use?",

      inspectionScheduled:
        "Has your move-out inspection been scheduled? Please answer yes or no.",

      duesCleared:
        "Have your outstanding community dues been cleared? Please answer yes or no.",

      accessCardsReturned:
        "Will you return all community access cards? Please answer yes or no.",
    };
    return (
      questions[field] ??
      "Please provide the remaining information for your move request."
    );
  }
}
