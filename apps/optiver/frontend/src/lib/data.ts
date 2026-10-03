/** The page and holdings share a single saved backend report. */
import type { ReportData, HoldingRow } from "@/types/report";
import reportData from "@/data/report.json";

export function getReportData(): ReportData {
  return reportData as ReportData;
}

export function getHoldings(): HoldingRow[] {
  return getReportData().portfolios["Diversified candidate"]?.holdings ?? [];
}
