import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/use-auth";
import { computeMatchScore, type RoleSkillReq } from "@/lib/match";

export interface Skill {
  id: string;
  name: string;
  category: string;
  demand_index: number;
}
export interface JobRole {
  id: string;
  title: string;
  sector: string;
}
export interface StudentProfileRow {
  id: string;
  profile_id: string;
  program_id: string | null;
  grad_year: number | null;
  target_role_id: string | null;
}

export interface StudentBundle {
  loading: boolean;
  needsOnboarding: boolean;
  student: StudentProfileRow | null;
  studentSkills: Record<string, number>;
  targetRole: JobRole | null;
  roleSkills: (RoleSkillReq & { skill: Skill })[];
  refresh: () => Promise<void>;
}

export function useStudent(): StudentBundle {
  const { profile, loading: authLoading } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentProfileRow | null>(null);
  const [studentSkills, setStudentSkills] = useState<Record<string, number>>({});
  const [targetRole, setTargetRole] = useState<JobRole | null>(null);
  const [roleSkills, setRoleSkills] = useState<(RoleSkillReq & { skill: Skill })[]>([]);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data: sp } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();
    const s = (sp as StudentProfileRow | null) ?? null;
    setStudent(s);

    if (!s) {
      setStudentSkills({});
      setTargetRole(null);
      setRoleSkills([]);
      setLoading(false);
      return;
    }

    const skillsP = supabase
      .from("student_skills")
      .select("skill_id,proficiency")
      .eq("student_id", s.id);

    const rolePromise = s.target_role_id
      ? supabase.from("job_roles").select("*").eq("id", s.target_role_id).maybeSingle()
      : Promise.resolve({ data: null });

    const roleSkillsPromise = s.target_role_id
      ? supabase
          .from("role_skills")
          .select("skill_id,required_proficiency,weight,skills(id,name,category,demand_index)")
          .eq("role_id", s.target_role_id)
      : Promise.resolve({ data: [] });

    const [{ data: ss }, { data: rr }, { data: rs }] = await Promise.all([
      skillsP,
      rolePromise,
      roleSkillsPromise,
    ]);

    const map: Record<string, number> = {};
    (ss ?? []).forEach((r: { skill_id: string; proficiency: number }) => {
      map[r.skill_id] = r.proficiency;
    });
    setStudentSkills(map);
    setTargetRole((rr as JobRole | null) ?? null);
    setRoleSkills(
      ((rs ?? []) as Array<{
        skill_id: string;
        required_proficiency: number;
        weight: number;
        skills: Skill;
      }>).map((r) => ({
        skill_id: r.skill_id,
        required_proficiency: r.required_proficiency,
        weight: r.weight,
        skill: r.skills,
      })),
    );
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  return {
    loading: authLoading || loading,
    needsOnboarding: !!profile && !student,
    student,
    studentSkills,
    targetRole,
    roleSkills,
    refresh: load,
  };
}

export { computeMatchScore };
