import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Activity, ArrowLeft, GraduationCap, Building2, Briefcase } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ensureDemoAccount } from "@/lib/demo-accounts.functions";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
  role: z.enum(["student", "institution", "employer"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in · SkillBridge AI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">(search.mode ?? "login");

  // Redirect if already signed in
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();
      const role = (p?.role as string) ?? "student";
      navigate({ to: "/dashboard" });
      void role;
    });
  }, [navigate]);

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      {/* Brand side */}
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground md:flex">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/10">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-bold">SkillBridge AI</span>
        </Link>
        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold leading-tight">
            Bangladesh's real-time labor market intelligence.
          </h1>
          <p className="max-w-md opacity-85">
            Whether you're a student, an institution, or an employer — your dashboard is one click
            away.
          </p>
        </div>
        <div className="text-xs opacity-70">© 2026 SkillBridge AI · Built at AI Build Fest</div>
      </div>

      {/* Form side */}
      <div className="flex flex-col p-6 md:p-10">
        <Link
          to="/"
          className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <Card className="w-full max-w-md p-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="pt-5">
                <LoginForm />
              </TabsContent>
              <TabsContent value="signup" className="pt-5">
                <SignupForm initialRole={search.role ?? "student"} />
              </TabsContent>
            </Tabs>
          </Card>
          <DemoLauncher />
        </div>

      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function SignupForm({ initialRole }: { initialRole: "student" | "institution" | "employer" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "institution" | "employer">(initialRole);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name, role },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — welcome to SkillBridge!");
    navigate({ to: "/dashboard" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">Email</Label>
        <Input
          id="su-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-password">Password</Label>
        <Input
          id="su-password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>I am a…</Label>
        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student / Graduate</SelectItem>
            <SelectItem value="institution">Institution / Educator</SelectItem>
            <SelectItem value="employer">Employer / Recruiter</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

function DemoLauncher() {
  const navigate = useNavigate();
  const ensure = useServerFn(ensureDemoAccount);
  const [busy, setBusy] = useState<null | "student" | "institution" | "employer">(null);

  const launch = async (role: "student" | "institution" | "employer") => {
    setBusy(role);
    try {
      const creds = await ensure({ data: { role } });
      const { error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });
      if (error) throw error;
      toast.success(`Signed in as demo ${role}`);
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Demo sign-in failed");
    } finally {
      setBusy(null);
    }
  };

  const items = [
    { role: "student" as const, label: "Student", icon: GraduationCap },
    { role: "institution" as const, label: "Institution", icon: Building2 },
    { role: "employer" as const, label: "Employer", icon: Briefcase },
  ];

  return (
    <Card className="w-full max-w-md p-5">
      <div className="mb-3 text-center">
        <p className="text-sm font-semibold">Try the live demo</p>
        <p className="text-xs text-muted-foreground">One click — no signup needed.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ role, label, icon: Icon }) => (
          <Button
            key={role}
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => launch(role)}
            className="flex h-auto flex-col gap-1 py-3"
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs">{busy === role ? "…" : label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}

