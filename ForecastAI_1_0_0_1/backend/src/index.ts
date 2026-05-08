import express from "express";
import cors from "cors";
import projectMasterRouter from "./routes/projectMaster";
import revenueRecordRouter from "./routes/revenueRecord";
import importBatchRouter from "./routes/importBatch";
import submissionRouter from "./routes/submission";
import importRouter from "./routes/import";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ForecastAI backend is running" });
});

app.use("/api/project-masters", projectMasterRouter);
app.use("/api/revenue-records", revenueRecordRouter);
app.use("/api/import-batches", importBatchRouter);
app.use("/api/imports", importRouter);
app.use("/api/submissions", submissionRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
