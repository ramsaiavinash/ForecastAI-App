"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    try {
        const { search, tower } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { projectDescription: { contains: search } },
                { customerDescription: { contains: search } },
                { projectId: { contains: search } },
            ];
        }
        if (tower) {
            where.tower = tower;
        }
        console.log("Fetching projects with filter:", JSON.stringify(where));
        const projects = await prisma_1.prisma.projectMaster.findMany({ where, orderBy: { projectDescription: "asc" } });
        console.log("Found projects:", projects.length);
        res.json(projects);
    }
    catch (e) {
        console.error("Error fetching projects:", e);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma_1.prisma.projectMaster.findUnique({ where: { id } });
        if (!project)
            return res.status(404).json({ error: "Project not found" });
        const revenues = await prisma_1.prisma.monthlyRevenue.findMany({ where: { projectId: project.id }, orderBy: { month: "asc" } });
        const batchIds = [...new Set(revenues.map((r) => r.batchId))];
        const batchesRaw = await prisma_1.prisma.importBatch.findMany({ where: { id: { in: batchIds } }, orderBy: { importDate: "desc" } });
        const SR = { 1: "Draft", 2: "Under Review", 3: "Approved PL", 4: "Approved PH", 5: "Locked" };
        const batches = batchesRaw.map((b) => ({ ...b, status: SR[b.statuscode] || "Draft", currentTotal: Number(b.currentTotal || 0), createdAt: b.importDate }));
        res.json({ project, revenues, batches });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch project" });
    }
});
exports.default = router;
