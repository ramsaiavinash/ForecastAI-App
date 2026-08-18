"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    const projects = await prisma_1.prisma.projectMaster.findMany();
    res.json(projects);
});
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const project = await prisma_1.prisma.projectMaster.findUnique({ where: { id } });
    if (!project) {
        return res.status(404).json({ error: "ProjectMaster not found" });
    }
    res.json(project);
});
router.post("/", async (req, res) => {
    const data = req.body;
    const created = await prisma_1.prisma.projectMaster.create({ data });
    res.status(201).json(created);
});
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const updated = await prisma_1.prisma.projectMaster.update({ where: { id }, data });
    res.json(updated);
});
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.projectMaster.delete({ where: { id } });
    res.status(204).end();
});
exports.default = router;
