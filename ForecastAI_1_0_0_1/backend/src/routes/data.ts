import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.delete("/clear", async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.projectSubmission.deleteMany(),
      prisma.batchQuery.deleteMany(),
      prisma.projectComment.deleteMany(),
      prisma.submissionSummary.deleteMany(),
      prisma.monthlyRevenue.deleteMany(),
      prisma.importBatch.deleteMany(),
      prisma.projectMaster.deleteMany(),
    ]);

    res.status(204).end();
  } catch (error) {
    console.error("Failed to clear data:", error);
    res.status(500).json({ error: "Failed to clear data" });
  }
});

export default router;