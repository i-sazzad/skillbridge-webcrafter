import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/skills")({
  head: () => ({ meta: [{ title: "Skill Pulse · Admin" }] }),
  component: SkillPulse,
});

function SkillPulse() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-skill-pulse"],
    queryFn: async () => {
      const [skills, ls, cs] = await Promise.all([
        supabase.from("skills").select("id,name,category,demand_index,trend,avg_salary_min,avg_salary_max"),
        supabase.from("listing_skills").select("skill_id"),
        supabase.from("course_skills").select("skill_id"),
      ]);
      return {
        skills: skills.data ?? [],
        listingCounts: countBy((ls.data ?? []).map((r) => r.skill_id as string)),
        courseCounts: countBy((cs.data ?? []).map((r) => r.skill_id as string)),
      };
    },
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const rows = data.skills
    .map((s) => {
      const demand = data.listingCounts[s.id] ?? 0;
      const supply = data.courseCounts[s.id] ?? 0;
      const gap = demand - supply;
      return { ...s, demand, supply, gap };
    })
    .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.category.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.gap - a.gap || b.demand_index - a.demand_index);

  const TrendIcon = (t: string) =>
    t === "rising" ? TrendingUp : t === "declining" ? TrendingDown : Minus;
  const trendTone = (t: string) =>
    t === "rising"
      ? "text-emerald-600"
      : t === "declining"
        ? "text-rose-600"
        : "text-muted-foreground";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge variant="secondary" className="mb-2">National skill pulse</Badge>
        <h1 className="text-3xl font-extrabold tracking-tight">Demand vs. supply gap</h1>
        <p className="text-sm text-muted-foreground">
          Skills employers want versus skills currently taught. Sorted by gap — the biggest training opportunities at the top.
        </p>
      </div>

      <Input
        placeholder="Filter by skill or category…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skill</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demand</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Listings</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Courses</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gap</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trend</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Salary (BDT)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const Icon = TrendIcon(r.trend);
              const gapTone =
                r.gap > 1
                  ? "bg-rose-500/15 text-rose-700"
                  : r.gap > 0
                    ? "bg-amber-500/15 text-amber-700"
                    : "bg-emerald-500/15 text-emerald-700";
              return (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-semibold">{r.name}</td>
                  <td className="px-4 py-2.5 text-xs uppercase tracking-wider text-muted-foreground">
                    {r.category}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">{r.demand_index}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.demand}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.supply}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`inline-block min-w-[2.5rem] rounded-md px-2 py-0.5 text-xs font-bold ${gapTone}`}>
                      {r.gap > 0 ? `+${r.gap}` : r.gap}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Icon className={`mx-auto h-4 w-4 ${trendTone(r.trend)}`} />
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-xs text-muted-foreground">
                    {r.avg_salary_min && r.avg_salary_max
                      ? `৳${(r.avg_salary_min / 1000).toFixed(0)}k–${(r.avg_salary_max / 1000).toFixed(0)}k`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function countBy(arr: string[]) {
  const out: Record<string, number> = {};
  for (const x of arr) out[x] = (out[x] ?? 0) + 1;
  return out;
}
