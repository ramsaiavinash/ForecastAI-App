import { Router } from "express";
import { prisma } from "../prisma";
const router = Router();
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SR: any = {1:"Draft",2:"Under Review",3:"Approved PL",4:"Approved PH",5:"Locked"};

router.get("/", async (req, res) => {
  try {
    const allBatches = await prisma.importBatch.findMany({
      orderBy: { importDate: "desc" },
      take: 20,
    });

    const fmt = (b: any) => ({
      ...b,
      status: SR[b.statuscode] || "Draft",
      currentTotal: Number(b.currentTotal || 0),
      lastTotal: Number(b.lastTotal || 0),
      variance: Number(b.variance || 0),
      createdAt: b.importDate || new Date().toISOString(),
    });

    const formatted = allBatches.map(fmt);
    const latest = formatted[0];
    let totalRevenue = 0, variance = 0, variancePercent = 0;
    let monthlyData = MONTHS.map(m => ({ month: m, actuals: 0, forecast: 0 }));

    if (latest) {
      totalRevenue = latest.currentTotal;
      variance = latest.variance;
      variancePercent = latest.lastTotal > 0 ? (variance / latest.lastTotal) * 100 : 0;

      // Get monthly revenues for latest batch - use correct field names
      const revenues = await prisma.monthlyRevenue.findMany({
        where: { batchId: latest.id },
      });

      // Aggregate by month manually
      monthlyData = MONTHS.map((name, idx) => {
        const monthRevs = revenues.filter((r: any) => r.month === idx + 1);
        const total = monthRevs.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
        return { month: name, actuals: 0, forecast: total };
      });
    }

    const activeProjects = await prisma.projectMaster.count();
    const pendingApprovals = await prisma.importBatch.count({
      where: { statuscode: { in: [2, 3] } },
    });

    res.json({
      totalRevenue,
      variance,
      variancePercent,
      activeProjects,
      pendingApprovals,
      monthlyData,
      recentBatches: formatted.slice(0, 5),
    });
  } catch (e: any) {
    console.error("Dashboard error:", e);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

export default router;
