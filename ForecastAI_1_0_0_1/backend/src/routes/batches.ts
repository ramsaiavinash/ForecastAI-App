import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

const STATUS_MAP: Record<string, number> = {
  "Draft": 1,
  "Under Review": 2,
  "Approved PL": 3,
  "Approved PH": 4,
  "Locked": 5,
};

const STATUS_REVERSE: Record<number, string> = {
  1: "Draft",
  2: "Under Review",
  3: "Approved PL",
  4: "Approved PH",
  5: "Locked",
};

const formatBatch = (batch: any) => ({
  ...batch,
  status: STATUS_REVERSE[batch.statuscode] || "Draft",
  currentTotal: Number(batch.currentTotal || 0),
  lastTotal: Number(batch.lastTotal || 0),
  variance: Number(batch.variance || 0),
  createdAt: batch.createdOn || batch.importDate || new Date().toISOString(),
  importDate: batch.importDate || batch.createdOn,
});

router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && STATUS_MAP[status as string]) {
      where.statuscode = STATUS_MAP[status as string];
    }
    const batches = await prisma.importBatch.findMany({
      where,
      orderBy: { importDate: "desc" }
    });
    res.json(batches.map(formatBatch));
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch batches" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await prisma.importBatch.findUnique({ where: { id } });
    if (!batch) return res.status(404).json({ error: "Batch not found" });

    const revenues = await prisma.monthlyRevenue.findMany({
      where: { batchId: id }
    });
    const projectIds = [...new Set(revenues.map((r: any) => r.projectId))];
    const projects = await prisma.projectMaster.findMany({
      where: { id: { in: projectIds } }
    });

    res.json({
      batch: formatBatch(batch),
      revenues,
      projects,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch batch" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const created = await prisma.importBatch.create({ data });
    res.status(201).json(formatBatch(created));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create batch" });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const statuscode = STATUS_MAP[status] || 1;
    const updated = await prisma.importBatch.update({
      where: { id },
      data: { statuscode }
    });
    res.json(formatBatch(updated));
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to update batch status" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.monthlyRevenue.deleteMany({ where: { batchId: id } });
    await prisma.importBatch.delete({ where: { id } });
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete batch" });
  }
});

export default router;
