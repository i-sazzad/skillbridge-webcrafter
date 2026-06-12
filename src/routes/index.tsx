import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Building2,
  Briefcase,
  Sparkles,
  Activity,
  Zap,
  LineChart,
  Target,
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-primary/10 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_-4px_var(--primary)]">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-base font-extrabold tracking-tight">SkillBridge</span>
              <span className="font-display text-base font-extrabold text-primary">AI</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#pulse" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Skills Pulse
            </a>
            <a href="#audiences" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              For You
            </a>
            <a href="#how" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full font-bold shadow-[0_0_20px_-4px_var(--primary)] hover:shadow-[0_0_30px_-2px_var(--primary)]"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
        <div
          aria-hidden
          className="absolute left-1/2 top-0 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-50 blur-[140px]"
          style={{ background: "var(--primary)" }}
        />
        <div className="container mx-auto max-w-7xl px-4 pb-16 pt-20 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-secondary/40 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Built for Bangladesh AI Build Fest 2026
            </div>
            <h1 className="mt-7 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
              Teach what the market needs.{" "}
              <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                Learn what gets you hired.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              Bangladesh's first real-time workforce intelligence platform — telling schools what to
              teach, students what to learn, and employers where to hire.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="group rounded-xl px-7 py-6 text-base font-bold shadow-[0_0_30px_-6px_var(--primary)] hover:shadow-[0_0_45px_-4px_var(--primary)]"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started free
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl border-primary/30 bg-secondary/30 px-7 py-6 text-base font-bold backdrop-blur hover:bg-secondary/60"
              >
                <a href="#pulse">See Skills Pulse</a>
              </Button>
            </div>
          </div>

          {/* Ticker */}
          <div className="mt-16 overflow-hidden rounded-2xl border border-primary/15 bg-card/40 backdrop-blur">
            <div className="flex items-center gap-3 border-b border-primary/10 bg-secondary/30 px-4 py-2.5">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Live · Rising Skills in Bangladesh
              </span>
            </div>
            <div className="relative flex overflow-hidden py-3.5">
              <div className="flex shrink-0 animate-marquee gap-8 pl-8">
                {[...rising, ...rising].map((s, i) => (
                  <div key={i} className="flex shrink-0 items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{s.name}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{s.category}</span>
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
                      {s.demand_index}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Skills tracked" value={stats.skills} />
            <StatCard label="Active listings" value={stats.listings} />
            <StatCard label="Institutions onboarded" value={stats.institutions} />
            <StatCard label="Graduate records" value={stats.students} />
          </div>
        </div>
      </section>

      {/* Audiences — bento */}
      <section id="audiences" className="container mx-auto max-w-7xl px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-primary">The Platform</div>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            One graph. Three sides of the market.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pick your role — get a tailored experience built on the same real-time skills graph.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-6">
          <RoleCard
            className="md:col-span-3"
            icon={<GraduationCap className="h-6 w-6" />}
            tag="Students"
            title="Your AI career coach"
            body="See where you stand against your dream job, get a personalized skill-gap roadmap, and chat with an AI coach tuned to the Bangladesh market."
            href="student"
            featured
          />
          <RoleCard
            className="md:col-span-3"
            icon={<Building2 className="h-6 w-6" />}
            tag="Institutions"
            title="Curriculum intelligence"
            body="A live gap matrix shows exactly which skills to add or drop — backed by active employer demand and your own graduate outcomes."
            href="institution"
          />
          <RoleCard
            className="md:col-span-6"
            icon={<Briefcase className="h-6 w-6" />}
            tag="Employers"
            title="Pre-matched talent, ranked by verified proficiency"
            body="Publish skill requirements, see ranked candidates instantly, and stop sifting through generic CVs."
            href="employer"
            wide
          />
        </div>
      </section>

      {/* Pulse */}
      <section id="pulse" className="border-y border-primary/10 bg-secondary/10 py-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-primary">
                Bangladesh Skills Pulse
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-5xl">
                Top rising skills,{" "}
                <span className="text-primary">right now</span>
              </h2>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-primary/40 px-5 hover:bg-primary hover:text-primary-foreground"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Get the full dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {rising.slice(0, 10).map((s, i) => (
              <div
                key={s.name}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-card/50 p-4 backdrop-blur transition-all hover:border-primary/40 hover:bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 font-display text-sm font-bold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {s.category}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-secondary/60 md:block">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow shadow-[0_0_12px_-2px_var(--primary)]"
                      style={{ width: `${s.demand_index}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 font-display text-sm font-bold text-primary">
                    <TrendingUp className="h-3.5 w-3.5" /> {s.demand_index}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="container mx-auto max-w-7xl px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-primary">The Engine</div>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            A Bloomberg Terminal for talent.
          </h2>
          <p className="mt-4 text-muted-foreground">
            We index live employer demand, map it to a structured skills taxonomy, and feed it back
            to every side of the market — in real time.
          </p>
        </div>
        <div className="relative mt-14 grid gap-5 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-1/2 -z-10 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />
          {[
            { i: <Zap className="h-5 w-5" />, t: "Index", b: "We ingest live job listings and structure them into a national skills graph." },
            { i: <Target className="h-5 w-5" />, t: "Match", b: "Each student is scored against every job role using weighted proficiency math." },
            { i: <LineChart className="h-5 w-5" />, t: "Recommend", b: "Institutions get prioritized curriculum updates with hard evidence." },
          ].map((x, i) => (
            <div
              key={i}
              className="rounded-3xl border border-primary/15 bg-card/60 p-7 backdrop-blur transition-all hover:border-primary/40 hover:bg-card"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                  {x.i}
                </div>
                <div className="font-display text-xs font-bold uppercase tracking-widest text-primary">
                  Step {String(i + 1).padStart(2, "0")}
                </div>
              </div>
              <div className="mt-5 font-display text-xl font-bold">{x.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{x.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-7xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/30 bg-gradient-to-br from-secondary/60 via-card/60 to-secondary/30 p-12 text-center md:p-20">
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-80 w-80 rounded-full blur-[100px]"
            style={{ background: "var(--primary)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full opacity-60 blur-[100px]"
            style={{ background: "var(--primary-glow)" }}
          />
          <div className="relative">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/40 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Free during the hackathon preview
            </div>
            <h2 className="mt-6 font-display text-4xl font-extrabold tracking-tight md:text-6xl">
              Ready to close the skills gap?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
              Join SkillBridge AI today and plug into the live Bangladesh labor graph.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 rounded-xl px-8 py-6 text-base font-bold shadow-[0_0_40px_-6px_var(--primary)]"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Create your free account <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-primary/10 bg-background py-8">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <span>SkillBridge AI · © 2026</span>
          </div>
          <div className="rounded-full border border-primary/20 bg-secondary/30 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary/80">
            Built at Bangladesh AI Build Fest 2026
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  const v = useCounter(value);
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-primary/15 bg-card/40 p-6 backdrop-blur transition-all hover:border-primary/40">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: "var(--primary)" }}
      />
      <div className="relative font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
        {v.toLocaleString()}
      </div>
      <div className="relative mt-1 text-[10px] font-bold uppercase tracking-widest text-primary/80">
        {label}
      </div>
    </div>
  );
}

function RoleCard({
  icon,
  tag,
  title,
  body,
  href,
  featured,
  wide,
  className = "",
}: {
  icon: React.ReactNode;
  tag: string;
  title: string;
  body: string;
  href: string;
  featured?: boolean;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border p-8 backdrop-blur transition-all ${
        featured
          ? "border-primary/40 bg-gradient-to-br from-secondary/60 to-card/30 shadow-[0_0_40px_-12px_var(--primary)] hover:border-primary/60"
          : "border-primary/15 bg-card/40 hover:border-primary/40"
      } ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-3xl transition-opacity group-hover:opacity-60"
        style={{ background: featured ? "var(--primary-glow)" : "var(--primary)" }}
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-12 w-12 place-items-center rounded-2xl border ${
              featured
                ? "border-primary/40 bg-primary text-primary-foreground shadow-[0_0_20px_-4px_var(--primary)]"
                : "border-primary/30 bg-primary/10 text-primary"
            }`}
          >
            {icon}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary">
            For {tag}
          </div>
        </div>
        <h3 className={`mt-5 font-display font-bold ${wide ? "text-3xl md:text-4xl" : "text-2xl"}`}>
          {title}
        </h3>
        <p className={`mt-3 text-sm leading-relaxed text-muted-foreground ${wide ? "max-w-2xl" : ""}`}>
          {body}
        </p>
        <Link
          to="/auth"
          search={{ mode: "signup", role: href }}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-all group-hover:gap-2.5"
        >
          Continue as {tag.toLowerCase().replace(/s$/, "")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
