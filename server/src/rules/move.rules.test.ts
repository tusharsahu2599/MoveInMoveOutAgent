import {
  validateMoveRequest,
} from "./move.rules.js";

import { demoCommunity } from "../data/community.js";

import type { MoveRequest } from "../types/domain.js";

const validRequest: MoveRequest = {
  id: "MI-001",
  type: "MOVE_IN",
  status: "DRAFT",

  residentId: "resident-001",
  communityId: "community-001",
  unitId: "A-1204",

  details: {
    moveDate: "2026-09-14",
    slot: "10:00-11:00",
    movingCompany: "ABC Movers",
    vehicleNumber: "KA01AB1234",
  },

  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

console.log(
  validateMoveRequest(
    validRequest,
    demoCommunity
  )
);