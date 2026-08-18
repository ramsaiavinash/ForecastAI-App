"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const updated = await prisma_1.prisma.monthlyRevenue.update({
            where: { id },
            data: { amount: Number(amount) },
        });
        res.json(updated);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update revenue" });
    }
});
exports.default = router;
