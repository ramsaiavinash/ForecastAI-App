import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.delete("/clear", async (req, res) => {
  try {
    await prisma.monthlyRevenue.deleteMany();
    await prisma.projectMaster.deleteMany();
    await prisma.importBatch.deleteMany();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Failed to clear data" });
  }
});

export default router;