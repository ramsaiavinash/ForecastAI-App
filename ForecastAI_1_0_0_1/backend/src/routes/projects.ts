import { Router } from "express";
import { prisma } from "../prisma";
const router = Router();

router.get("/", async (req, res) => {
  try {
    const { search, tower } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { projectDescription: { contains: search as string } },
        { customerDescription: { contains: search as string } },
        { projectId: { contains: search as string } },
      ];
    }
    if (tower) { where.tower = tower as string; }
    console.log("Fetching projects with filter:", JSON.stringify(where));
    const projects = await prisma.projectMaster.findMany({ where, orderBy: { projectDescription: "asc" } });
    console.log("Found projects:", projects.length);
    res.json(projects);
  } catch (e: any) {
    console.error("Error fetching projects:", e);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.projectMaster.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });
    const revenues = await prisma.monthlyRevenue.findMany({ where: { projectId: project.id }, orderBy: { month: "asc" } });
    const batchIds = [...new Set(revenues.map((r: any) => r.batchId))] as string[];
    const batchesRaw = await prisma.importBatch.findMany({ where: { id: { in: batchIds } }, orderBy: { importDate: "desc" } });
    const SR: any = {1:"Draft",2:"Under Review",3:"Approved PL",4:"Approved PH",5:"Locked"};
    const batches = batchesRaw.map((b: any) => ({ ...b, status: SR[b.statuscode] || "Draft", currentTotal: Number(b.currentTotal || 0), createdAt: b.importDate }));
    res.json({ project, revenues, batches });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

export default router;
