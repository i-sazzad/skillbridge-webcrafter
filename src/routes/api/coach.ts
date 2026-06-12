import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/coach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const auth = request.headers.get("authorization") ?? "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!token) return new Response("Unauthorized", { status: 401 });

        const sbUrl = process.env.SUPABASE_URL!;
        const sbKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient(sbUrl, sbKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as { messages: UIMessage[] };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages required", { status: 400 });
        }

        // Load student context
        const { data: profile } = await supabase
          .from("profiles")
          .select("id,full_name")
          .eq("user_id", userData.user.id)
          .maybeSingle();

        let context = "Student context: (none yet)";
        if (profile) {
          const { data: sp } = await supabase
            .from("student_profiles")
            .select(
              "id,grad_year,programs(name,institutions(name)),job_roles(title,sector)",
            )
            .eq("profile_id", profile.id)
            .maybeSingle();

          if (sp) {
            const spRow = sp as unknown as {
              id: string;
              grad_year: number | null;
              programs: { name: string; institutions: { name: string } | null } | null;
              job_roles: { title: string; sector: string } | null;
            };
            const { data: skills } = await supabase
              .from("student_skills")
              .select("proficiency,skills(name,category,demand_index)")
              .eq("student_id", spRow.id);
            const { data: roleSkills } = spRow.job_roles
              ? await supabase
                  .from("role_skills")
                  .select(
                    "required_proficiency,weight,skills(id,name,demand_index)",
                  )
                  .eq(
                    "role_id",
                    (
                      await supabase
                        .from("student_profiles")
                        .select("target_role_id")
                        .eq("id", spRow.id)
                        .single()
                    ).data?.target_role_id ?? "",
                  )
              : { data: [] };

            context = [
              `Student: ${profile.full_name}`,
              `Program: ${spRow.programs?.name ?? "—"} at ${spRow.programs?.institutions?.name ?? "—"}`,
              `Graduation: ${spRow.grad_year ?? "—"}`,
              `Target role: ${spRow.job_roles?.title ?? "—"} (${spRow.job_roles?.sector ?? "—"})`,
              "",
              "Current skills (1-5):",
              ...((skills ?? []) as Array<{
                proficiency: number;
                skills: { name: string; category: string; demand_index: number };
              }>).map(
                (s) =>
                  `- ${s.skills.name} (${s.skills.category}) → you: ${s.proficiency}/5, market demand: ${s.skills.demand_index}`,
              ),
              "",
              "Target role requirements:",
              ...((roleSkills ?? []) as Array<{
                required_proficiency: number;
                weight: number;
                skills: { name: string; demand_index: number };
              }>).map(
                (r) =>
                  `- ${r.skills.name}: need ${r.required_proficiency}/5 (weight ${r.weight}, demand ${r.skills.demand_index})`,
              ),
            ].join("\n");
          }
        }

        const system = `You are SkillBridge AI Coach, a career mentor for students in Bangladesh.
You give grounded, specific advice using ONLY the student context below. Be warm, direct, and short.
Format with markdown: bold the key actions, use compact bullet lists, never more than 6 bullets.
When recommending learning, prefer high market-demand skills with biggest gap × weight.
Mention BDT salaries and Dhaka/Chattogram/Sylhet context when relevant. Avoid disclaimers.

${context}`;

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(body.messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: body.messages });
      },
    },
  },
});
