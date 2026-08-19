import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/batch/:batchId", async (req, res) => {
  try {
    const submissions = await prisma.projectSubmission.findMany({
      where: { batchId: req.params.batchId },
      orderBy: { submittedAt: "asc" },
    });
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch project submissions" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { batchId, projectIds, submittedBy } = req.body;
    if (!batchId || !Array.isArray(projectIds) || projectIds.length === 0 || !submittedBy) {
      return res.status(400).json({ error: "batchId, projectIds and submittedBy are required" });
    }

    const batchProjects = await prisma.monthlyRevenue.findMany({
      where: { batchId, projectId: { in: projectIds } },
      select: { projectId: true },
      distinct: ["projectId"],
    });
    const validProjectIds = batchProjects.map(project => project.projectId);

    const submissions = await prisma.$transaction(
      validProjectIds.map(projectId => prisma.projectSubmission.upsert({
        where: { batchId_projectId: { batchId, projectId } },
        update: { submittedBy, submittedAt: new Date(), status: "Submitted" },
        create: { batchId, projectId, submittedBy, status: "Submitted" },
      }))
    );

    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit projects" });
  }
});

export default router;
