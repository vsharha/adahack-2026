/**
 * Data loading utilities for Optiver portfolio report.
 * Uses static demo data; future version can connect to live API.
 */

import type { ReportData, HoldingRow } from "@/types/report";

// This is a saved demo run from: uv --directory apps/optiver/backend run python -m optiver --output /tmp/optiver-frontend-demo
import reportData from "@/data/report.json";

// CSV data as embedded string (Next.js doesn't support ?raw imports by default)
const csvDataRaw = `credit_id,project_name,tonnes,price_usd_per_t,cost_usd,failure_probability,loss_fraction,country,developer,registry,project_type
VCS173,Vishnuprayag Hydro-electric Project (VHEP) by Jaiprakash Power Ventures Ltd.(JPVL),16667.0,0.98,16333.66,0.15,1,India,Jaiprakash Power Ventures Limited,VCS,Hydropower
VCS1974,Srepok 1 Solar Power Project,16667.0,0.93,15500.31,0.2,1,Viet Nam,Dai Hai Power Development and Invesment Joint Stock Company,VCS,Solar - Centralized
VCS296,Energy from renewables,5328.0,1.0,5328.0,0.15,1,India,Poonawalla Fincorp Ltd,VCS,RE Bundled
VCS1143,Ningxia Angli Lingwu Photovoltaic Grid Connected Power Plant Project,16667.0,1.04,17333.68,0.15,1,China,"Datang Angli (Lingwu) New Energy Co., Ltd.",VCS,Solar - Centralized
GS5928,2x50 MW Orange Suvaan Solar Photovoltaic Power Project in Maharashtra India,16667.0,1.05,17500.35,0.15,1,India,Orange Renewable Power Pvt Ltd,GOLD,Solar - Centralized
VCS1248,CGN Hami Phase I 20MWp Grid-connected PV Power Plant Project,8334.0,1.05,8750.7,0.15,1,China,"CGN Solar Power Development Co., LTD",VCS,Solar - Centralized
VCS395,Inner Mongolia Sunjiaying 50.25MW Wind Power Project,16667.0,1.1,18333.7,0.12,1,China,"Chifeng Xinsheng Wind Power Co., Ltd.",VCS,Wind
GS906,Canakkale WPP,16667.0,1.19,19833.73,0.12,0.5,Türkiye,Enerjisa Enerji Uretim A.S.,GOLD,Wind
GS636,GUNAYSE  HPP,5700.0,1.13,6441.0,0.12,1,Türkiye,ARSIN Enerji,GOLD,Hydropower
VCS1032,Xundian Jinfeng 12.6MW Hydropower Project,16667.0,1.2,20000.4,0.07,1,China,"Yunnan Xudong Phosphate Chemical Group Jinfeng Power Generation Co., Ltd.",VCS,Hydropower
VCS869,"2 x 3.5 MW Ullunkal Hydro Power Project in Kerala, India.",3006.0,1.13,3396.78,0.15,1,India,EDCL Power Projects Limited,VCS,Hydropower
ACR0177,Monjolinho Energética S/A Hydropower Plant Project (Alzir dos Santos Antunes),16295.0,1.08,17598.6,0.2,1,Brazil,Statkraft Energias Renováveis S.A.,ACR,Hydropower
GS472,InfraVest Changbin and Taichung bundled Wind Farms Project - Taiwan (300190),11339.0,1.35,15307.65,0.12,0.5,Taiwan,South Pole Ltd,GOLD,Wind`;

export function getReportData(): ReportData {
  return reportData as ReportData;
}

export function parseHoldings(): HoldingRow[] {
  const lines = csvDataRaw.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    // Handle CSV with quoted fields containing commas
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ""));

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] || "";
    });

    return {
      credit_id: row.credit_id,
      project_name: row.project_name,
      tonnes: parseFloat(row.tonnes),
      price_usd_per_t: parseFloat(row.price_usd_per_t),
      cost_usd: parseFloat(row.cost_usd),
      failure_probability: parseFloat(row.failure_probability),
      loss_fraction: parseFloat(row.loss_fraction),
      country: row.country,
      developer: row.developer,
      registry: row.registry,
      project_type: row.project_type,
    };
  });
}

export function getHoldings(): HoldingRow[] {
  return parseHoldings();
}
