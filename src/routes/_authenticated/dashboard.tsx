import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuthUser } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { profile, loading } = useAuthUser();
  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!profile) return <Navigate to="/auth" />;
  if (profile.role === "admin") return <Navigate to="/admin" />;
  if (profile.role === "institution") return <Navigate to="/institution" />;
  if (profile.role === "employer") return <Navigate to="/employer" />;
  return <Navigate to="/student" />;
}
