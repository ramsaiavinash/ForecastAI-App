import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/batch/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;
    const queries = await prisma.batchQuery.findMany({
      where: { batchId },
      orderBy: { raisedAt: "desc" },
    });
    res.json(queries);
  } catch (error) {
    console.error("Failed to fetch batch queries:", error);
    res.status(500).json({ error: "Failed to fetch batch queries" });
  }
});

router.get("/open", async (req, res) => {
  try {
    const queries = await prisma.batchQuery.findMany({
      where: { status: "Open" },
      orderBy: { raisedAt: "desc" },
    });
    res.json(queries);
  } catch (error) {
    console.error("Failed to fetch open batch queries:", error);
    res.status(500).json({ error: "Failed to fetch open batch queries" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { batchId, query, raisedBy } = req.body;

    if (!batchId || !query || !raisedBy) {
      return res.status(400).json({ error: "batchId, query, and raisedBy are required" });
    }

    const created = await prisma.batchQuery.create({
      data: {
        batchId,
        query,
        raisedBy,
        status: "Open",
      },
    });

    // Placeholder for future Graph API email notification to the target role.
    // This will be implemented later when Azure / Microsoft Graph is enabled.

    res.status(201).json(created);
  } catch (error) {
    console.error("Failed to create batch query:", error);
    res.status(500).json({ error: "Failed to raise batch query" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { response, respondedBy, status } = req.body;

    const data: any = {};

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

    if (response && !data.status) {
      data.status = "Resolved";
    }

    const updated = await prisma.batchQuery.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    console.error("Failed to update batch query:", error);
    res.status(500).json({ error: "Failed to update batch query" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.batchQuery.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete batch query:", error);
    res.status(500).json({ error: "Failed to delete batch query" });
  }
});

export default router;
