import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Building2,
  Briefcase,
  Sparkles,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillBridge AI — Bangladesh's Labor Market Intelligence" },
      {
        name: "description",
        content:
          "Real-time workforce intelligence connecting students, institutions, and employers across Bangladesh.",
      },
      { property: "og:title", content: "SkillBridge AI" },
      {
        property: "og:description",
        content: "Teach what the market needs. Learn what gets you hired.",
      },
    ],
  }),
  component: Landing,
});

interface RisingSkill {
  name: string;
  demand_index: number;
  category: string;
}

function useCounter(target: number, durationMs = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return v;
}

function Landing() {
  const [rising, setRising] = useState<RisingSkill[]>([]);
  const [stats, setStats] = useState({ skills: 0, listings: 0, institutions: 0, students: 0 });

  useEffect(() => {
    (async () => {
      const [skillsRising, skillsCount, listingsCount, instCount, studentsCount] = await Promise.all([
        supabase
          .from("skills")
          .select("name,demand_index,category")
          .eq("trend", "rising")
          .order("demand_index", { ascending: false })
          .limit(12),
        supabase.from("skills").select("*", { count: "exact", head: true }),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("institutions").select("*", { count: "exact", head: true }),
        supabase.from("graduate_outcomes").select("*", { count: "exact", head: true }),
      ]);
      setRising((skillsRising.data as RisingSkill[] | null) ?? []);
      setStats({
        skills: skillsCount.count ?? 0,
        listings: listingsCount.count ?? 0,
        institutions: instCount.count ?? 0,
        students: studentsCount.count ?? 0,
      });
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight">SkillBridge AI</div>
              <div className="-mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Bangladesh
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#pulse" className="text-sm text-muted-foreground hover:text-foreground">
              Skills Pulse
            </a>
            <a href="#audiences" className="text-sm text-muted-foreground hover:text-foreground">
              For You
            </a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%)",
          }}
        />
        <div className="container mx-auto max-w-7xl px-4 pb-12 pt-16 md:pb-20 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Built for The Infinity AI Build Fest 2026
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl">
              Teach what the market needs.{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Learn what gets you hired.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              SkillBridge AI is Bangladesh's first real-time workforce intelligence platform —
              telling schools what to teach, students what to learn, and employers where to hire.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="shadow-soft">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started free <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#pulse">See Skills Pulse</a>
              </Button>
            </div>
          </div>

          {/* Ticker */}
          <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex items-center gap-3 border-b border-border bg-secondary/40 px-4 py-2.5">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-gap-green" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Live · Rising Skills in Bangladesh
              </span>
            </div>
            <div className="relative flex overflow-hidden py-3.5">
              <div className="flex shrink-0 animate-marquee gap-8 pl-8">
                {[...rising, ...rising].map((s, i) => (
                  <div key={i} className="flex shrink-0 items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-gap-green" />
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{s.category}</span>
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                      {s.demand_index}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Skills tracked" value={stats.skills} suffix="" />
            <StatCard label="Active listings" value={stats.listings} suffix="" />
            <StatCard label="Institutions onboarded" value={stats.institutions} suffix="" />
            <StatCard label="Graduate records" value={stats.students} suffix="" />
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section id="audiences" className="container mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">One platform. Three sides of the labor market.</h2>
          <p className="mt-3 text-muted-foreground">
            Pick your role — get a tailored experience built on the same real-time skills graph.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <RoleCard
            icon={<GraduationCap className="h-6 w-6" />}
            tag="Students"
            title="Your AI career coach"
            body="See where you stand against your dream job, get a personalized skill-gap roadmap, and chat with an AI coach tuned to the Bangladesh job market."
            href="student"
          />
          <RoleCard
            icon={<Building2 className="h-6 w-6" />}
            tag="Institutions"
            title="Curriculum intelligence"
            body="A live gap matrix shows exactly which skills to add or drop — backed by active employer demand and your own graduate outcomes."
            href="institution"
          />
          <RoleCard
            icon={<Briefcase className="h-6 w-6" />}
            tag="Employers"
            title="Pre-matched talent"
            body="Publish skill requirements, see ranked candidates instantly, and stop sifting through generic CVs."
            href="employer"
          />
        </div>
      </section>

      {/* Pulse */}
      <section id="pulse" className="border-t border-border bg-secondary/30 py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wider text-primary">
                Bangladesh Skills Pulse
              </div>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">Top rising skills, right now</h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get the full dashboard
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {rising.slice(0, 10).map((s, i) => (
              <Card key={s.name} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-secondary md:block">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow"
                      style={{ width: `${s.demand_index}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gap-green">
                    <TrendingUp className="h-3.5 w-3.5" /> {s.demand_index}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="container mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">A Bloomberg Terminal for talent.</h2>
          <p className="mt-3 text-muted-foreground">
            We index live employer demand, map it to a structured skills taxonomy, and feed it back
            to every side of the market — in real time.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { t: "Index", b: "We ingest live job listings and structure them into a national skills graph." },
            { t: "Match", b: "Each student is scored against every job role using weighted proficiency math." },
            { t: "Recommend", b: "Institutions get prioritized curriculum updates with hard evidence." },
          ].map((x, i) => (
            <Card key={i} className="p-6">
              <div className="text-sm font-semibold text-primary">Step {i + 1}</div>
              <div className="mt-1 text-lg font-semibold">{x.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{x.b}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-7xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to close the skills gap?</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">
            Join SkillBridge AI today — free during the hackathon preview.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create your free account <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-background py-8">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <span>SkillBridge AI · © 2026</span>
          </div>
          <div className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium">
            Built at The Infinity AI Build Fest 2026
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const v = useCounter(value);
  return (
    <Card className="p-5">
      <div className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
        {v.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
    </Card>
  );
}

function RoleCard({
  icon,
  tag,
  title,
  body,
  href,
}: {
  icon: React.ReactNode;
  tag: string;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Card className="group relative overflow-hidden p-6 transition-shadow hover:shadow-soft">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          For {tag}
        </div>
      </div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <Link
        to="/auth"
        search={{ mode: "signup", role: href }}
        className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2"
      >
        Continue as {tag.toLowerCase().replace(/s$/, "")} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Card>
  );
}
