import { Router } from "express";

import {
  listAdminRequests,
  getAdminRequest,
  reviewAdminRequest,
  approveAdminRequest,
  rejectAdminRequest,
  requestAdminInformation,
} from "../controllers/admin.controller.js";

const router = Router();

router.get("/requests", listAdminRequests);

router.get("/requests/:id", getAdminRequest);

router.post("/requests/:id/review", reviewAdminRequest);

router.post("/requests/:id/approve", approveAdminRequest);

router.post("/requests/:id/reject", rejectAdminRequest);

router.post("/requests/:id/needs-information", requestAdminInformation);

export default router;
