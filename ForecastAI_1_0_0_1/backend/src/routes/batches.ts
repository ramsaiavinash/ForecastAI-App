import { Router } from "express";
import { prisma } from "../prisma";
import { sendPLApprovalEmail, sendPHApprovalEmail } from "../services/emailService";

const router = Router();

const STATUS_MAP: Record<string, number> = {
  "Imported": 1,
  "Under Review": 2,
  "Approved PL": 3,
  "Approved PH": 4,
  "Locked": 5,
};

const STATUS_REVERSE: Record<number, string> = {
  1: "Imported",
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

    const previousBatch = await prisma.importBatch.findFirst({
      where: {
        id: { not: id },
        importDate: { lt: batch.importDate || new Date() },
      },
      orderBy: { importDate: "desc" },
    });

    const revenues = await prisma.monthlyRevenue.findMany({
      where: { batchId: id }
    });
    const previousRevenues = previousBatch
      ? await prisma.monthlyRevenue.findMany({ where: { batchId: previousBatch.id } })
      : [];
    const projectIds = [...new Set(revenues.map((r: any) => r.projectId))];
    const projects = await prisma.projectMaster.findMany({
      where: { id: { in: projectIds } }
    });
    const projectSubmissions = await prisma.projectSubmission.findMany({ where: { batchId: id } });

    res.json({
      batch: formatBatch(batch),
      revenues,
      previousRevenues,
      projects,
      projectSubmissions,
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
    const formattedBatch = formatBatch(updated);

    // Send email notifications
    try {
      if (status === "Under Review") {
        // TODO: Graph API - notify PL when Finance submits for review
        await sendPLApprovalEmail(formattedBatch);
        console.log("PL approval email sent!");
      } else if (status === "Approved PL") {
        // TODO: Graph API - notify PH when PL approves
        await sendPHApprovalEmail(formattedBatch);
        console.log("PH approval email sent!");
      } else if (status === "Locked") {
        // TODO: Graph API - notify Finance when locked
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the request if email fails
    }

    res.json(formattedBatch);
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
