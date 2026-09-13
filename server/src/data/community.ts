import type { Community } from "../types/domain.js";
export const demoCommunity: Community = {
  id: "community-001",
  name: "Green Valley Residency",

  configuration: {
    moveIn: {
      allowedDays: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
      ],

      startTime: "09:00",
      endTime: "18:00",

      requiredFields: [
        "moveDate",
        "slot",
        "movingCompany",
        "vehicleNumber",
      ],
    },

    moveOut: {
      allowedDays: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ],

      startTime: "09:00",
      endTime: "18:00",

      requiredFields: [
        "moveDate",
        "slot",
        "movingCompany",
        "vehicleNumber",
      ],

      inspectionRequired: true,
      duesClearanceRequired: true,
    },
  },
};