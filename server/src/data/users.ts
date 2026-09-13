import type { User } from "../types/domain.js";

export const demoUsers: User[] = [
  {
    id: "resident-001",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    role: "RESIDENT",
    communityId: "community-001",
    unitId: "A-1204",
  },

  {
    id: "admin-001",
    name: "Priya Admin",
    email: "admin@example.com",
    role: "ADMIN",
    communityId: "community-001",
  },
];