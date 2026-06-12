import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/use-auth";

export interface EmployerRow {
  id: string;
  profile_id: string | null;
  name: string;
  sector: string;
  district: string;
}

export function useEmployer() {
  const { profile, loading: authLoading } = useAuthUser();
  const [employer, setEmployer] = useState<EmployerRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("employers")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();
    setEmployer((data as EmployerRow | null) ?? null);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  return {
    loading: authLoading || loading,
    employer,
    needsSetup: !!profile && !employer,
    refresh: load,
    profileId: profile?.id ?? null,
  };
}
