import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Sparkles, ChevronRight, ChevronLeft, Check } from "lucide-react";

interface Program {
  id: string;
  name: string;
}
interface JobRole {
  id: string;
  title: string;
  sector: string;
}
interface SkillRow {
  id: string;
  name: string;
  category: string;
}

export function OnboardingWizard({ onDone }: { onDone: () => void }) {
  const { profile } = useAuthUser();
  const [step, setStep] = useState(0);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);

  const [programId, setProgramId] = useState<string>("");
  const [gradYear, setGradYear] = useState<string>("2026");
  const [targetRoleId, setTargetRoleId] = useState<string>("");
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: ps }, { data: rs }] = await Promise.all([
        supabase.from("programs").select("id,name").order("name"),
        supabase.from("job_roles").select("id,title,sector").order("title"),
      ]);
      setPrograms((ps as Program[]) ?? []);
      setRoles((rs as JobRole[]) ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!targetRoleId) return;
    (async () => {
      const { data } = await supabase
        .from("role_skills")
        .select("skills(id,name,category)")
        .eq("role_id", targetRoleId);
      const list = ((data ?? []) as Array<{ skills: SkillRow }>).map((r) => r.skills);
      setSkills(list);
      // initialize at 2
      const init: Record<string, number> = {};
      list.forEach((s) => {
        init[s.id] = skillLevels[s.id] ?? 2;
      });
      setSkillLevels(init);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetRoleId]);

  const finish = async () => {
    if (!profile) return;
    setSaving(true);
    const { data: sp, error } = await supabase
      .from("student_profiles")
      .insert({
        profile_id: profile.id,
        program_id: programId || null,
        grad_year: gradYear ? Number(gradYear) : null,
        target_role_id: targetRoleId,
      })
      .select("id")
      .single();

    if (error || !sp) {
      setSaving(false);
      toast.error(error?.message ?? "Could not save");
      return;
    }
    const rows = Object.entries(skillLevels).map(([skill_id, proficiency]) => ({
      student_id: sp.id,
      skill_id,
      proficiency,
    }));
    if (rows.length) {
      const { error: e2 } = await supabase.from("student_skills").insert(rows);
      if (e2) {
        toast.error(e2.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    toast.success("You're all set!");
    onDone();
  };

  const canNext =
    (step === 0 && !!programId && !!gradYear) ||
    (step === 1 && !!targetRoleId) ||
    step === 2;

  return (
    <Card className="mx-auto max-w-2xl p-6 md:p-8">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Quick setup · Step {step + 1} of 3
      </div>

      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold">Tell us about your studies</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This anchors your dashboard to a real program at a real institution.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Program</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Select your program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Graduation year</Label>
            <Select value={gradYear} onValueChange={setGradYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["2024", "2025", "2026", "2027", "2028"].map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold">What's your dream role?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We'll score every employer listing against it, in real time.
            </p>
          </div>
          <div className="grid gap-2">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setTargetRoleId(r.id)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                  targetRoleId === r.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div>
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.sector}</div>
                </div>
                {targetRoleId === r.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold">Rate yourself, 1–5</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Be honest. Your gaps become your roadmap.
            </p>
          </div>
          <div className="space-y-4 max-h-[42vh] overflow-y-auto pr-1">
            {skills.map((s) => (
              <div key={s.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.category}</div>
                  </div>
                  <div className="text-sm font-bold text-primary">
                    {skillLevels[s.id] ?? 2}
                  </div>
                </div>
                <Slider
                  className="mt-3"
                  min={1}
                  max={5}
                  step={1}
                  value={[skillLevels[s.id] ?? 2]}
                  onValueChange={(v) =>
                    setSkillLevels((m) => ({ ...m, [s.id]: v[0] }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Continue <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={finish} disabled={saving}>
            {saving ? "Saving…" : "Build my dashboard"}
          </Button>
        )}
      </div>
    </Card>
  );
}
