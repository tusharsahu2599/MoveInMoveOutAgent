import { Router } from "express";
import { getRequestById, getRequests } from "../services/request.service.js";

const router = Router();

// Get latest request for a resident
router.get("/requests", (req, res) => {
  try {
    const residentId = String(req.query.residentId ?? "");

    if (!residentId) {
      return res.status(400).json({
        success: false,
        error: "residentId is required",
      });
    }

    const requests = getRequests()
      .filter((request) => request.residentId === residentId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

    return res.json({
      success: true,
      data: requests[0] ?? null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to retrieve resident request",
    });
  }
});

// Get a specific resident request
router.get("/requests/:id", (req, res) => {
  try {
    const requestId = String(req.params.id);

    const request = getRequestById(requestId);

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
  } catch (error) {
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Unable to retrieve request",
    });
  }
});

export default router;
