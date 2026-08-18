"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
// Get all comments for a project
router.get("/project/:projectId", async (req, res) => {
    try {
        const { projectId } = req.params;
        const comments = await prisma_1.prisma.projectComment.findMany({
            where: { projectId },
            orderBy: { commentedAt: "desc" },
        });
        res.json(comments);
    }
    catch (e) {
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});
// Add a comment
router.post("/", async (req, res) => {
    try {
        const { projectId, comment, commentedBy } = req.body;
        if (!projectId || !comment || !commentedBy) {
            return res.status(400).json({ error: "projectId, comment and commentedBy are required" });
        }
        const newComment = await prisma_1.prisma.projectComment.create({
            data: { projectId, comment, commentedBy },
        });
        res.json(newComment);
    }
    catch (e) {
        res.status(500).json({ error: "Failed to create comment" });
    }
});
// Update comment status or add response
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response, respondedBy } = req.body;
        const data = {};
        if (status)
            data.status = status;
        if (response) {
            data.response = response;
            data.respondedBy = respondedBy;
            data.respondedAt = new Date();
            data.status = "Resolved";
        }
        const updated = await prisma_1.prisma.projectComment.update({
            where: { id },
            data,
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ error: "Failed to update comment" });
    }
});
// Delete a comment
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.projectComment.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: "Failed to delete comment" });
    }
});
exports.default = router;
