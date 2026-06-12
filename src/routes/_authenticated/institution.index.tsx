import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp, GraduationCap, Award, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/institution/")({
  component: InstitutionHome,
});

function InstitutionHome() {
  const [stats, setStats] = useState({
    programs: 0,
    students: 0,
    placement: 0,
    avgDays: 0,
  });
  const [sectorMix, setSectorMix] = useState<{ sector: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: programs }, { data: outcomes }] = await Promise.all([
        supabase.from("programs").select("*", { count: "exact", head: true }),
        supabase.from("graduate_outcomes").select("status,sector,time_to_hire_days"),
      ]);
      const rows = (outcomes ?? []) as Array<{
        status: string;
        sector: string | null;
        time_to_hire_days: number | null;
      }>;
      const placed = rows.filter((r) => r.status === "placed");
      const placement = rows.length ? Math.round((placed.length / rows.length) * 100) : 0;
      const days = placed
        .map((r) => r.time_to_hire_days)
        .filter((d): d is number => d != null);
      const avg = days.length ? Math.round(days.reduce((s, d) => s + d, 0) / days.length) : 0;
      const sectorCounts: Record<string, number> = {};
      placed.forEach((r) => {
        if (r.sector) sectorCounts[r.sector] = (sectorCounts[r.sector] ?? 0) + 1;
      });
      setStats({
        programs: programs ?? 0,
        students: rows.length,
        placement,
        avgDays: avg,
      });
      setSectorMix(
        Object.entries(sectorCounts)
          .map(([sector, count]) => ({ sector, count }))
          .sort((a, b) => b.count - a.count),
      );
    })();
  }, []);

  const kpis = useMemo(
    () => [
      {
        label: "Programs",
        value: stats.programs,
        icon: GraduationCap,
        suffix: "",
      },
      { label: "Graduate records", value: stats.students, icon: Award, suffix: "" },
      { label: "Placement rate", value: stats.placement, icon: TrendingUp, suffix: "%" },
      { label: "Avg days to hire", value: stats.avgDays, icon: BarChart3, suffix: "" },
    ],
    [stats],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Institution
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Curriculum Intelligence Hub
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What the market wants vs what you teach — backed by your own graduate outcomes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/institution/outcomes">Outcomes</Link>
          </Button>
          <Button asChild>
            <Link to="/institution/analytics">Open Gap Matrix</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <k.icon className="h-3.5 w-3.5" /> {k.label}
            </div>
            <div className="mt-2 text-4xl font-extrabold tracking-tight">
              {k.value}
              {k.suffix}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Where your grads go
          </div>
          <h2 className="text-lg font-bold">Sector mix of placed graduates</h2>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorMix}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="sector" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-5">
        <div>
          <Badge variant="secondary">New</Badge>
          <div className="mt-2 text-sm font-semibold">
            See which skills employers want but you're not teaching.
          </div>
          <div className="text-xs text-muted-foreground">
            The Gap Matrix scores every market skill against your curriculum coverage.
          </div>
        </div>
        <Button asChild>
          <Link to="/institution/analytics">Open Gap Matrix</Link>
        </Button>
      </Card>
    </div>
  );
}
