import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEmployer } from "@/lib/employer-data";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employer/post")({
  component: PostPage,
});

interface SkillOpt {
  id: string;
  name: string;
  category: string;
  demand_index: number;
}
interface JobRole {
  id: string;
  title: string;
  sector: string;
}

function PostPage() {
  const { employer, loading, needsSetup } = useEmployer();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [district, setDistrict] = useState("Dhaka");
  const [openings, setOpenings] = useState("1");
  const [salaryMin, setSalaryMin] = useState("30000");
  const [salaryMax, setSalaryMax] = useState("60000");
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [allSkills, setAllSkills] = useState<SkillOpt[]>([]);
  const [picked, setPicked] = useState<{ skill: SkillOpt; req: number }[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: rs }, { data: ss }] = await Promise.all([
        supabase.from("job_roles").select("id,title,sector").order("title"),
        supabase.from("skills").select("id,name,category,demand_index").order("name"),
      ]);
      setRoles((rs as JobRole[]) ?? []);
      setAllSkills((ss as SkillOpt[]) ?? []);
    })();
  }, []);

  // When role changes, prefill skills from role_skills
  useEffect(() => {
    if (!roleId) return;
    (async () => {
      const { data } = await supabase
        .from("role_skills")
        .select("required_proficiency,skills(id,name,category,demand_index)")
        .eq("role_id", roleId);
      const role = roles.find((r) => r.id === roleId);
      if (role && !title) setTitle(role.title);
      setPicked(
        ((data ?? []) as unknown as Array<{
          required_proficiency: number;
          skills: SkillOpt;
        }>).map((r) => ({ skill: r.skills, req: r.required_proficiency })),
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  const addSkill = (s: SkillOpt) => {
    if (picked.some((p) => p.skill.id === s.id)) return;
    setPicked([...picked, { skill: s, req: 3 }]);
    setQuery("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employer) return;
    if (picked.length === 0) {
      toast.error("Add at least one required skill");
      return;
    }
    setBusy(true);
    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        employer_id: employer.id,
        title,
        role_id: roleId || null,
        district,
        openings: Number(openings) || 1,
        salary_min: Number(salaryMin) || null,
        salary_max: Number(salaryMax) || null,
        status: "active",
      })
      .select("id")
      .single();
    if (error || !listing) {
      setBusy(false);
      toast.error(error?.message ?? "Failed");
      return;
    }
    const rows = picked.map((p) => ({
      listing_id: listing.id,
      skill_id: p.skill.id,
      required_proficiency: p.req,
    }));
    const { error: e2 } = await supabase.from("listing_skills").insert(rows);
    setBusy(false);
    if (e2) {
      toast.error(e2.message);
      return;
    }
    toast.success("Listing posted!");
    navigate({ to: "/employer/matches", search: { listing: listing.id } });
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (needsSetup) {
    return (
      <Card className="p-6">
        <p className="text-sm">Create your company profile first on the dashboard.</p>
      </Card>
    );
  }

  const filteredSkills = allSkills
    .filter(
      (s) =>
        query.length > 0 &&
        s.name.toLowerCase().includes(query.toLowerCase()) &&
        !picked.some((p) => p.skill.id === s.id),
    )
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          Post a new listing
        </div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Tell us who you need</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The skills you require become the match score for every candidate.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Card className="p-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Job title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Role template (optional)</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-fill required skills" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi"].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Openings</Label>
              <Input
                type="number"
                min={1}
                value={openings}
                onChange={(e) => setOpenings(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Salary min (BDT)</Label>
              <Input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Salary max (BDT)</Label>
              <Input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div>
            <Label>Required skills</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Search the taxonomy. Set each skill's required proficiency (1–5).
            </p>
          </div>

          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search (React, SQL, Bengali, …)"
            />
            {filteredSkills.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-soft">
                {filteredSkills.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addSkill(s)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    <span>
                      <span className="font-medium">{s.name}</span>{" "}
                      <span className="text-xs text-muted-foreground">· {s.category}</span>
                    </span>
                    <Badge variant="secondary">demand {s.demand_index}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {picked.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Add at least one required skill.
              </div>
            ) : (
              picked.map((p, i) => (
                <div
                  key={p.skill.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{p.skill.name}</div>
                    <div className="text-xs text-muted-foreground">{p.skill.category}</div>
                  </div>
                  <div className="w-48 shrink-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Required level</span>
                      <span className="font-bold text-primary">{p.req}</span>
                    </div>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[p.req]}
                      onValueChange={(v) =>
                        setPicked((arr) => {
                          const next = arr.slice();
                          next[i] = { ...next[i], req: v[0] };
                          return next;
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setPicked(picked.filter((x) => x.skill.id !== p.skill.id))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={busy} size="lg">
            <Plus className="mr-1.5 h-4 w-4" /> {busy ? "Posting…" : "Post listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
