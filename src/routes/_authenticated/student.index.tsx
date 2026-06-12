import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthUser } from "@/hooks/use-auth";
import { useStudent, computeMatchScore } from "@/lib/student-data";
import { OnboardingWizard } from "@/components/student/onboarding-wizard";
import { SkillRadar, type RadarPoint } from "@/components/student/skill-radar";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  MapPin,
  Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/")({
  component: StudentHome,
});

interface ListingMatch {
  id: string;
  title: string;
  district: string;
  salary_min: number | null;
  salary_max: number | null;
  employer: string;
  reqs: { skill_id: string; required_proficiency: number }[];
}

function StudentHome() {
  const { profile } = useAuthUser();
  const { loading, needsOnboarding, student, studentSkills, targetRole, roleSkills, refresh } =
    useStudent();
  const [listings, setListings] = useState<ListingMatch[]>([]);

  useEffect(() => {
    if (!student) return;
    (async () => {
      const { data } = await supabase
        .from("listings")
        .select(
          "id,title,district,salary_min,salary_max,employers(name),listing_skills(skill_id,required_proficiency)",
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
          listing_skills: { skill_id: string; required_proficiency: number }[];
        }>).map((r) => ({
          id: r.id,
          title: r.title,
          district: r.district,
          salary_min: r.salary_min,
          salary_max: r.salary_max,
          employer: r.employers?.name ?? "—",
          reqs: r.listing_skills,
        })),
      );
    })();
  }, [student]);

  const overallMatch = useMemo(
    () =>
      computeMatchScore(
        roleSkills.map((r) => ({
          skill_id: r.skill_id,
          required_proficiency: r.required_proficiency,
          weight: r.weight,
        })),
        studentSkills,
      ),
    [roleSkills, studentSkills],
  );

  const radarData: RadarPoint[] = useMemo(
    () =>
      roleSkills
        .slice()
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 7)
        .map((r) => ({
          skill: r.skill.name,
          you: studentSkills[r.skill_id] ?? 0,
          target: r.required_proficiency,
        })),
    [roleSkills, studentSkills],
  );

  const gaps = useMemo(
    () =>
      roleSkills
        .map((r) => {
          const have = studentSkills[r.skill_id] ?? 0;
          return { ...r, have, gap: Math.max(0, r.required_proficiency - have) };
        })
        .sort((a, b) => b.gap * b.weight - a.gap * a.weight),
    [roleSkills, studentSkills],
  );

  const topListings = useMemo(
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
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    [listings, studentSkills],
  );

  const mastered = Object.values(studentSkills).filter((v) => v >= 4).length;
  const inProgress = Object.values(studentSkills).filter((v) => v >= 2 && v < 4).length;

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  if (needsOnboarding) {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Welcome
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Hi {profile?.full_name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let's spin up your personalized dashboard — takes under a minute.
          </p>
        </div>
        <OnboardingWizard onDone={refresh} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Your dashboard
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Hi {profile?.full_name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Targeting <span className="font-semibold text-foreground">{targetRole?.title}</span>{" "}
            · {targetRole?.sector}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/student/coach">
            <Sparkles className="mr-1.5 h-4 w-4" /> Ask AI Coach
          </Link>
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Target className="h-3.5 w-3.5" /> Job match score
          </div>
          <div className="mt-2 flex items-end gap-2">
            <div className="text-5xl font-extrabold tracking-tight text-primary">
              {overallMatch}
              <span className="text-2xl text-muted-foreground">%</span>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all"
              style={{ width: `${overallMatch}%` }}
            />
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Skills mastered
          </div>
          <div className="mt-2 text-5xl font-extrabold tracking-tight">{mastered}</div>
          <div className="mt-1 text-xs text-muted-foreground">Rated 4 or 5 out of 5</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            In progress
          </div>
          <div className="mt-2 text-5xl font-extrabold tracking-tight">{inProgress}</div>
          <div className="mt-1 text-xs text-muted-foreground">Rated 2 or 3 out of 5</div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Radar */}
        <Card className="p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                Skill-gap radar
              </div>
              <h2 className="text-lg font-bold">You vs target role</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> You
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" /> Target
              </span>
            </div>
          </div>
          {radarData.length > 2 ? (
            <SkillRadar data={radarData} />
          ) : (
            <div className="grid h-[340px] place-items-center text-sm text-muted-foreground">
              Not enough skills to chart yet.
            </div>
          )}
        </Card>

        {/* Gap list */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                Priority gaps
              </div>
              <h2 className="text-lg font-bold">Close these first</h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/student/plan">
                Plan <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {gaps.slice(0, 6).map((g) => {
              const tone =
                g.gap === 0
                  ? "bg-gap-green/15 text-gap-green"
                  : g.gap <= 1
                    ? "bg-gap-yellow/15 text-gap-yellow"
                    : "bg-gap-red/15 text-gap-red";
              return (
                <div
                  key={g.skill_id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{g.skill.name}</div>
                    <div className="text-xs text-muted-foreground">
                      You {g.have} · need {g.required_proficiency}
                    </div>
                  </div>
                  <Badge className={`shrink-0 ${tone} border-0`} variant="secondary">
                    {g.gap === 0 ? "Met" : `Gap ${g.gap}`}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Top listings */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Live opportunities
            </div>
            <h2 className="text-lg font-bold">Your top job matches</h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/student/explorer">
              See all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {topListings.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-shadow hover:shadow-soft"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{l.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Briefcase className="h-3 w-3" /> {l.employer}
                  <span>·</span>
                  <MapPin className="h-3 w-3" /> {l.district}
                </div>
                {l.salary_min && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    ৳{(l.salary_min / 1000).toFixed(0)}k–{(l.salary_max ?? 0) / 1000}k
                  </div>
                )}
              </div>
              <div className="grid shrink-0 place-items-center">
                <div
                  className={`grid h-14 w-14 place-items-center rounded-full text-sm font-extrabold ${
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
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-semibold">Skills market is moving fast.</div>
            <div className="text-xs text-muted-foreground">
              Explore career paths or get coaching to level up your top gap.
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/student/explorer">Career Explorer</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/student/coach">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Ask coach
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
