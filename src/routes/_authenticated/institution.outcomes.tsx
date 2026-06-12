import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/role-shell";

export const Route = createFileRoute("/_authenticated/institution/outcomes")({
  component: () => (
    <PagePlaceholder
      title="Graduate Outcomes"
      description="Track placement rates, time-to-hire, and salary bands by program."
      phase="Phase 4 — Curriculum Analytics"
    />
  ),
});
