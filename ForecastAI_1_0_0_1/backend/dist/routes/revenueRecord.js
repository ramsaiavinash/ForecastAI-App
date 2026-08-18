"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    const records = await prisma_1.prisma.revenueRecord.findMany();
    res.json(records);
});
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const record = await prisma_1.prisma.revenueRecord.findUnique({ where: { id } });
    if (!record) {
        return res.status(404).json({ error: "RevenueRecord not found" });
    }
    res.json(record);
});
router.post("/", async (req, res) => {
    const data = req.body;
    const created = await prisma_1.prisma.revenueRecord.create({ data });
    res.status(201).json(created);
});
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const updated = await prisma_1.prisma.revenueRecord.update({ where: { id }, data });
    res.json(updated);
});
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.revenueRecord.delete({ where: { id } });
    res.status(204).end();
});
exports.default = router;
