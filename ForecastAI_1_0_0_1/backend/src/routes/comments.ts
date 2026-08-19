import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

function normalizeComment(comment: any) {
  const sentBy = comment.sentBy || (
    comment.commentedBy === "Practice Lead" ? "PL" :
    comment.commentedBy === "Project Manager" || comment.repliedBy === "Forecaster" ? "PM" :
    comment.commentedBy || comment.repliedBy || "PL"
  );
  return {
    ...comment,
    message: comment.message || comment.comment || "",
    comment: comment.message || comment.comment || "",
    sentBy,
    sentAt: comment.sentAt || comment.commentedAt,
    queryType: comment.queryType || (comment.batchId ? "PH_PL" : "PL_PM"),
  };
}

async function getThreadedComments(where: any) {
  const comments = await prisma.projectComment.findMany({ where, orderBy: { sentAt: "asc" } });
  const repliesByParent = new Map<string, any[]>();
  for (const comment of comments) {
    if (comment.parentId) {
      const replies = repliesByParent.get(comment.parentId) || [];
      replies.push(normalizeComment(comment));
      repliesByParent.set(comment.parentId, replies);
    }
  }
  return comments
    .filter(comment => !comment.parentId)
    .map(comment => ({ ...normalizeComment(comment), replies: repliesByParent.get(comment.id) || [] }));
}

router.get("/open", async (req, res) => {
  try {
    const queryType = String(req.query.queryType || "PH_PL");
    res.json(await getThreadedComments({ queryType, parentId: null, status: "Open" }));
  } catch (error) {
    console.error("Failed to fetch open comments:", error);
    res.status(500).json({ error: "Failed to fetch open comments" });
  }
});

router.get("/batch/:batchId", async (req, res) => {
  try {
    const queryType = String(req.query.queryType || "PH_PL");
    res.json(await getThreadedComments({ batchId: req.params.batchId, queryType }));
  } catch (error) {
    console.error("Failed to fetch batch comments:", error);
    res.status(500).json({ error: "Failed to fetch batch comments" });
  }
});

router.get("/project/:projectId", async (req, res) => {
  try {
    const queryType = String(req.query.queryType || "PL_PM");
    res.json(await getThreadedComments({ projectId: req.params.projectId, queryType }));
  } catch (error) {
    console.error("Failed to fetch project comments:", error);
    res.status(500).json({ error: "Failed to fetch project comments" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectId, batchId, message, comment, sentBy, commentedBy, queryType, parentId } = req.body;
    const text = String(message || comment || "").trim();
    const type = queryType || (batchId ? "PH_PL" : "PL_PM");
    const sender = sentBy || (
      commentedBy === "Practice Lead" ? "PL" :
      commentedBy === "Project Manager" || commentedBy === "Forecaster" ? "PM" :
      commentedBy
    );
    if (!text || !sender || !["PL_PM", "PH_PL"].includes(type) || (!projectId && !batchId) || (projectId && batchId)) {
      return res.status(400).json({ error: "A valid projectId or batchId, message, sentBy and queryType are required" });
    }
    if (type === "PL_PM" && (!projectId || !["PL", "PM"].includes(sender))) {
      return res.status(403).json({ error: "PL_PM messages require a project and PL or PM sender" });
    }
    if (type === "PH_PL" && (!batchId || !["PH", "PL"].includes(sender))) {
      return res.status(403).json({ error: "PH_PL messages require a batch and PH or PL sender" });
    }
    const created = await prisma.projectComment.create({
      data: {
        projectId: projectId || null,
        batchId: batchId || null,
        parentId: parentId || null,
        message: text,
        comment: text,
        sentBy: sender,
        commentedBy: sender,
        queryType: type,
        messageType: parentId ? "reply" : "query",
      },
    });
    if (type === "PL_PM" && sender === "PL" && !parentId) {
      // TODO: Graph API - Email PM when PL raises query on their project
    } else if (type === "PL_PM" && sender === "PM" && parentId) {
      // TODO: Graph API - Email PL when PM replies to query
    } else if (type === "PH_PL" && sender === "PH" && !parentId) {
      // TODO: Graph API - Email PL when PH raises batch query
      // TODO: Graph API - Email PL when PH raises query after PL approval
    } else if (type === "PH_PL" && sender === "PL" && parentId) {
      // TODO: Graph API - Email PH when PL replies to batch query
      // TODO: Graph API - Email PH when PL responds to query
    }
    res.status(201).json(normalizeComment(created));
  } catch (error) {
    console.error("Failed to create comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { status, resolvedBy } = req.body;
    if (status !== "Resolved") return res.status(400).json({ error: "Only resolution is supported" });
    const comment = await prisma.projectComment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    const root = comment.parentId
      ? await prisma.projectComment.findUnique({ where: { id: comment.parentId } })
      : comment;
    if (!root || root.sentBy !== resolvedBy) {
      return res.status(403).json({ error: "Only the query author can resolve this thread" });
    }
    const updated = await prisma.projectComment.update({ where: { id: root.id }, data: { status: "Resolved" } });
    res.json(normalizeComment(updated));
  } catch (error) {
    console.error("Failed to resolve comment:", error);
    res.status(500).json({ error: "Failed to resolve comment" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.projectComment.deleteMany({ where: { parentId: req.params.id } });
    await prisma.projectComment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
