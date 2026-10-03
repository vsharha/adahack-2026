"use client";

import { useState } from "react";
import { HoldingRow } from "@/types/report";
import { formatCurrencyPrecise, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const control =
  "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary";

export function HoldingsTable({ holdings }: { holdings: HoldingRow[] }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [projectType, setProjectType] = useState("");
  const [sort, setSort] = useState("cost-desc");
  const countries = [...new Set(holdings.map((h) => h.country))].sort();
  const types = [...new Set(holdings.map((h) => h.project_type))].sort();
  const term = query.trim().toLocaleLowerCase();
  const rows = holdings
    .filter(
      (h) =>
        (!country || h.country === country) &&
        (!projectType || h.project_type === projectType) &&
        (!term ||
          [
            h.project_name,
            h.credit_id,
            h.country,
            h.developer,
            h.registry,
            h.project_type,
          ].some((value) => value.toLocaleLowerCase().includes(term))),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.project_name.localeCompare(b.project_name)
        : sort === "tonnes-desc"
          ? b.tonnes - a.tonnes
          : sort === "cost-asc"
            ? a.cost_usd - b.cost_usd
            : b.cost_usd - a.cost_usd,
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Diversified Candidate Credits</CardTitle>
        <p className="text-sm text-muted-foreground">
          Search projects, developers, credit IDs or registries. Filters apply
          together.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <label className="text-xs font-medium">
            Search holdings
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Project, developer or ID…"
              className={control}
            />
          </label>
          <label className="text-xs font-medium">
            Filter by country
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={control}
            >
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            Filter by project type
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className={control}
            >
              <option value="">All project types</option>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            Sort holdings
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className={control}
            >
              <option value="cost-desc">Highest cost</option>
              <option value="cost-asc">Lowest cost</option>
              <option value="tonnes-desc">Most tonnes</option>
              <option value="name">Project name</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground" role="status">
            {rows.length} of {holdings.length} projects ·{" "}
            {formatNumber(rows.reduce((sum, h) => sum + h.tonnes, 0))} tonnes ·{" "}
            {formatCurrencyPrecise(
              rows.reduce((sum, h) => sum + h.cost_usd, 0),
            )}{" "}
            in this view
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery("");
              setCountry("");
              setProjectType("");
              setSort("cost-desc");
            }}
          >
            Reset filters
          </Button>
        </div>
        <div className="max-h-[450px] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Registry</TableHead>
                <TableHead className="text-right">Tonnes</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((h) => (
                <TableRow key={h.credit_id}>
                  <TableCell className="min-w-[230px] max-w-[360px] whitespace-normal">
                    <p className="font-medium">{h.project_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {h.credit_id}
                    </p>
                  </TableCell>
                  <TableCell>{h.country}</TableCell>
                  <TableCell>{h.project_type}</TableCell>
                  <TableCell>{h.registry}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(h.tonnes)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyPrecise(h.cost_usd)}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No projects match these filters. Try a different search or
                    reset filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
