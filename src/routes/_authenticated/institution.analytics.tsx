import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/role-shell";

export const Route = createFileRoute("/_authenticated/institution/analytics")({
  component: () => (
    <PagePlaceholder
      title="Curriculum Analytics"
      description="The Gap Matrix — exactly which skills to add, drop, and keep."
      phase="Phase 4 — Curriculum Analytics"
    />
  ),
});
