import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownRight, ArrowUpRight, Minus, Search, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/institution/analytics")({
  component: AnalyticsPage,
});

interface Row {
  skill_id: string;
  name: string;
  category: string;
  demand_index: number;
  trend: "rising" | "stable" | "declining";
  listings: number; // employer demand
  coverage: number; // courses teaching it
  programs: Set<string>;
}

type SortKey = "gap" | "demand" | "coverage";

function AnalyticsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("gap");
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const [{ data: skills }, { data: listingSkills }, { data: courseSkills }] =
        await Promise.all([
          supabase.from("skills").select("id,name,category,demand_index,trend"),
          supabase
            .from("listing_skills")
            .select("skill_id,listings!inner(status)")
            .eq("listings.status", "active"),
          supabase
            .from("course_skills")
            .select("skill_id,courses(program_id)"),
        ]);

      const listingCounts: Record<string, number> = {};
      ((listingSkills ?? []) as Array<{ skill_id: string }>).forEach((r) => {
        listingCounts[r.skill_id] = (listingCounts[r.skill_id] ?? 0) + 1;
      });

      const courseCounts: Record<string, number> = {};
      const programSets: Record<string, Set<string>> = {};
      ((courseSkills ?? []) as Array<{
        skill_id: string;
        courses: { program_id: string } | null;
      }>).forEach((r) => {
        courseCounts[r.skill_id] = (courseCounts[r.skill_id] ?? 0) + 1;
        if (r.courses) {
          (programSets[r.skill_id] ??= new Set()).add(r.courses.program_id);
        }
      });

      const list: Row[] = ((skills ?? []) as Array<{
        id: string;
        name: string;
        category: string;
        demand_index: number;
        trend: "rising" | "stable" | "declining";
      }>).map((s) => ({
        skill_id: s.id,
        name: s.name,
        category: s.category,
        demand_index: s.demand_index,
        trend: s.trend,
        listings: listingCounts[s.id] ?? 0,
        coverage: courseCounts[s.id] ?? 0,
        programs: programSets[s.id] ?? new Set(),
      }));
      setRows(list);
    })();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category))).sort(),
    [rows],
  );

  const scored = useMemo(() => {
    return rows
      .map((r) => {
        // gap = demand × listings ÷ (coverage + 1) normalized
        const gap = Math.round(
          ((r.demand_index / 100) * Math.max(r.listings, 1) * 100) / (r.coverage + 1),
        );
        return { ...r, gap };
      })
      .filter(
        (r) =>
          (!q || r.name.toLowerCase().includes(q.toLowerCase())) &&
          (category === "all" || r.category === category),
      )
      .sort((a, b) => {
        if (sort === "gap") return b.gap - a.gap;
        if (sort === "demand") return b.demand_index - a.demand_index;
        return a.coverage - b.coverage;
      });
  }, [rows, q, sort, category]);

  const topGap = scored.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          Curriculum Gap Matrix
        </div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          Add this. Drop that.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every skill in the Bangladesh market, scored by employer demand vs your curriculum coverage.
        </p>
      </div>

      {topGap.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {topGap.map((t, i) => (
            <Card key={t.skill_id} className="border-gap-red/30 bg-gap-red/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gap-red">
                <TrendingUp className="h-3.5 w-3.5" /> Priority #{i + 1}
              </div>
              <div className="mt-2 text-lg font-bold">{t.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t.listings} active listings · only {t.coverage} course
                {t.coverage === 1 ? "" : "s"} teach it
              </div>
              <div className="mt-3 text-2xl font-extrabold text-gap-red">Gap {t.gap}</div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search skills"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["gap", "demand", "coverage"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
                sort === k
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              Sort: {k}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              category === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left">Skill</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-center">Trend</th>
                <th className="px-4 py-3 text-center">Demand</th>
                <th className="px-4 py-3 text-center">Listings</th>
                <th className="px-4 py-3 text-center">Coverage</th>
                <th className="px-4 py-3 text-right">Gap score</th>
              </tr>
            </thead>
            <tbody>
              {scored.map((r) => {
                const tone =
                  r.gap >= 100
                    ? "bg-gap-red text-primary-foreground"
                    : r.gap >= 50
                      ? "bg-gap-yellow text-primary-foreground"
                      : r.gap >= 20
                        ? "bg-gap-green/70 text-primary-foreground"
                        : "bg-secondary text-foreground";
                return (
                  <tr key={r.skill_id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-semibold">{r.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                    <td className="px-4 py-3 text-center">
                      <TrendBadge trend={r.trend} />
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{r.demand_index}</td>
                    <td className="px-4 py-3 text-center font-mono">{r.listings}</td>
                    <td className="px-4 py-3 text-center">
                      {r.coverage === 0 ? (
                        <Badge variant="secondary" className="bg-gap-red/15 text-gap-red border-0">
                          Not taught
                        </Badge>
                      ) : (
                        <span className="font-mono">{r.coverage}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className={`ml-auto inline-block min-w-[60px] rounded-md px-2.5 py-1 text-center text-xs font-bold ${tone}`}
                      >
                        {r.gap}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TrendBadge({ trend }: { trend: "rising" | "stable" | "declining" }) {
  if (trend === "rising")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gap-green">
        <ArrowUpRight className="h-3.5 w-3.5" /> rising
      </span>
    );
  if (trend === "declining")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gap-red">
        <ArrowDownRight className="h-3.5 w-3.5" /> falling
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
      <Minus className="h-3.5 w-3.5" /> stable
    </span>
  );
}
