import { Router, Request, Response } from "express";
import multer from "multer";
import xlsx from "xlsx";
import { prisma } from "../prisma";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const normalizeRow = (row: Record<string, any>) => {
  const normalized: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    normalized[key.toLowerCase().trim()] = row[key];
  }
  return normalized;
};

const parseBoolean = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  const text = String(value).trim().toLowerCase();
  return ["true", "yes", "y", "1"].includes(text);
};

const parseIntField = (value: unknown, fallback?: number): number | undefined => {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : Math.trunc(parsed);
};

const parseDecimalField = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseTypeValue = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const text = String(value).trim().toLowerCase();
  if (["actual", "a", "0", "861140000"].includes(text)) return 861140000;
  if (["forecast", "f", "1", "861140001"].includes(text)) return 861140001;
  if (["estimated", "e", "2", "861140002"].includes(text)) return 861140002;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? undefined : numeric;
};

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Excel file is required." });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ error: "Excel file contains no sheets." });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "Excel file contains no rows." });
    }

    const importDate = req.body.importDate ? new Date(req.body.importDate) : new Date();
    const batchData = {
      batchName: req.body.batchName ?? req.file.originalname,
      fileName: req.file.originalname,
      importDate,
      importMonth: parseIntField(req.body.importMonth, importDate.getMonth() + 1),
      importYear: parseIntField(req.body.importYear, importDate.getFullYear()),
      ownerId: req.body.ownerId ?? "system",
      statecode: 0,
      statuscode: 1,
    };

    const importBatch = await prisma.importBatch.create({ data: batchData });

    const monthlyRevenueRows = rows.map((row, index) => {
      const normalized = normalizeRow(row);
      const projectId = normalized["projectid"] ?? normalized["project"] ?? normalized["project id"];
      const month = parseIntField(normalized["month"] ?? normalized["month number"]);
      const year = parseIntField(normalized["year"]);
      const amount = parseDecimalField(normalized["amount"] ?? normalized["revenue"] ?? normalized["value"]);
      const type = parseTypeValue(normalized["type"] ?? normalized["revenue type"]);
      const isEstimated = parseBoolean(normalized["isestimated"] ?? normalized["estimated"]);
      const locked = parseBoolean(normalized["locked"]);
      const name = normalized["name"] ?? normalized["monthlyrevenuename"] ?? normalized["revenue name"] ?? null;

      if (!projectId) {
        throw new Error(`Missing ProjectId in row ${index + 1}. Expected a column named ProjectId or Project.`);
      }
      if (month === undefined) {
        throw new Error(`Missing or invalid Month in row ${index + 1}.`);
      }
      if (year === undefined) {
        throw new Error(`Missing or invalid Year in row ${index + 1}.`);
      }

      return {
        batchId: importBatch.id,
        projectId: String(projectId),
        month,
        year,
        amount,
        type,
        isEstimated,
        locked,
        name: name ? String(name) : undefined,
        ownerId: req.body.ownerId ?? "system",
        statecode: 0,
        statuscode: 1,
      };
    });

    await prisma.$transaction([prisma.monthlyRevenue.createMany({ data: monthlyRevenueRows })]);

    res.status(201).json({ batchId: importBatch.id, importedRows: monthlyRevenueRows.length });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error?.message ?? "Failed to import Excel file." });
  }
});

export default router;
