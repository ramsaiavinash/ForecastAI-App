export type BatchStatus = "Draft" | "Under Review" | "Approved PL" | "Approved PH" | "Locked";

export interface ImportBatch {
  id: string;
  batchName: string;
  fileName: string;
  importDate: string;
  importMonth: number;
  importYear: number;
  status: BatchStatus;
  currentTotal: number;
  lastTotal: number;
  variance: number;
  createdAt: string;
}

export interface ProjectMaster {
  id: string;
  projectId: string;
  projectDescription: string;
  projectEndDate: string;
  customerId?: string;
  customerDescription?: string;
  parentCustomer?: string;
  tower?: string;
  market?: string;
  marketUnit?: string;
  businessUnit?: string;
  vertical?: string;
  subPractice?: string;
  category?: string;
  projectBillability?: string;
  edlId?: string;
  edlName?: string;
  pdlId?: string;
  pdlName?: string;
  pmId?: string;
  pmName?: string;
  opportunityId?: string;
  opportunityName?: string;
  soId?: string;
  janPPM?: number;
}

export interface MonthlyRevenue {
  id: string;
  importBatchId: string;
  projectMasterId: string;
  month: number;
  year: number;
  forecastAmount: number;
  actualAmount: number;
  currentSubmissionAmount: number;
  lastSubmissionAmount: number;
  variance: number;
  isEstimated: boolean;
  reason?: string;
}

export interface DashboardSummary {
  totalRevenue: number;
  variance: number;
  variancePercent: number;
  activeProjects: number;
  pendingApprovals: number;
  monthlyData: { month: string; actuals: number; forecast: number }[];
  recentBatches: ImportBatch[];
}

export interface ValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
  projectId?: string;
  projectDescription?: string;
}

export interface ParsedCSVRow {
  projectId: string;
  projectDescription: string;
  projectEndDate: string;
  customerId: string;
  customerDescription: string;
  parentCustomer: string;
  tower: string;
  market: string;
  marketUnit: string;
  businessUnit: string;
  vertical: string;
  subPractice: string;
  category: string;
  projectBillability: string;
  edlId: string;
  edlName: string;
  pdlId: string;
  pdlName: string;
  pmId: string;
  pmName: string;
  opportunityId: string;
  opportunityName: string;
  soId: string;
  janPPM: number;
  jan: number; feb: number; mar: number; apr: number;
  may: number; jun: number; jul: number; aug: number;
  sep: number; oct: number; nov: number; dec: number;
  lastSubmissionTotal: number;
  janActual: number;
  currentSubmissionTotal: number;
  lastVsCurrent: number;
  reason: string;
}