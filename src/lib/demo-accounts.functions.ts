import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DEMO_PASSWORD = "demo1234";

const DEMOS = {
  student: { email: "student@demo.com", full_name: "Anika Rahman" },
  institution: { email: "institution@demo.com", full_name: "Dhaka Polytechnic Admin" },
  employer: { email: "employer@demo.com", full_name: "PathaoTech Recruiter" },
} as const;

export const ensureDemoAccount = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ role: z.enum(["student", "institution", "employer"]) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const demo = DEMOS[data.role];

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users.find((u) => u.email === demo.email);

    if (!user) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: demo.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: demo.full_name, role: data.role },
      });
      if (createErr) throw new Error(createErr.message);
      user = created.user ?? undefined;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(user.id, { password: DEMO_PASSWORD });
    }

    if (data.role === "student" && user) {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (prof) {
        const { data: prog } = await supabaseAdmin.from("programs").select("id").limit(1).maybeSingle();
        const { data: role } = await supabaseAdmin.from("job_roles").select("id").limit(1).maybeSingle();
        const { data: sp } = await supabaseAdmin
          .from("student_profiles")
          .upsert(
            {
              profile_id: prof.id,
              program_id: prog?.id ?? null,
              target_role_id: role?.id ?? null,
              grad_year: 2026,
            } as never,
            { onConflict: "profile_id" },
          )
          .select("id")
          .maybeSingle();
        if (sp) {
          const { count } = await supabaseAdmin
            .from("student_skills")
            .select("*", { count: "exact", head: true })
            .eq("student_id", sp.id);
          if (!count) {
            const { data: skills } = await supabaseAdmin.from("skills").select("id").limit(6);
            if (skills?.length) {
              await supabaseAdmin.from("student_skills").insert(
                skills.map((s, i) => ({
                  student_id: sp.id,
                  skill_id: s.id,
                  proficiency: 2 + (i % 3),
                })),
              );
            }
          }
        }
      }
    }

    return { email: demo.email, password: DEMO_PASSWORD };
  });
