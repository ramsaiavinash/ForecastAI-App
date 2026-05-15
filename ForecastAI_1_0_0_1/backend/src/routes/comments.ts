import { Router } from "express";
import { prisma } from "../prisma";
const router = Router();

// Get all comments for a project
router.get("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const comments = await prisma.projectComment.findMany({
      where: { projectId },
      orderBy: { commentedAt: "desc" },
    });
    res.json(comments);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add a comment
router.post("/", async (req, res) => {
  try {
    const { projectId, comment, commentedBy } = req.body;
    if (!projectId || !comment || !commentedBy) {
      return res.status(400).json({ error: "projectId, comment and commentedBy are required" });
    }
    const newComment = await prisma.projectComment.create({
      data: { projectId, comment, commentedBy },
    });
    res.json(newComment);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// Update comment status
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.projectComment.update({
      where: { id },
      data: { status },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// Delete a comment
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.projectComment.delete({ where: { id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
