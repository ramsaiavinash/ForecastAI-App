"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
router.delete("/clear", async (req, res) => {
    try {
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.projectSubmission.deleteMany(),
            prisma_1.prisma.batchQuery.deleteMany(),
            prisma_1.prisma.projectComment.deleteMany(),
            prisma_1.prisma.submissionSummary.deleteMany(),
            prisma_1.prisma.monthlyRevenue.deleteMany(),
            prisma_1.prisma.importBatch.deleteMany(),
            prisma_1.prisma.projectMaster.deleteMany(),
        ]);
        res.status(204).end();
    }
    catch (error) {
        console.error("Failed to clear data:", error);
        res.status(500).json({ error: "Failed to clear data" });
    }
});
exports.default = router;
