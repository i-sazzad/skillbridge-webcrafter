import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/role-shell";

export const Route = createFileRoute("/_authenticated/employer/post")({
  component: () => (
    <PagePlaceholder
      title="Post Requirement"
      description="Publish a new skill requirement and get pre-matched candidates."
      phase="Phase 5 — Employer Hub"
    />
  ),
});
