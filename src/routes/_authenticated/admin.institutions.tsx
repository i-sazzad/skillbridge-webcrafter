import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/institutions")({
  head: () => ({ meta: [{ title: "Institution League · Admin" }] }),
  component: InstitutionLeague,
});

const SALARY_MID: Record<string, number> = {
  "20-40k": 30000,
  "40-60k": 50000,
  "60-90k": 75000,
  "90k+": 110000,
};

function InstitutionLeague() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-institutions"],
    queryFn: async () => {
      const [insts, programs, outcomes] = await Promise.all([
        supabase.from("institutions").select("id,name,district,type"),
        supabase.from("programs").select("id,institution_id,name"),
        supabase.from("graduate_outcomes").select("program_id,grad_year,status,salary_band"),
      ]);
      return {
        insts: insts.data ?? [],
        programs: programs.data ?? [],
        outcomes: outcomes.data ?? [],
      };
    },
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const rows = data.insts.map((inst) => {
    const progs = data.programs.filter((p) => p.institution_id === inst.id);
    const progIds = new Set(progs.map((p) => p.id));
    const outs = data.outcomes.filter((o) => progIds.has(o.program_id as string));
    const placed = outs.filter((o) => o.status !== "unemployed").length;
    const avgPlace = outs.length ? (placed / outs.length) * 100 : 0;
    const sals = outs
      .map((o) => SALARY_MID[o.salary_band as string])
      .filter((n): n is number => typeof n === "number");
    const avgSal = sals.length ? sals.reduce((a, b) => a + b, 0) / sals.length : 0;
    return {
      id: inst.id,
      name: inst.name,
      district: inst.district,
      type: inst.type,
      programs: progs.length,
      grads: outs.length,
      avgPlace,
      avgSal,
    };
  });

  const sorted = [...rows].sort((a, b) => b.avgPlace - a.avgPlace);

  const grade = (p: number) =>
    p >= 80 ? "A" : p >= 70 ? "B" : p >= 60 ? "C" : p >= 50 ? "D" : "F";
  const gradeTone = (g: string) =>
    g === "A"
      ? "bg-emerald-500/15 text-emerald-700"
      : g === "B"
        ? "bg-primary/15 text-primary"
        : g === "C"
          ? "bg-amber-500/15 text-amber-700"
          : "bg-rose-500/15 text-rose-700";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge variant="secondary" className="mb-2">Outcome benchmarks</Badge>
        <h1 className="text-3xl font-extrabold tracking-tight">Institution league table</h1>
        <p className="text-sm text-muted-foreground">
          Compare placement rates and graduate salary across institutions. Built from live cohort data.
        </p>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Institution</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Programs</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Graduates</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Placement</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Salary (BDT)</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grade</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const g = grade(r.avgPlace);
              return (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-bold text-muted-foreground">#{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.type} · {r.district}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.programs}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.grads}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold">{r.avgPlace.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.avgSal ? `৳${Math.round(r.avgSal).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${gradeTone(g)}`}>
                      {g}
                    </span>
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
