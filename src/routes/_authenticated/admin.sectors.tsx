import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/sectors")({
  head: () => ({ meta: [{ title: "Sector Heatmap · Admin" }] }),
  component: SectorHeatmap,
});

function SectorHeatmap() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-sectors"],
    queryFn: async () => {
      const [listings, employers] = await Promise.all([
        supabase.from("listings").select("id,sector,location,status"),
        supabase.from("employers").select("id,sector,name"),
      ]);
      return { listings: listings.data ?? [], employers: employers.data ?? [] };
    },
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const sectors = Array.from(
    new Set([
      ...data.listings.map((l) => l.sector).filter(Boolean),
      ...data.employers.map((e) => e.sector).filter(Boolean),
    ]),
  ) as string[];

  const locations = Array.from(
    new Set(data.listings.map((l) => l.location).filter(Boolean)),
  ) as string[];

  const matrix: Record<string, Record<string, number>> = {};
  sectors.forEach((s) => {
    matrix[s] = {};
    locations.forEach((loc) => {
      matrix[s][loc] = data.listings.filter(
        (l) => l.sector === s && l.location === loc && l.status === "active",
      ).length;
    });
  });

  const max = Math.max(
    1,
    ...sectors.flatMap((s) => locations.map((loc) => matrix[s][loc] ?? 0)),
  );

  const tone = (n: number) => {
    if (n === 0) return "bg-secondary/40 text-muted-foreground";
    const intensity = n / max;
    if (intensity > 0.7) return "bg-primary text-primary-foreground";
    if (intensity > 0.4) return "bg-primary/60 text-primary-foreground";
    if (intensity > 0.15) return "bg-primary/30 text-foreground";
    return "bg-primary/15 text-foreground";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge variant="secondary" className="mb-2">Sector × Geography</Badge>
        <h1 className="text-3xl font-extrabold tracking-tight">Where the demand is</h1>
        <p className="text-sm text-muted-foreground">
          Active listings concentrated by sector and city. Use this to spot regional hiring surges.
        </p>
      </div>

      <Card className="overflow-x-auto p-5">
        <table className="w-full min-w-[600px] border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sector
              </th>
              {locations.map((loc) => (
                <th
                  key={loc}
                  className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {loc}
                </th>
              ))}
              <th className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((s) => {
              const rowTotal = locations.reduce((acc, loc) => acc + (matrix[s][loc] ?? 0), 0);
              return (
                <tr key={s}>
                  <td className="py-1 pr-3 font-medium">{s}</td>
                  {locations.map((loc) => {
                    const n = matrix[s][loc] ?? 0;
                    return (
                      <td key={loc} className="p-0">
                        <div
                          className={`grid h-10 place-items-center rounded-md text-sm font-bold ${tone(n)}`}
                        >
                          {n || ""}
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center font-bold tabular-nums">{rowTotal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-bold">Employer footprint</h2>
        <p className="text-xs text-muted-foreground">All registered employers grouped by sector.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sectors.map((s) => {
            const emps = data.employers.filter((e) => e.sector === s);
            if (!emps.length) return null;
            return (
              <div key={s} className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {s}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {emps.map((e) => (
                    <Badge key={e.id} variant="outline" className="text-[11px]">
                      {e.name}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
