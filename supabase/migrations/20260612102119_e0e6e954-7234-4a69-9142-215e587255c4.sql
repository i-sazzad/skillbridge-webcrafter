
-- ====== ENUMS ======
CREATE TYPE public.app_role AS ENUM ('student','institution','employer','admin');
CREATE TYPE public.skill_trend AS ENUM ('rising','stable','declining');
CREATE TYPE public.listing_status AS ENUM ('active','closed','draft');
CREATE TYPE public.plan_status AS ENUM ('planned','in_progress','done');
CREATE TYPE public.outcome_status AS ENUM ('employed','unemployed','further_study','freelance');
CREATE TYPE public.coach_msg_role AS ENUM ('user','assistant','system');

-- ====== PROFILES ======
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ====== USER ROLES (separate, for has_role checks) ======
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ====== SIGNUP TRIGGER ======
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role app_role;
  v_name TEXT;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1));
  INSERT INTO public.profiles (user_id, role, full_name) VALUES (NEW.id, v_role, v_name);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====== INSTITUTIONS / PROGRAMS / COURSES ======
CREATE TABLE public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  district TEXT NOT NULL
);
GRANT SELECT ON public.institutions TO anon, authenticated;
GRANT ALL ON public.institutions TO service_role;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inst_public_read" ON public.institutions FOR SELECT USING (true);

CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL
);
GRANT SELECT ON public.programs TO anon, authenticated;
GRANT ALL ON public.programs TO service_role;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prog_public_read" ON public.programs FOR SELECT USING (true);

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  credits INT NOT NULL DEFAULT 3
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_public_read" ON public.courses FOR SELECT USING (true);

-- ====== SKILLS ======
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  demand_index INT NOT NULL DEFAULT 50,
  trend skill_trend NOT NULL DEFAULT 'stable',
  avg_salary_min INT,
  avg_salary_max INT
);
GRANT SELECT ON public.skills TO anon, authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_public_read" ON public.skills FOR SELECT USING (true);

CREATE TABLE public.course_skills (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_taught INT NOT NULL DEFAULT 3,
  PRIMARY KEY (course_id, skill_id)
);
GRANT SELECT ON public.course_skills TO anon, authenticated;
GRANT ALL ON public.course_skills TO service_role;
ALTER TABLE public.course_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_skills_public_read" ON public.course_skills FOR SELECT USING (true);

-- ====== JOB ROLES ======
CREATE TABLE public.job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  sector TEXT NOT NULL
);
GRANT SELECT ON public.job_roles TO anon, authenticated;
GRANT ALL ON public.job_roles TO service_role;
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_roles_public_read" ON public.job_roles FOR SELECT USING (true);

CREATE TABLE public.role_skills (
  role_id UUID NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  required_proficiency INT NOT NULL DEFAULT 3,
  weight INT NOT NULL DEFAULT 1,
  PRIMARY KEY (role_id, skill_id)
);
GRANT SELECT ON public.role_skills TO anon, authenticated;
GRANT ALL ON public.role_skills TO service_role;
ALTER TABLE public.role_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_skills_public_read" ON public.role_skills FOR SELECT USING (true);

-- ====== STUDENT PROFILES ======
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id),
  grad_year INT,
  target_role_id UUID REFERENCES public.job_roles(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_profiles_select_all" ON public.student_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "student_profiles_modify_own" ON public.student_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

CREATE TABLE public.student_skills (
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency INT NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
  PRIMARY KEY (student_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_skills TO authenticated;
GRANT ALL ON public.student_skills TO service_role;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_skills_select_all" ON public.student_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "student_skills_modify_own" ON public.student_skills FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_profiles s JOIN public.profiles p ON p.id=s.profile_id WHERE s.id=student_id AND p.user_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_profiles s JOIN public.profiles p ON p.id=s.profile_id WHERE s.id=student_id AND p.user_id=auth.uid()));

-- ====== EMPLOYERS / LISTINGS ======
CREATE TABLE public.employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  district TEXT NOT NULL
);
GRANT SELECT ON public.employers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.employers TO authenticated;
GRANT ALL ON public.employers TO service_role;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employers_public_read" ON public.employers FOR SELECT USING (true);
CREATE POLICY "employers_modify_own" ON public.employers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  role_id UUID REFERENCES public.job_roles(id),
  openings INT NOT NULL DEFAULT 1,
  salary_min INT,
  salary_max INT,
  district TEXT NOT NULL,
  status listing_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings_public_read" ON public.listings FOR SELECT USING (true);
CREATE POLICY "listings_modify_own_employer" ON public.listings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employers e JOIN public.profiles p ON p.id=e.profile_id WHERE e.id=employer_id AND p.user_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.employers e JOIN public.profiles p ON p.id=e.profile_id WHERE e.id=employer_id AND p.user_id=auth.uid()));

CREATE TABLE public.listing_skills (
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  required_proficiency INT NOT NULL DEFAULT 3,
  PRIMARY KEY (listing_id, skill_id)
);
GRANT SELECT ON public.listing_skills TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.listing_skills TO authenticated;
GRANT ALL ON public.listing_skills TO service_role;
ALTER TABLE public.listing_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_skills_public_read" ON public.listing_skills FOR SELECT USING (true);
CREATE POLICY "listing_skills_modify_own" ON public.listing_skills FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l JOIN public.employers e ON e.id=l.employer_id JOIN public.profiles p ON p.id=e.profile_id WHERE l.id=listing_id AND p.user_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l JOIN public.employers e ON e.id=l.employer_id JOIN public.profiles p ON p.id=e.profile_id WHERE l.id=listing_id AND p.user_id=auth.uid()));

-- ====== GRADUATE OUTCOMES ======
CREATE TABLE public.graduate_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  grad_year INT NOT NULL,
  status outcome_status NOT NULL,
  sector TEXT,
  salary_band TEXT,
  time_to_hire_days INT
);
GRANT SELECT ON public.graduate_outcomes TO anon, authenticated;
GRANT ALL ON public.graduate_outcomes TO service_role;
ALTER TABLE public.graduate_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grad_outcomes_public_read" ON public.graduate_outcomes FOR SELECT USING (true);

-- ====== LEARNING PLANS ======
CREATE TABLE public.learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  status plan_status NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_plans TO authenticated;
GRANT ALL ON public.learning_plans TO service_role;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_plans_own" ON public.learning_plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_profiles s JOIN public.profiles p ON p.id=s.profile_id WHERE s.id=student_id AND p.user_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_profiles s JOIN public.profiles p ON p.id=s.profile_id WHERE s.id=student_id AND p.user_id=auth.uid()));

-- ====== RECOMMENDATIONS ======
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  rationale TEXT NOT NULL,
  evidence_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rec_public_read" ON public.recommendations FOR SELECT TO authenticated USING (true);
CREATE POLICY "rec_inst_write" ON public.recommendations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'institution'));
CREATE POLICY "rec_inst_update" ON public.recommendations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'institution'));

-- ====== COACH MESSAGES ======
CREATE TABLE public.coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  role coach_msg_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.coach_messages TO authenticated;
GRANT ALL ON public.coach_messages TO service_role;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_msgs_own" ON public.coach_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_profiles s JOIN public.profiles p ON p.id=s.profile_id WHERE s.id=student_id AND p.user_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_profiles s JOIN public.profiles p ON p.id=s.profile_id WHERE s.id=student_id AND p.user_id=auth.uid()));
