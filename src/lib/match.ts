// Match score = sum(weight * min(student_prof/required_prof, 1)) / sum(weights) * 100
export interface RoleSkillReq {
  skill_id: string;
  required_proficiency: number;
  weight: number;
}
export type StudentSkillMap = Record<string, number>; // skill_id -> proficiency

export function computeMatchScore(reqs: RoleSkillReq[], have: StudentSkillMap): number {
  if (!reqs.length) return 0;
  const totalW = reqs.reduce((s, r) => s + r.weight, 0);
  if (!totalW) return 0;
  const sum = reqs.reduce((s, r) => {
    const sp = have[r.skill_id] ?? 0;
    return s + r.weight * Math.min(sp / r.required_proficiency, 1);
  }, 0);
  return Math.round((sum / totalW) * 100);
}
