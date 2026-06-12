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

    // Try to find existing user
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((u) => u.email === demo.email);

    if (!existing) {
      const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: demo.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: demo.full_name, role: data.role },
      });
      if (createErr) throw new Error(createErr.message);
    } else {
      // Reset password so demo always works
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: DEMO_PASSWORD });
    }

    // For student, ensure a student_profile exists pointing at first institution + a target role
    if (data.role === "student") {
      const { data: u } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const me = u?.users.find((x) => x.email === demo.email);
      if (me) {
        const { data: inst } = await supabaseAdmin.from("institutions").select("id").limit(1).maybeSingle();
        const { data: prog } = await supabaseAdmin.from("programs").select("id").limit(1).maybeSingle();
        const { data: role } = await supabaseAdmin.from("job_roles").select("id").limit(1).maybeSingle();
        await supabaseAdmin.from("student_profiles").upsert(
          {
            user_id: me.id,
            institution_id: inst?.id ?? null,
            program_id: prog?.id ?? null,
            target_role_id: role?.id ?? null,
          },
          { onConflict: "user_id" },
        );
        // Seed a few baseline skills if none
        const { count } = await supabaseAdmin
          .from("student_skills")
          .select("*", { count: "exact", head: true })
          .eq("user_id", me.id);
        if (!count) {
          const { data: skills } = await supabaseAdmin.from("skills").select("id").limit(6);
          if (skills?.length) {
            await supabaseAdmin.from("student_skills").insert(
              skills.map((s, i) => ({ user_id: me.id, skill_id: s.id, proficiency: 2 + (i % 3) })),
            );
          }
        }
      }
    }

    return { email: demo.email, password: DEMO_PASSWORD };
  });
