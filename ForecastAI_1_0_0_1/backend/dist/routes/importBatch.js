"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    const batches = await prisma_1.prisma.importBatch.findMany();
    res.json(batches);
});
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const batch = await prisma_1.prisma.importBatch.findUnique({ where: { id } });
    if (!batch) {
        return res.status(404).json({ error: "ImportBatch not found" });
    }
    res.json(batch);
});
router.post("/", async (req, res) => {
    const data = req.body;
    const created = await prisma_1.prisma.importBatch.create({ data });
    res.status(201).json(created);
});
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const updated = await prisma_1.prisma.importBatch.update({ where: { id }, data });
    res.json(updated);
});
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.importBatch.delete({ where: { id } });
    res.status(204).end();
});
exports.default = router;
