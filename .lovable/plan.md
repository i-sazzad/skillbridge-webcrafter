
# SkillBridge AI — Phase 1 Build Plan

Foundation for the hackathon demo: landing page, auth with role selection, full database schema with seed data, and role-based dashboard shells. Later phases (Student experience, AI Coach, Curriculum Analytics, Employer Hub, polish) follow your prompt sequence.

## 1. Backend (Lovable Cloud)

Enable Lovable Cloud, then create migrations:

**Tables (with RLS + GRANTs):**
- `app_role` enum: `student | institution | employer | admin`
- `profiles` (user_id FK to auth.users, role, full_name) — auto-created via trigger on signup
- `user_roles` (separate table, security-definer `has_role()` function — never store role only on profiles for privilege checks; profiles.role used for routing convenience, user_roles is source of truth)
- `institutions`, `programs`, `courses`, `course_skills`
- `skills` (demand_index, trend, salary band)
- `student_profiles`, `student_skills`
- `employers`, `job_roles`, `role_skills`
- `listings`, `listing_skills`
- `graduate_outcomes`, `learning_plans`, `recommendations`
- `coach_messages` (used in Phase 3)

**RLS policies:**
- `profiles`: user reads/updates own row; everyone authenticated reads basic info
- Reference/public data (`skills`, `job_roles`, `institutions`, `programs`, `courses`, `employers`, `listings`, `*_skills`, `graduate_outcomes`): readable by all authenticated users (and anon for landing-page aggregates)
- `student_profiles`, `student_skills`, `learning_plans`, `coach_messages`: owner-only
- `recommendations`, `listings` writes: gated to institution/employer role via `has_role()`

**Seed data** (in migration, Bangladesh-flavored):
- 1 institution: Dhaka Polytechnic Institute + 3 programs (Diploma CT, BSc CSE, Cert Digital Marketing) + ~12 courses with course_skills mappings
- 40 skills across IT/Data/Business/Design with realistic demand_index (10–95), trends, salary bands
- 6 job_roles + role_skills (5–7 per role with weights)
- 8 employers (PathaoTech Ltd, bKashPay Systems, GreenTextile 4.0, etc.)
- 20 active listings across Dhaka/Chattogram/Sylhet + listing_skills
- 25 demo students + student_skills
- 150 graduate_outcomes (2023–2026, 55–78% placement)

Demo accounts (student@demo.com / institution@demo.com / employer@demo.com, pw `demo1234`) will be created in the final polish phase after auth flows are stable.

## 2. Design System

Update `src/styles.css`:
- Primary: emerald/teal `oklch` matching #0F766E family
- Accent: amber matching #F59E0B
- Semantic gap tokens: `--gap-red`, `--gap-yellow`, `--gap-green`
- Plus Jakarta Sans loaded via `<link>` in `__root.tsx` head, registered as `--font-sans` in `@theme`
- Soft radii, subtle shadow tokens, KPI number sizing

## 3. Pages & Routing

```
src/routes/
  __root.tsx                    # fonts, providers
  index.tsx                     # Landing
  auth.tsx                      # Login + Signup (role select)
  _authenticated/
    route.tsx                   # integration-managed gate
    dashboard.tsx               # Role router → redirects to /student, /institution, /employer
    student.tsx                 # Sidebar shell + Outlet
    student.index.tsx           # Dashboard placeholder
    student.coach.tsx
    student.explorer.tsx
    student.plan.tsx
    institution.tsx             # Sidebar shell
    institution.index.tsx       # Programs placeholder
    institution.analytics.tsx
    institution.outcomes.tsx
    employer.tsx                # Sidebar shell
    employer.index.tsx          # My Listings placeholder
    employer.post.tsx
    employer.matches.tsx
```

Post-login redirect: read `profiles.role` → navigate to matching role root. Each role sidebar uses shadcn `Sidebar` with collapsible icon mode.

## 4. Landing Page (hero feature for VC judges)

Public-readable Supabase queries power live data:
- **Hero**: headline "Teach what the market needs. Learn what gets you hired.", subhead, dual CTA
- **Live ticker**: marquee of top-10 rising skills (demand_index DESC where trend='rising') with trend arrows
- **Animated stat counters**: skills tracked, listings indexed, institutions onboarded, students matched — count-up on scroll
- **3 role CTA cards**: Student / Institution / Employer → /auth?role=...
- **Bangladesh Skills Pulse preview**: mini sector bar chart (Recharts) — full version in Phase 5
- Footer with "Built at Bangladesh AI Build Fest 2026" badge

## 5. Auth

- `/auth` with Login + Signup tabs (shadcn Tabs)
- Signup: email, password, full name, role select (student/institution/employer)
- DB trigger on `auth.users` insert → creates `profiles` row with chosen role (from raw_user_meta_data) and inserts into `user_roles`
- `emailRedirectTo: window.location.origin`
- Managed `_authenticated/route.tsx` redirects to `/auth`
- `/dashboard` reads role and `<Navigate>` to correct role root

## 6. Dashboard Shells

Each role gets a sidebar (logo, nav items, user menu with sign-out) and a top bar with `SidebarTrigger`. Inner pages are placeholders with "Coming in Phase 2/3/4/5" cards so navigation feels complete now. The Student Dashboard / AI Coach / Curriculum Analytics / Employer hub get their real implementations in the follow-up phases.

## Technical notes

- Stack: TanStack Start + React 19 + Tailwind v4 + shadcn/ui + Recharts + Supabase (Lovable Cloud)
- `bun add recharts` (also needed Phase 2+)
- Match-score utility lives in `src/lib/match.ts` (used Phase 2)
- All Supabase reads from components use the browser client; server-fn boundary reserved for the AI Coach in Phase 3
- Google sign-in not included unless requested (PRD says email auth)

## Out of scope for Phase 1
Student radar/onboarding, AI Coach chat + edge function, Gap Matrix heatmap, Employer match explorer, demo-account seeding, mobile polish pass — these map to the follow-up prompts.
