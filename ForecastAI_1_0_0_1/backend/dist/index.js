"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const projectMaster_1 = __importDefault(require("./routes/projectMaster"));
const revenueRecord_1 = __importDefault(require("./routes/revenueRecord"));
const importBatch_1 = __importDefault(require("./routes/importBatch"));
const submission_1 = __importDefault(require("./routes/submission"));
const import_1 = __importDefault(require("./routes/import"));
const batches_1 = __importDefault(require("./routes/batches"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const projects_1 = __importDefault(require("./routes/projects"));
const data_1 = __importDefault(require("./routes/data"));
const revenues_1 = __importDefault(require("./routes/revenues"));
const comments_1 = __importDefault(require("./routes/comments"));
const batchQueries_1 = __importDefault(require("./routes/batchQueries"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT ?? 4000);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.json({ status: "ForecastAI backend is running" });
});
app.use("/api/project-masters", projectMaster_1.default);
app.use("/api/revenue-records", revenueRecord_1.default);
app.use("/api/import-batches", importBatch_1.default);
app.use("/api/imports", import_1.default);
app.use("/api/submissions", submission_1.default);
app.use("/api/batches", batches_1.default);
app.use("/api/dashboard", dashboard_1.default);
app.use("/api/projects", projects_1.default);
app.use("/api/data", data_1.default);
app.use("/api/revenues", revenues_1.default);
app.use("/api/comments", comments_1.default);
app.use("/api/batch-queries", batchQueries_1.default);
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
