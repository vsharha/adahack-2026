/** The page and holdings share a single saved backend report. */
import type { ReportData, HoldingRow } from "@/types/report";
import savedReport from "@/data/report.json";

// The registry data uses the UN short name; the page shows the common spelling.
const countryNames: Record<string, string> = { "Viet Nam": "Vietnam" };
const displayCountry = (name: string) => countryNames[name] ?? name;

const raw = savedReport as ReportData;
const reportData: ReportData = {
  ...raw,
  portfolios: Object.fromEntries(
    Object.entries(raw.portfolios).map(([name, portfolio]) => [
      name,
      {
        ...portfolio,
        holdings: portfolio.holdings?.map((h) => ({
          ...h,
          country: displayCountry(h.country),
        })),
        exposures_by_tonnes: {
          ...portfolio.exposures_by_tonnes,
          country: Object.fromEntries(
            Object.entries(portfolio.exposures_by_tonnes.country).map(
              ([country, share]) => [displayCountry(country), share],
            ),
          ),
        },
      },
    ]),
  ),
};

export function getReportData(): ReportData {
  return reportData;
}

export function getHoldings(): HoldingRow[] {
  return getReportData().portfolios["Diversified candidate"]?.holdings ?? [];
}
