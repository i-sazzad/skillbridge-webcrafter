import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useEmployer } from "@/lib/employer-data";
import { computeMatchScore } from "@/lib/match";
import { GraduationCap, Target } from "lucide-react";

const search = z.object({ listing: z.string().optional() });

export const Route = createFileRoute("/_authenticated/employer/matches")({
  validateSearch: search,
  component: MatchesPage,
});

interface Listing {
  id: string;
  title: string;
  reqs: { skill_id: string; required_proficiency: number; name: string }[];
}

interface Candidate {
  student_id: string;
  full_name: string;
  program: string;
  grad_year: number | null;
  skills: Record<string, number>;
}

function MatchesPage() {
  const { employer, loading } = useEmployer();
  const sp = Route.useSearch();
  const [listings, setListings] = useState<Listing[]>([]);
  const [active, setActive] = useState<string>(sp.listing ?? "");
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    if (!employer) return;
    (async () => {
      const { data } = await supabase
        .from("listings")
        .select(
          "id,title,listing_skills(skill_id,required_proficiency,skills(name))",
        )
        .eq("employer_id", employer.id)
        .eq("status", "active");
      const ls = ((data ?? []) as unknown as Array<{
        id: string;
        title: string;
        listing_skills: Array<{
          skill_id: string;
          required_proficiency: number;
          skills: { name: string };
        }>;
      }>).map((r) => ({
        id: r.id,
        title: r.title,
        reqs: r.listing_skills.map((s) => ({
          skill_id: s.skill_id,
          required_proficiency: s.required_proficiency,
          name: s.skills.name,
        })),
      }));
      setListings(ls);
      if (!active && ls.length > 0) setActive(ls[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employer]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("student_profiles")
        .select(
          "id,grad_year,profiles(full_name),programs(name),student_skills(skill_id,proficiency)",
        );
      setCandidates(
        ((data ?? []) as unknown as Array<{
          id: string;
          grad_year: number | null;
          profiles: { full_name: string } | null;
          programs: { name: string } | null;
          student_skills: { skill_id: string; proficiency: number }[];
        }>).map((r) => {
          const map: Record<string, number> = {};
          r.student_skills.forEach((s) => {
            map[s.skill_id] = s.proficiency;
          });
          return {
            student_id: r.id,
            full_name: r.profiles?.full_name ?? "Anonymous",
            program: r.programs?.name ?? "—",
            grad_year: r.grad_year,
            skills: map,
          };
        }),
      );
    })();
  }, []);

  const current = listings.find((l) => l.id === active);

  const ranked = useMemo(() => {
    if (!current) return [];
    return candidates
      .map((c) => ({
        ...c,
        score: computeMatchScore(
          current.reqs.map((r) => ({
            skill_id: r.skill_id,
            required_proficiency: r.required_proficiency,
            weight: 1,
          })),
          c.skills,
        ),
        met: current.reqs.filter(
          (r) => (c.skills[r.skill_id] ?? 0) >= r.required_proficiency,
        ).length,
        missing: current.reqs.filter((r) => (c.skills[r.skill_id] ?? 0) === 0),
      }))
      .sort((a, b) => b.score - a.score);
  }, [current, candidates]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Match Explorer
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Pre-matched candidates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every indexed student, ranked by fit for this role's skill requirements.
          </p>
        </div>
        <div className="w-full md:w-80">
          <Select value={active} onValueChange={setActive}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a listing" />
            </SelectTrigger>
            <SelectContent>
              {listings.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {current && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Target className="h-3.5 w-3.5" /> Requirements
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {current.reqs.map((r) => (
              <Badge key={r.skill_id} variant="secondary">
                {r.name} · {r.required_proficiency}/5
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-3">
        {ranked.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No candidates indexed yet.
          </Card>
        )}
        {ranked.map((c) => (
          <Card
            key={c.student_id}
            className="flex flex-wrap items-center justify-between gap-4 p-5 transition-shadow hover:shadow-soft"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-base font-bold text-primary">
                {c.full_name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{c.full_name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <GraduationCap className="h-3 w-3" /> {c.program}
                  {c.grad_year && <span>· class of {c.grad_year}</span>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Meets <span className="font-semibold text-foreground">{c.met}</span> of{" "}
                  {current?.reqs.length ?? 0} required skills
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div
                className={`grid h-16 w-16 place-items-center rounded-full text-base font-extrabold ${
                  c.score >= 75
                    ? "bg-gap-green/15 text-gap-green"
                    : c.score >= 50
                      ? "bg-gap-yellow/15 text-gap-yellow"
                      : "bg-gap-red/15 text-gap-red"
                }`}
              >
                {c.score}%
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
