DROP POLICY IF EXISTS profiles_select_all_auth ON public.profiles;
CREATE POLICY profiles_select_scoped ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'employer')
  OR public.has_role(auth.uid(), 'institution')
);

DROP POLICY IF EXISTS student_profiles_select_all ON public.student_profiles;
CREATE POLICY student_profiles_select_scoped ON public.student_profiles FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = student_profiles.profile_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'employer')
  OR public.has_role(auth.uid(), 'institution')
);

DROP POLICY IF EXISTS student_skills_select_all ON public.student_skills;
CREATE POLICY student_skills_select_scoped ON public.student_skills FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles s
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE s.id = student_skills.student_id AND p.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'employer')
  OR public.has_role(auth.uid(), 'institution')
);