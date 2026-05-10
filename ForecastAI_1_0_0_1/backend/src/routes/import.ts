import { Router, Request, Response } from "express";
import { prisma } from "../prisma";

const router = Router();
const CURRENT_YEAR = 2026;
const N2_MONTH = 3; // March (n-2 actual)
const N1_MONTH = 4; // April (n-1 forecast)
const CURRENT_MONTH = 5; // May

const calculateEstimatedForecast = (
  row: any,
  projectEndDate: Date
): Record<number, { amount: number; isEstimated: boolean }> => {
  const result: Record<number, { amount: number; isEstimated: boolean }> = {};
  const months = [1,2,3,4,5,6,7,8,9,10,11,12];
  const monthKeys = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

  // Get end month (only care about current year)
  const endYear = projectEndDate.getFullYear();
  const endMonth = projectEndDate.getMonth() + 1;

  // Rule 4: Project ended in past year — import as-is, no estimation
  const endMonthForCalc = endYear < CURRENT_YEAR ? 0 : (endYear === CURRENT_YEAR ? endMonth : 12);

  // Get n-2 (March actual) and n-1 (April forecast)
  const n2Value = Number(row[monthKeys[N2_MONTH - 1]] || 0);
  const n1Value = Number(row[monthKeys[N1_MONTH - 1]] || 0);

  // Rule 5: determine base value for estimation
  let baseValue: number | null = null;
  if (n2Value > 0) {
    baseValue = n2Value; // use n-2 actual
  } else if (n2Value < 0) {
    // n-2 is negative — use n-1
    if (n1Value > 0) {
      baseValue = n1Value;
    } else {
      baseValue = null; // skip estimation
    }
  } else {
    // n-2 is zero — use n-1 if available
    if (n1Value > 0) {
      baseValue = n1Value;
    }
  }

  for (const m of months) {
    const csvValue = Number(row[monthKeys[m - 1]] || 0);

    if (m < CURRENT_MONTH) {
      // Past months: use CSV value as-is
      result[m] = { amount: csvValue, isEstimated: false };
    } else {
      // Future months (May onwards)
      if (endMonthForCalc === 0) {
        // Project ended in past year — use CSV value (likely 0)
        result[m] = { amount: csvValue, isEstimated: false };
      } else if (m > endMonthForCalc) {
        // Beyond project end date — 0
        result[m] = { amount: 0, isEstimated: false };
      } else if (csvValue !== 0) {
        // CSV has a value — use it
        result[m] = { amount: csvValue, isEstimated: false };
      } else if (baseValue !== null) {
        // Estimate using base value
        result[m] = { amount: baseValue, isEstimated: true };
      } else {
        // No base value — use 0
        result[m] = { amount: 0, isEstimated: false };
      }
    }
  }

  return result;
};


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

    // Get the previous batch total for variance calculation
    const previousBatch = await prisma.importBatch.findFirst({
      orderBy: { importDate: "desc" },
    });
    const lastTotal = previousBatch ? Number(previousBatch.currentTotal || 0) : 0;

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
      const endDate = project.projectEndDate || new Date("2099-12-31");
      const monthData = calculateEstimatedForecast(row, new Date(endDate));

      for (const [monthStr, data] of Object.entries(monthData)) {
        const m = Number(monthStr);
        try {
          await prisma.monthlyRevenue.create({
            data: {
              batchId: batch.id,
              projectId: project.id,
              month: m,
              year: 2026,
              amount: data.amount,
              isEstimated: data.isEstimated,
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
