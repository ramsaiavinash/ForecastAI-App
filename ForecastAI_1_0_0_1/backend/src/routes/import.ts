import { Router, Request, Response } from "express";
import { prisma } from "../prisma";

const router = Router();

const parseDate = (dateStr: string): Date => {
  if (!dateStr || dateStr === "(blank)" || dateStr === "") return new Date("2099-12-31");
  // Handle DD-MM-YYYY format
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3 && parts[0].length === 2) {
      // DD-MM-YYYY
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
  }
  // Handle DD/MM/YYYY format
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3 && parts[0].length === 2) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date("2099-12-31") : d;
};



router.post("/csv", async (req: Request, res: Response) => {
  try {
    const { batchName, fileName, rows: rowsInput } = req.body;
    console.log("Import CSV request received. BatchName:", batchName, "Rows count:", Array.isArray(rowsInput) ? rowsInput.length : 0);
    
    if (!batchName) {
      return res.status(400).json({ error: "batchName is required." });
    }

    const rows = Array.isArray(rowsInput) ? rowsInput : (typeof rowsInput === "string" ? JSON.parse(rowsInput) : []);

    const currentTotal = rows.reduce((sum: number, row: any) => {
      return sum + (row.jan||0)+(row.feb||0)+(row.mar||0)+(row.apr||0)+(row.may||0)+(row.jun||0)+(row.jul||0)+(row.aug||0)+(row.sep||0)+(row.oct||0)+(row.nov||0)+(row.dec||0);
    }, 0);

    const lastTotal = rows.reduce((sum: number, row: any) => sum + (row.lastSubmissionTotal || 0), 0);

    // Create ImportBatch
    const batch = await prisma.importBatch.create({
      data: {
        batchName,
        fileName: fileName || "csv-import.csv",
        importDate: new Date(),
        importMonth: new Date().getMonth() + 1,
        importYear: new Date().getFullYear(),
        currentTotal,
        lastTotal,
        variance: currentTotal - lastTotal,
        ownerId: "system",
        statecode: 0,
        statuscode: 1,
      }
    });
    console.log("Batch created:", batch.id);

    let importedRows = 0;

    for (const row of rows) {
      if (!row.projectId) {
        console.log("Skipping row - no projectId");
        continue;
      }

      // Upsert ProjectMaster using projectId unique field
      let project;
      try {
        project = await prisma.projectMaster.upsert({
          where: { projectId: row.projectId },
          update: {
            projectDescription: row.projectDescription || "",
            projectEndDate: parseDate(row.projectEndDate || ""),
            customerDescription: row.customerDescription || undefined,
            customerId: row.customerId || undefined,
            parentCustomer: row.parentCustomer || undefined,
            tower: row.tower || undefined,
            market: row.market || undefined,
            marketUnit: row.marketUnit || undefined,
            businessUnit: row.businessUnit || undefined,
            vertical: row.vertical || undefined,
            subPractice: row.subPractice || undefined,
            category: row.category || undefined,
            projectBillability: row.projectBillability || undefined,
            edlId: row.edlId || undefined,
            edlName: row.edlName || undefined,
            pdlId: row.pdlId || undefined,
            pdlName: row.pdlName || undefined,
            pmId: row.pmId || undefined,
            pmName: row.pmName || undefined,
            opportunityId: row.opportunityId || undefined,
            opportunityName: row.opportunityName || undefined,
            soId: row.soId || undefined,
          },
          create: {
            projectId: row.projectId,
            projectDescription: row.projectDescription || "",
            projectEndDate: parseDate(row.projectEndDate || ""),
            customerDescription: row.customerDescription || undefined,
            customerId: row.customerId || undefined,
            parentCustomer: row.parentCustomer || undefined,
            tower: row.tower || undefined,
            market: row.market || undefined,
            marketUnit: row.marketUnit || undefined,
            businessUnit: row.businessUnit || undefined,
            vertical: row.vertical || undefined,
            subPractice: row.subPractice || undefined,
            category: row.category || undefined,
            projectBillability: row.projectBillability || undefined,
            edlId: row.edlId || undefined,
            edlName: row.edlName || undefined,
            pdlId: row.pdlId || undefined,
            pdlName: row.pdlName || undefined,
            pmId: row.pmId || undefined,
            pmName: row.pmName || undefined,
            opportunityId: row.opportunityId || undefined,
            opportunityName: row.opportunityName || undefined,
            soId: row.soId || undefined,
            ownerId: "system",
            statecode: 0,
          }
        });
        console.log("Project upserted:", project.id, "projectId:", row.projectId, "description:", row.projectDescription);
      } catch (e: any) {
        console.error("Project upsert error for", row.projectId, ":", e.message);
        continue;
      }

      // Create monthly revenues using correct field names
      const monthData = [
        { month: 1, amount: row.jan || 0 },
        { month: 2, amount: row.feb || 0 },
        { month: 3, amount: row.mar || 0 },
        { month: 4, amount: row.apr || 0 },
        { month: 5, amount: row.may || 0 },
        { month: 6, amount: row.jun || 0 },
        { month: 7, amount: row.jul || 0 },
        { month: 8, amount: row.aug || 0 },
        { month: 9, amount: row.sep || 0 },
        { month: 10, amount: row.oct || 0 },
        { month: 11, amount: row.nov || 0 },
        { month: 12, amount: row.dec || 0 },
      ];

      for (const m of monthData) {
        try {
          await prisma.monthlyRevenue.create({
            data: {
              batchId: batch.id,
              projectId: project.id,
              month: m.month,
              year: 2026,
              amount: m.amount,
              isEstimated: false,
              locked: false,
              ownerId: "system",
              statecode: 0,
            }
          });
        } catch (e: any) {
          console.error("Revenue create error:", e.message);
        }
      }
      importedRows++;
    }

    console.log("Import completed. Total rows imported:", importedRows);
    res.status(201).json({ batchId: batch.id, importedRows });
  } catch (error: any) {
    console.error("Import error:", error);
    res.status(500).json({ error: error?.message ?? "Failed to import CSV data." });
  }
});

export default router;
