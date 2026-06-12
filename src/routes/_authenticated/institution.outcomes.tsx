import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/institution/outcomes")({
  component: OutcomesPage,
});

interface Outcome {
  program_id: string;
  program_name: string;
  grad_year: number;
  status: string;
  time_to_hire_days: number | null;
  salary_band: string | null;
}

function OutcomesPage() {
  const [rows, setRows] = useState<Outcome[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("graduate_outcomes")
        .select("program_id,grad_year,status,time_to_hire_days,salary_band,programs(name)");
      setRows(
        ((data ?? []) as unknown as Array<{
          program_id: string;
          grad_year: number;
          status: string;
          time_to_hire_days: number | null;
          salary_band: string | null;
          programs: { name: string } | null;
        }>).map((r) => ({
          program_id: r.program_id,
          program_name: r.programs?.name ?? "—",
          grad_year: r.grad_year,
          status: r.status,
          time_to_hire_days: r.time_to_hire_days,
          salary_band: r.salary_band,
        })),
      );
    })();
  }, []);

  const programs = useMemo(
    () => Array.from(new Set(rows.map((r) => r.program_name))).sort(),
    [rows],
  );
  const years = useMemo(
    () => Array.from(new Set(rows.map((r) => r.grad_year))).sort(),
    [rows],
  );

  const trendData = useMemo(() => {
    return years.map((year) => {
      const point: Record<string, number | string> = { year };
      programs.forEach((p) => {
        const cohort = rows.filter((r) => r.program_name === p && r.grad_year === year);
        const placed = cohort.filter((r) => r.status === "placed").length;
        point[p] = cohort.length ? Math.round((placed / cohort.length) * 100) : 0;
      });
      return point;
    });
  }, [rows, years, programs]);

  const colors = ["var(--primary)", "var(--accent)", "var(--gap-green)", "var(--gap-yellow)"];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          Graduate Outcomes
        </div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          Where your grads end up
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Placement rate by cohort. Track improvement as curriculum changes ship.
        </p>
      </div>

      <Card className="p-5">
        <div className="mb-3 text-lg font-bold">Placement rate over time</div>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--foreground)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {programs.map((p, i) => (
                <Line
                  key={p}
                  type="monotone"
                  dataKey={p}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {programs.map((p) => {
          const cohort = rows.filter((r) => r.program_name === p);
          const placed = cohort.filter((r) => r.status === "placed").length;
          const days = cohort
            .filter((r) => r.status === "placed" && r.time_to_hire_days != null)
            .map((r) => r.time_to_hire_days as number);
          const avgDays = days.length
            ? Math.round(days.reduce((s, d) => s + d, 0) / days.length)
            : 0;
          return (
            <Card key={p} className="p-5">
              <div className="text-sm font-semibold">{p}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {cohort.length} grads tracked
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Placement</div>
                  <div className="text-3xl font-extrabold text-primary">
                    {cohort.length ? Math.round((placed / cohort.length) * 100) : 0}%
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Avg days to hire</div>
                  <div className="text-3xl font-extrabold">{avgDays}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
