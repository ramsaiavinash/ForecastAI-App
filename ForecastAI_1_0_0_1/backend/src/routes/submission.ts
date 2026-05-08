import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/", async (req, res) => {
  const submissions = await prisma.submission.findMany();
  res.json(submissions);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) {
    return res.status(404).json({ error: "Submission not found" });
  }
  res.json(submission);
});

router.post("/", async (req, res) => {
  const data = req.body;
  const created = await prisma.submission.create({ data });
  res.status(201).json(created);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const updated = await prisma.submission.update({ where: { id }, data });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.submission.delete({ where: { id } });
  res.status(204).end();
});

export default router;
