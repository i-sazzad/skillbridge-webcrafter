import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/role-shell";

export const Route = createFileRoute("/_authenticated/employer/matches")({
  component: () => (
    <PagePlaceholder
      title="Candidate Matches"
      description="Ranked candidates with matched and missing skills per listing."
      phase="Phase 5 — Employer Hub"
    />
  ),
});
