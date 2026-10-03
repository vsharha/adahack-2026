/**
 * TypeScript types for Optiver portfolio report data.
 * Matches the schema from apps/optiver/backend/src/optiver/__main__.py
 */

export interface PortfolioEvaluation {
  success_rate: number;
  ci_low: number;
  ci_high: number;
  mean_tonnes: number;
  p05_tonnes: number;
  mean_shortfall: number;
}

export interface PortfolioExposures {
  country: Record<string, number>;
  developer: Record<string, number>;
  registry: Record<string, number>;
  project_type: Record<string, number>;
}

export interface PortfolioData {
  holdings?: HoldingRow[];
  tonnes_weighted_quality_score?: number;
  cost_usd: number;
  within_budget: boolean;
  nominal_tonnes: number;
  expected_tonnes: number;
  projects: number;
  evaluations: Record<string, PortfolioEvaluation>;
  exposures_by_tonnes: PortfolioExposures;
  meets_modelled_requirement: boolean;
}

export interface ReportData {
  status: string;
  quality_score_method?: string;
  target: number;
  budget: number;
  reliability: number;
  seed: number;
  training_scenarios: number;
  evaluation_scenarios: number;
  shared_latent_variances: number[];
  data_sha256: string;
  portfolios: Record<string, PortfolioData>;
}

export interface HoldingRow {
  quality_score?: number;
  vintage_year?: number | null;
  reduction_or_removal?: string;
  status?: string;
  credit_id: string;
  project_name: string;
  tonnes: number;
  price_usd_per_t: number;
  cost_usd: number;
  failure_probability: number;
  loss_fraction: number;
  country: string;
  developer: string;
  registry: string;
  project_type: string;
}

export interface FrontierPoint {
  required_reliability: number;
  cost_usd: number | null;
  projects: number;
  nominal_tonnes: number | null;
  evaluations: Record<string, PortfolioEvaluation>;
  validated: boolean;
  status: string;
  templates_searched: number;
}

export interface FrontierData {
  target: number;
  budget: number;
  training_scenarios: number;
  evaluation_scenarios: number;
  seed: number;
  shared_latent_variances: number[];
  data_sha256: string;
  method: string;
  points: FrontierPoint[];
}
