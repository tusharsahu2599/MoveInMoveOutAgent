import express from "express";
import cors from "cors";

import agentRoutes from "./routes/agent.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import residentRoutes from "./routes/resident.routes.js";

const app = express();

const PORT = 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
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

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
