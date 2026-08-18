"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    const submissions = await prisma_1.prisma.submission.findMany();
    res.json(submissions);
});
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const submission = await prisma_1.prisma.submission.findUnique({ where: { id } });
    if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
    }
    res.json(submission);
});
router.post("/", async (req, res) => {
    const data = req.body;
    const created = await prisma_1.prisma.submission.create({ data });
    res.status(201).json(created);
});
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const updated = await prisma_1.prisma.submission.update({ where: { id }, data });
    res.json(updated);
});
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.submission.delete({ where: { id } });
    res.status(204).end();
});
exports.default = router;
