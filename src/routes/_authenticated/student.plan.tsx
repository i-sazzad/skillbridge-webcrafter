import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStudent } from "@/lib/student-data";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Target, TrendingUp, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/plan")({
  component: PlanPage,
});

interface CourseHit {
  skill_id: string;
  course_id: string;
  course_name: string;
  program_name: string;
}

function PlanPage() {
  const { loading, needsOnboarding, studentSkills, roleSkills, targetRole } = useStudent();
  const [courses, setCourses] = useState<CourseHit[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("course_skills")
        .select("skill_id,courses(id,name,programs(name))");
      setCourses(
        ((data ?? []) as Array<{
          skill_id: string;
          courses: { id: string; name: string; programs: { name: string } | null } | null;
        }>)
          .filter((r) => r.courses)
          .map((r) => ({
            skill_id: r.skill_id,
            course_id: r.courses!.id,
            course_name: r.courses!.name,
            program_name: r.courses!.programs?.name ?? "",
          })),
      );
    })();
  }, []);

  const gaps = useMemo(
    () =>
      roleSkills
        .map((r) => {
          const have = studentSkills[r.skill_id] ?? 0;
          return { ...r, have, gap: Math.max(0, r.required_proficiency - have) };
        })
        .filter((g) => g.gap > 0)
        .sort((a, b) => b.gap * b.weight - a.gap * a.weight),
    [roleSkills, studentSkills],
  );

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (needsOnboarding) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Finish setup on your dashboard first.</p>
        <Button asChild className="mt-4">
          <Link to="/student">Go to dashboard</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          Learning plan
        </div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Your roadmap to hire-ready</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Skills are ranked by impact on your <span className="font-semibold text-foreground">{targetRole?.title}</span>{" "}
          match. Each gap maps to courses across our institution network.
        </p>
      </div>

      {gaps.length === 0 ? (
        <Card className="flex items-center gap-4 border-gap-green/40 bg-gap-green/5 p-6">
          <Target className="h-6 w-6 text-gap-green" />
          <div>
            <div className="font-semibold">You meet every required skill 🎉</div>
            <div className="text-sm text-muted-foreground">
              Aim for proficiency 5 in your weakest area to maximise match.
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {gaps.map((g, i) => {
            const related = courses.filter((c) => c.skill_id === g.skill_id);
            return (
              <Card key={g.skill_id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold">{g.skill.name}</h3>
                        <Badge variant="secondary">{g.skill.category}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        You {g.have} → target {g.required_proficiency} · Demand{" "}
                        <span className="font-semibold text-foreground">{g.skill.demand_index}</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${
                      g.gap >= 3
                        ? "bg-gap-red/15 text-gap-red"
                        : g.gap === 2
                          ? "bg-gap-yellow/15 text-gap-yellow"
                          : "bg-gap-green/15 text-gap-green"
                    } border-0`}
                  >
                    Close gap by {g.gap} level{g.gap > 1 ? "s" : ""}
                  </Badge>
                </div>

                {related.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" /> Recommended courses
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {related.map((c) => (
                        <div
                          key={c.course_id}
                          className="rounded-lg border border-border p-3 text-sm"
                        >
                          <div className="font-semibold">{c.course_name}</div>
                          <div className="text-xs text-muted-foreground">{c.program_name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" /> No course on our network teaches this
                    yet — flagged for institution analytics.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-semibold">Need help prioritising?</div>
            <div className="text-xs text-muted-foreground">
              Ask the AI Coach for a weekly study schedule based on your gaps.
            </div>
          </div>
        </div>
        <Button asChild>
          <Link to="/student/coach">Ask AI Coach</Link>
        </Button>
      </Card>
    </div>
  );
}
