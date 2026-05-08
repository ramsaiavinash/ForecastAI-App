import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/", async (req, res) => {
  const projects = await prisma.projectMaster.findMany();
  res.json(projects);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const project = await prisma.projectMaster.findUnique({ where: { id } });
  if (!project) {
    return res.status(404).json({ error: "ProjectMaster not found" });
  }
  res.json(project);
});

router.post("/", async (req, res) => {
  const data = req.body;
  const created = await prisma.projectMaster.create({ data });
  res.status(201).json(created);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const updated = await prisma.projectMaster.update({ where: { id }, data });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.projectMaster.delete({ where: { id } });
  res.status(204).end();
});

export default router;
