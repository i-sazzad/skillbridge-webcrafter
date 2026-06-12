import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Briefcase,
  GraduationCap,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Workforce Overview · Admin" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [skills, listings, institutions, employers, outcomes, programs] = await Promise.all([
        supabase.from("skills").select("name,category,demand_index,trend"),
        supabase.from("listings").select("id,district,status,employer_id"),
        supabase.from("institutions").select("id,name"),
        supabase.from("employers").select("id,name,sector"),
        supabase.from("graduate_outcomes").select("program_id,grad_year,status"),
        supabase.from("programs").select("id"),
      ]);
      return {
        skills: skills.data ?? [],
        listings: listings.data ?? [],
        institutions: institutions.data ?? [],
        employers: employers.data ?? [],
        outcomes: outcomes.data ?? [],
        programs: programs.data ?? [],
      };
    },
  });

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Loading workforce intelligence…</div>;
  }

  const activeListings = data.listings.filter((l) => l.status === "active").length;
  const placedCount = data.outcomes.filter(
    (o) => o.status === "employed" || o.status === "further_study" || o.status === "freelance",
  ).length;
  const avgPlacement = data.outcomes.length
    ? Math.round((placedCount / data.outcomes.length) * 100)
    : 0;
  const risingSkills = data.skills.filter((s) => s.trend === "rising").length;
  const decliningSkills = data.skills.filter((s) => s.trend === "declining").length;

  const byCat: Record<string, { sum: number; n: number }> = {};
  data.skills.forEach((s) => {
    byCat[s.category] = byCat[s.category] ?? { sum: 0, n: 0 };
    byCat[s.category].sum += s.demand_index;
    byCat[s.category].n += 1;
  });
  const catData = Object.entries(byCat)
    .map(([category, v]) => ({ category, demand: Math.round(v.sum / v.n) }))
    .sort((a, b) => b.demand - a.demand);

  const topSkills = [...data.skills]
    .sort((a, b) => b.demand_index - a.demand_index)
    .slice(0, 8);

  const colors = ["hsl(var(--primary))", "hsl(var(--accent))"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Badge variant="secondary" className="mb-2">National workforce monitor</Badge>
        <h1 className="text-3xl font-extrabold tracking-tight">Bangladesh Workforce Readiness</h1>
        <p className="text-sm text-muted-foreground">
          Real-time signal across institutions, employers, skills, and graduate outcomes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={Activity} label="Skills tracked" value={data.skills.length} />
        <Kpi icon={Briefcase} label="Active listings" value={activeListings} sub={`${data.employers.length} employers`} />
        <Kpi icon={Building2} label="Institutions" value={data.institutions.length} sub={`${data.programs.length} programs`} />
        <Kpi icon={GraduationCap} label="Placement rate" value={`${avgPlacement}%`} sub={`${data.outcomes.length} graduates tracked`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Demand by sector category</h2>
              <p className="text-xs text-muted-foreground">Average demand index across all tracked skills.</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="category" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="demand" radius={[6, 6, 0, 0]}>
                  {catData.map((_, i) => (
                    <Cell key={i} fill={colors[i % 2]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold">Skill momentum</h2>
          <p className="text-xs text-muted-foreground">Net market direction across the taxonomy.</p>
          <div className="mt-5 space-y-3">
            <Momentum
              icon={TrendingUp}
              tone="emerald"
              label="Rising"
              value={risingSkills}
              total={data.skills.length}
            />
            <Momentum
              icon={Minus}
              tone="amber"
              label="Stable"
              value={data.skills.length - risingSkills - decliningSkills}
              total={data.skills.length}
            />
            <Momentum
              icon={TrendingDown}
              tone="rose"
              label="Declining"
              value={decliningSkills}
              total={data.skills.length}
            />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-bold">Top 8 in-demand skills nationally</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {topSkills.map((s, i) => (
            <div
              key={s.name}
              className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {s.category}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">{s.demand_index}</div>
                <div className="text-[10px] capitalize text-muted-foreground">{s.trend}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
    </Card>
  );
}

function Momentum({
  icon: Icon,
  tone,
  label,
  value,
  total,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "amber" | "rose";
  label: string;
  value: number;
  total: number;
}) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  const toneClass = {
    emerald: "bg-emerald-500/15 text-emerald-600",
    amber: "bg-amber-500/15 text-amber-600",
    rose: "bg-rose-500/15 text-rose-600",
  }[tone];
  const bar = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  }[tone];
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={`grid h-7 w-7 place-items-center rounded-md ${toneClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="font-medium">{label}</span>
        </div>
        <div className="font-bold tabular-nums">{value} <span className="text-xs font-normal text-muted-foreground">/ {total}</span></div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
