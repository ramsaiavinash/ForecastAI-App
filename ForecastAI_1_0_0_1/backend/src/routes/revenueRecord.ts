import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/", async (req, res) => {
  const records = await prisma.revenueRecord.findMany();
  res.json(records);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const record = await prisma.revenueRecord.findUnique({ where: { id } });
  if (!record) {
    return res.status(404).json({ error: "RevenueRecord not found" });
  }
  res.json(record);
});

router.post("/", async (req, res) => {
  const data = req.body;
  const created = await prisma.revenueRecord.create({ data });
  res.status(201).json(created);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const updated = await prisma.revenueRecord.update({ where: { id }, data });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.revenueRecord.delete({ where: { id } });
  res.status(204).end();
});

export default router;
