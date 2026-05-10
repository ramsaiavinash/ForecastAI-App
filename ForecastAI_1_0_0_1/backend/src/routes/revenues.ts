import { Router } from "express";
import { prisma } from "../prisma";
const router = Router();

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const updated = await prisma.monthlyRevenue.update({
      where: { id },
      data: { amount: Number(amount) },
    });
    res.json(updated);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "Failed to update revenue" });
  }
});

export default router;
