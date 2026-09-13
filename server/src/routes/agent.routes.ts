import { Router } from "express";

import {
  processAgentMessage,
} from "../controllers/agent.controller.js";

const router = Router();

router.post(
  "/message",
  async (req, res) => {
    try {
      const {
        message,
        context,
      } = req.body;

      if (
        typeof message !== "string" ||
        !message.trim()
      ) {
        return res.status(400).json({
          success: false,
          error:
            "message is required",
        });
      }

      const response =
        await processAgentMessage(
          message,
          context
        );

      return res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error(
        "Agent error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to process agent request",
      });
    }
  }
);

export default router;