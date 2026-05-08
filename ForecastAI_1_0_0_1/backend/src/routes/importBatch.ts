import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/", async (req, res) => {
  const batches = await prisma.importBatch.findMany();
  res.json(batches);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const batch = await prisma.importBatch.findUnique({ where: { id } });
  if (!batch) {
    return res.status(404).json({ error: "ImportBatch not found" });
  }
  res.json(batch);
});

router.post("/", async (req, res) => {
  const data = req.body;
  const created = await prisma.importBatch.create({ data });
  res.status(201).json(created);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const updated = await prisma.importBatch.update({ where: { id }, data });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.importBatch.delete({ where: { id } });
  res.status(204).end();
});

export default router;
