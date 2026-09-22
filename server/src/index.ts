import express from "express";
import cors from "cors";

import agentRoutes from "./routes/agent.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import residentRoutes from "./routes/resident.routes.js";

const app = express();

const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://move-in-move-out-agent-78qn9d9zt-tusharsahu2599s-projects.vercel.app/",
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    service: "anacity-move-agent",
    status: "healthy",
  });
});

app.use("/api/agent", agentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/resident", residentRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
