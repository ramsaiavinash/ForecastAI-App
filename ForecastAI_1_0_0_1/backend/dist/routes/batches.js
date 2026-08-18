"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const emailService_1 = require("../services/emailService");
const router = (0, express_1.Router)();
const STATUS_MAP = {
    "Draft": 1,
    "Under Review": 2,
    "Approved PL": 3,
    "Approved PH": 4,
    "Locked": 5,
};
const STATUS_REVERSE = {
    1: "Draft",
    2: "Under Review",
    3: "Approved PL",
    4: "Approved PH",
    5: "Locked",
};
const formatBatch = (batch) => ({
    ...batch,
    status: STATUS_REVERSE[batch.statuscode] || "Draft",
    currentTotal: Number(batch.currentTotal || 0),
    lastTotal: Number(batch.lastTotal || 0),
    variance: Number(batch.variance || 0),
    createdAt: batch.createdOn || batch.importDate || new Date().toISOString(),
    importDate: batch.importDate || batch.createdOn,
});
router.get("/", async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status && STATUS_MAP[status]) {
            where.statuscode = STATUS_MAP[status];
        }
        const batches = await prisma_1.prisma.importBatch.findMany({
            where,
            orderBy: { importDate: "desc" }
        });
        res.json(batches.map(formatBatch));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch batches" });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await prisma_1.prisma.importBatch.findUnique({ where: { id } });
        if (!batch)
            return res.status(404).json({ error: "Batch not found" });
        const revenues = await prisma_1.prisma.monthlyRevenue.findMany({
            where: { batchId: id }
        });
        const projectIds = [...new Set(revenues.map((r) => r.projectId))];
        const projects = await prisma_1.prisma.projectMaster.findMany({
            where: { id: { in: projectIds } }
        });
        res.json({
            batch: formatBatch(batch),
            revenues,
            projects,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch batch" });
    }
});
router.post("/", async (req, res) => {
    try {
        const data = req.body;
        const created = await prisma_1.prisma.importBatch.create({ data });
        res.status(201).json(formatBatch(created));
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create batch" });
    }
});
router.put("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const statuscode = STATUS_MAP[status] || 1;
        const updated = await prisma_1.prisma.importBatch.update({
            where: { id },
            data: { statuscode }
        });
        const formattedBatch = formatBatch(updated);
        // Send email notifications
        try {
            if (status === "Under Review") {
                await (0, emailService_1.sendPLApprovalEmail)(formattedBatch);
                console.log("PL approval email sent!");
            }
            else if (status === "Approved PL") {
                await (0, emailService_1.sendPHApprovalEmail)(formattedBatch);
                console.log("PH approval email sent!");
            }
        }
        catch (emailError) {
            console.error("Email sending failed:", emailError);
            // Don't fail the request if email fails
        }
        res.json(formattedBatch);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update batch status" });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.monthlyRevenue.deleteMany({ where: { batchId: id } });
        await prisma_1.prisma.importBatch.delete({ where: { id } });
        res.status(204).end();
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete batch" });
    }
});
exports.default = router;
