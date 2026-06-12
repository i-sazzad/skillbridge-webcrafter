import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useStudent, computeMatchScore } from "@/lib/student-data";
import { Briefcase, MapPin, Search, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/explorer")({
  component: ExplorerPage,
});

interface Listing {
  id: string;
  title: string;
  district: string;
  salary_min: number | null;
  salary_max: number | null;
  employer: string;
  sector: string;
  reqs: { skill_id: string; required_proficiency: number; name: string }[];
}

function ExplorerPage() {
  const { studentSkills, loading } = useStudent();
  const [listings, setListings] = useState<Listing[]>([]);
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("listings")
        .select(
          "id,title,district,salary_min,salary_max,employers(name),job_roles(sector),listing_skills(skill_id,required_proficiency,skills(name))",
        )
        .eq("status", "active");
      setListings(
        ((data ?? []) as Array<{
          id: string;
          title: string;
          district: string;
          salary_min: number | null;
          salary_max: number | null;
          employers: { name: string } | null;
          job_roles: { sector: string } | null;
          listing_skills: {
            skill_id: string;
            required_proficiency: number;
            skills: { name: string };
          }[];
        }>).map((r) => ({
          id: r.id,
          title: r.title,
          district: r.district,
          salary_min: r.salary_min,
          salary_max: r.salary_max,
          employer: r.employers?.name ?? "—",
          sector: r.job_roles?.sector ?? "",
          reqs: r.listing_skills.map((s) => ({
            skill_id: s.skill_id,
            required_proficiency: s.required_proficiency,
            name: s.skills.name,
          })),
        })),
      );
    })();
  }, []);

  const districts = useMemo(
    () => Array.from(new Set(listings.map((l) => l.district))).sort(),
    [listings],
  );

  const scored = useMemo(
    () =>
      listings
        .map((l) => ({
          ...l,
          score: computeMatchScore(
            l.reqs.map((r) => ({
              skill_id: r.skill_id,
              required_proficiency: r.required_proficiency,
              weight: 1,
            })),
            studentSkills,
          ),
        }))
        .filter(
          (l) =>
            (!q ||
              l.title.toLowerCase().includes(q.toLowerCase()) ||
              l.employer.toLowerCase().includes(q.toLowerCase())) &&
            (district === "all" || l.district === district),
        )
        .sort((a, b) => b.score - a.score),
    [listings, studentSkills, q, district],
  );

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          Career Explorer
        </div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">All live opportunities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every active employer listing in Bangladesh, ranked by your personal match score.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or employer"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDistrict("all")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              district === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            All districts
          </button>
          {districts.map((d) => (
            <button
              key={d}
              onClick={() => setDistrict(d)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                district === d
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {scored.map((l) => (
          <Card
            key={l.id}
            className="flex flex-wrap items-center justify-between gap-4 p-5 transition-shadow hover:shadow-soft"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-bold">{l.title}</h3>
                {l.sector && (
                  <Badge variant="secondary" className="shrink-0">
                    {l.sector}
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {l.employer}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {l.district}
                </span>
                {l.salary_min && (
                  <span>
                    ৳{(l.salary_min / 1000).toFixed(0)}k–{((l.salary_max ?? 0) / 1000).toFixed(0)}k
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {l.reqs.slice(0, 6).map((r) => {
                  const have = studentSkills[r.skill_id] ?? 0;
                  const met = have >= r.required_proficiency;
                  return (
                    <span
                      key={r.skill_id}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        met
                          ? "bg-gap-green/15 text-gap-green"
                          : have > 0
                            ? "bg-gap-yellow/15 text-gap-yellow"
                            : "bg-gap-red/15 text-gap-red"
                      }`}
                    >
                      {r.name}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div
                className={`grid h-16 w-16 place-items-center rounded-full text-base font-extrabold ${
                  l.score >= 75
                    ? "bg-gap-green/15 text-gap-green"
                    : l.score >= 50
                      ? "bg-gap-yellow/15 text-gap-yellow"
                      : "bg-gap-red/15 text-gap-red"
                }`}
              >
                {l.score}%
              </div>
            </div>
          </Card>
        ))}
        {scored.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No listings match your filters.
          </Card>
        )}
      </div>
    </div>
  );
}
