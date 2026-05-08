import { useCallback, useState } from "react";
import Papa from "papaparse";
import { ParsedCSVRow, ValidationIssue } from "../types/index";
import { parseIndianNumber } from "../lib/utils";

const API_BASE = "http://localhost:4000/api";

export function useCSVImport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(async (file: File): Promise<{ rows: ParsedCSVRow[], issues: ValidationIssue[] }> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const rows: ParsedCSVRow[] = [];
            const issues: ValidationIssue[] = [];

            results.data.forEach((row, rowIndex) => {
              const r = row as any[];
              if (rowIndex === 0) return; // Skip header

              const parsedRow = parseRow(r, rowIndex);
              rows.push(parsedRow);

              const rowIssues = validateRow(parsedRow, rowIndex);
              issues.push(...rowIssues);
            });

            resolve({ rows, issues });
          } catch (err) {
            reject(err);
          }
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }, []);

  const parseRow = (row: any[], rowIndex: number): ParsedCSVRow => {
    const parseNum = (val: any) => parseIndianNumber(val?.toString() || "");

    return {
      tower: row[0]?.toString().trim() || "",
      market: row[1]?.toString().trim() || "",
      marketUnit: row[2]?.toString().trim() || "",
      businessUnit: row[3]?.toString().trim() || "",
      vertical: row[4]?.toString().trim() || "",
      parentCustomer: row[5]?.toString().trim() || "",
      customerId: row[6]?.toString().trim() || "",
      customerDescription: row[7]?.toString().trim() || "",
      projectId: row[8]?.toString().trim() || "",
      projectDescription: row[9]?.toString().trim() || "",
      projectBillability: row[10]?.toString().trim() || "",
      subPractice: row[11]?.toString().trim() || "",
      category: row[12]?.toString().trim() || "",
      janPPM: parseNum(row[13]),
      edlId: row[14]?.toString().trim() || "",
      edlName: row[15]?.toString().trim() || "",
      pdlId: row[16]?.toString().trim() || "",
      pdlName: row[17]?.toString().trim() || "",
      pmId: row[18]?.toString().trim() || "",
      pmName: row[19]?.toString().trim() || "",
      opportunityId: row[20]?.toString().trim() || "",
      opportunityName: row[21]?.toString().trim() || "",
      projectEndDate: row[22]?.toString().trim() || "",
      soId: row[23]?.toString().trim() || "",
      jan: parseNum(row[24]),
      feb: parseNum(row[25]),
      mar: parseNum(row[26]),
      apr: parseNum(row[27]),
      may: parseNum(row[28]),
      jun: parseNum(row[29]),
      jul: parseNum(row[30]),
      aug: parseNum(row[31]),
      sep: parseNum(row[32]),
      oct: parseNum(row[33]),
      nov: parseNum(row[34]),
      dec: parseNum(row[35]),
      lastSubmissionTotal: parseNum(row[36]),
      janActual: parseNum(row[37]),
      currentSubmissionTotal: parseNum(row[50]),
      lastVsCurrent: parseNum(row[51]),
      reason: row[52]?.toString().trim() || "",
    };
  };

  const validateRow = (row: ParsedCSVRow, rowIndex: number): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    // Missing Project ID
    if (!row.projectId) {
      issues.push({
        row: rowIndex + 1,
        field: "Project ID",
        message: "Project ID is required",
        severity: "error",
        projectId: row.projectId,
        projectDescription: row.projectDescription,
      });
    }

    // Missing Project Description
    if (!row.projectDescription) {
      issues.push({
        row: rowIndex + 1,
        field: "Project Description",
        message: "Project Description is required",
        severity: "error",
        projectId: row.projectId,
        projectDescription: row.projectDescription,
      });
    }

    // Missing Project End Date
    if (!row.projectEndDate) {
      issues.push({
        row: rowIndex + 1,
        field: "Project End Date",
        message: "Project End Date is required",
        severity: "error",
        projectId: row.projectId,
        projectDescription: row.projectDescription,
      });
    }

    // Monthly values not numeric
    const monthlyFields = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    monthlyFields.forEach(field => {
      const value = (row as any)[field];
      if (isNaN(value)) {
        issues.push({
          row: rowIndex + 1,
          field: field.toUpperCase(),
          message: `${field.toUpperCase()} value is not numeric`,
          severity: "error",
          projectId: row.projectId,
          projectDescription: row.projectDescription,
        });
      }
    });

    // Negative values
    [...monthlyFields, 'janActual', 'lastSubmissionTotal', 'currentSubmissionTotal'].forEach(field => {
      const value = (row as any)[field];
      if (value < 0) {
        issues.push({
          row: rowIndex + 1,
          field: field.toUpperCase(),
          message: `${field.toUpperCase()} has negative value`,
          severity: "warning",
          projectId: row.projectId,
          projectDescription: row.projectDescription,
        });
      }
    });

    // 8+ months with zero value
    const zeroMonths = monthlyFields.filter(field => (row as any)[field] === 0).length;
    if (zeroMonths >= 8) {
      issues.push({
        row: rowIndex + 1,
        field: "Monthly Values",
        message: `${zeroMonths} months have zero values`,
        severity: "warning",
        projectId: row.projectId,
        projectDescription: row.projectDescription,
      });
    }

    // Missing customer
    if (!row.customerId && !row.customerDescription) {
      issues.push({
        row: rowIndex + 1,
        field: "Customer",
        message: "Customer information is missing",
        severity: "warning",
        projectId: row.projectId,
        projectDescription: row.projectDescription,
      });
    }

    return issues;
  };

  const importBatch = useCallback(async (rows: ParsedCSVRow[], batchName: string, fileName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create import batch
      const batchResponse = await fetch(`${API_BASE}/import-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchName,
          fileName,
          importDate: new Date().toISOString(),
          importMonth: new Date().getMonth() + 1,
          importYear: new Date().getFullYear(),
          status: "Draft",
          currentTotal: rows.reduce((sum, row) => sum + row.currentSubmissionTotal, 0),
          lastTotal: rows.reduce((sum, row) => sum + row.lastSubmissionTotal, 0),
          variance: 0, // Calculate if needed
          createdAt: new Date().toISOString(),
        }),
      });

      if (!batchResponse.ok) throw new Error("Failed to create batch");

      const batch = await batchResponse.json();

      // For each row, create project master if not exists, then revenue records
      for (const row of rows) {
        // Check if project master exists
        let projectMaster = await fetch(`${API_BASE}/project-masters?projectId=${row.projectId}`).then(r => r.json()).then(arr => arr[0]);

        if (!projectMaster) {
          const pmResponse = await fetch(`${API_BASE}/project-masters`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: row.projectId,
              projectDescription: row.projectDescription,
              projectEndDate: row.projectEndDate,
              customerId: row.customerId || undefined,
              customerDescription: row.customerDescription || undefined,
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
              janPPM: row.janPPM || undefined,
            }),
          });

          if (!pmResponse.ok) throw new Error("Failed to create project master");
          projectMaster = await pmResponse.json();
        }

        // Create revenue records for each month
        const months = [
          { month: 1, year: 2026, forecastAmount: row.jan, actualAmount: row.janActual || 0, currentSubmissionAmount: row.jan, lastSubmissionAmount: 0, isEstimated: false, reason: row.reason },
          { month: 2, year: 2026, forecastAmount: row.feb, actualAmount: 0, currentSubmissionAmount: row.feb, lastSubmissionAmount: 0, isEstimated: false, reason: row.reason },
          { month: 3, year: 2026, forecastAmount: row.mar, actualAmount: 0, currentSubmissionAmount: row.mar, lastSubmissionAmount: 0, isEstimated: false, reason: row.reason },
          { month: 4, year: 2026, forecastAmount: row.apr, actualAmount: 0, currentSubmissionAmount: row.apr, lastSubmissionAmount: 0, isEstimated: false, reason: row.reason },
          { month: 5, year: 2026, forecastAmount: row.may, actualAmount: 0, currentSubmissionAmount: row.may, lastSubmissionAmount: 0, isEstimated: false, reason: row.reason },
          { month: 6, year: 2026, forecastAmount: row.jun, actualAmount: 0, currentSubmissionAmount: row.jun, lastSubmissionAmount: 0, isEstimated: false, reason: row.reason },
          { month: 7, year: 2026, forecastAmount: row.jul, actualAmount: 0, currentSubmissionAmount: row.jul, lastSubmissionAmount: 0, isEstimated: false, reason: row.reason },
          { month: 8, year: 2026, forecastAmount: row.aug, actualAmount: 0, currentSubmissionAmount: row.aug, lastSubmissionAmount: 0, isEstimated: false, reason: row.reason },
          { month: 9, year: 2026, forecastAmount: row.sep, actualAmount: 0, currentSubmissionAmount: row.sep, lastSubmissionAmount: 0, isEstimated: false, reason: row.reason },
          { month: 10, year: 2026, forecastAmount: row.oct, actualAmount: 0, currentSubmissionAmount: row.oct, lastSubmissionAmount: 0, isEstimated: false, reason: row.reason },
          { month: 11, year: 2026, forecastAmount: row.nov, actualAmount: 0, currentSubmissionAmount: row.nov, lastSubmissionAmount: 0, isEstimated: false, reason: row.reason },
          { month: 12, year: 2026, forecastAmount: row.dec, actualAmount: 0, currentSubmissionAmount: row.dec, lastSubmissionAmount: 0, isEstimated: false, reason: row.reason },
        ];

        for (const monthData of months) {
          await fetch(`${API_BASE}/revenue-records`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              importBatchId: batch.id,
              projectMasterId: projectMaster.id,
              ...monthData,
              variance: monthData.currentSubmissionAmount - monthData.lastSubmissionAmount,
            }),
          });
        }
      }

      setIsLoading(false);
      return batch;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setIsLoading(false);
      throw err;
    }
  }, [setIsLoading, setError]);

  return {
    parseFile,
    importBatch,
    isLoading,
    error,
  };
}