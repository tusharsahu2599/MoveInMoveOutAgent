import type { Request, Response } from "express";
import {
  getAdminRequests,
  getAdminRequestById,
  startReview,
  approveRequest,
  rejectRequest,
  requestMoreInformation,
} from "../services/admin.service.js";

export function listAdminRequests(_req: Request, res: Response) {
  return res.json({
    success: true,
    data: getAdminRequests(),
  });
}

export function getAdminRequest(req: Request, res: Response) {
  const request = getAdminRequestById(String(req.params.id));

  if (!request) {
    return res.status(404).json({
      success: false,
      error: "Request not found",
    });
  }

  return res.json({
    success: true,
    data: request,
  });
}

export function reviewAdminRequest(req: Request, res: Response) {
  try {
    return res.json({
      success: true,
      data: startReview(String(req.params.id)),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unable to start review",
    });
  }
}

export function approveAdminRequest(req: Request, res: Response) {
  try {
    return res.json({
      success: true,
      data: approveRequest(String(req.params.id)),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Unable to approve request",
    });
  }
}

export function rejectAdminRequest(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const reason =
      typeof req.body?.reason === "string" ? req.body.reason : undefined;

    const result = rejectRequest(id, reason);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error ? error.message : "Unable to reject request",
    });
  }
}

export function requestAdminInformation(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const note = typeof req.body?.note === "string" ? req.body.note : undefined;

    const result = requestMoreInformation(id, note);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to request information",
    });
  }
}
