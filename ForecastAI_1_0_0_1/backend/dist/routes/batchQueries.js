"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
router.get("/batch/:batchId", async (req, res) => {
    try {
        const { batchId } = req.params;
        const queries = await prisma_1.prisma.batchQuery.findMany({
            where: { batchId },
            orderBy: { raisedAt: "asc" },
        });
        const repliesByParent = new Map();
        for (const query of queries) {
            if (query.parentId) {
                const replies = repliesByParent.get(query.parentId) || [];
                replies.push(query);
                repliesByParent.set(query.parentId, replies);
            }
        }
        res.json(queries
            .filter(query => !query.parentId)
            .map(query => ({ ...query, replies: repliesByParent.get(query.id) || [] })));
    }
    catch (error) {
        console.error("Failed to fetch batch queries:", error);
        res.status(500).json({ error: "Failed to fetch batch queries" });
    }
});
router.get("/open", async (req, res) => {
    try {
        const queries = await prisma_1.prisma.batchQuery.findMany({
            where: { status: "Open", parentId: null },
            orderBy: { raisedAt: "desc" },
        });
        res.json(queries);
    }
    catch (error) {
        console.error("Failed to fetch open batch queries:", error);
        res.status(500).json({ error: "Failed to fetch open batch queries" });
    }
});
router.post("/", async (req, res) => {
    try {
        const { batchId, query, raisedBy, parentId, repliedBy, messageType } = req.body;
        if (!batchId || !query || !raisedBy) {
            return res.status(400).json({ error: "batchId, query, and raisedBy are required" });
        }
        const created = await prisma_1.prisma.batchQuery.create({
            data: {
                batchId,
                query,
                raisedBy,
                parentId: parentId || null,
                repliedBy: repliedBy || raisedBy,
                messageType: messageType || (parentId ? "reply" : "query"),
                status: "Open",
            },
        });
        // Placeholder for future Graph API email notification to the target role.
        // This will be implemented later when Azure / Microsoft Graph is enabled.
        res.status(201).json(created);
    }
    catch (error) {
        console.error("Failed to create batch query:", error);
        res.status(500).json({ error: "Failed to raise batch query" });
    }
});
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { response, respondedBy, status } = req.body;
        const data = {};
        if (response) {
            data.response = response;
            data.respondedBy = respondedBy || "PL";
            data.respondedAt = new Date();
        }
        if (status) {
            data.status = status;
        }
        if (!response && !status) {
            return res.status(400).json({ error: "No valid update fields provided" });
        }
        const updated = await prisma_1.prisma.batchQuery.update({
            where: { id },
            data,
        });
        res.json(updated);
    }
    catch (error) {
        console.error("Failed to update batch query:", error);
        res.status(500).json({ error: "Failed to update batch query" });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        await prisma_1.prisma.batchQuery.deleteMany({ where: { parentId: req.params.id } });
        const { id } = req.params;
        await prisma_1.prisma.batchQuery.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Failed to delete batch query:", error);
        res.status(500).json({ error: "Failed to delete batch query" });
    }
});
exports.default = router;
