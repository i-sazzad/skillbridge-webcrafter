import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/role-shell";

export const Route = createFileRoute("/_authenticated/employer/")({
  component: () => (
    <PagePlaceholder
      title="My Listings"
      description="Your active job postings and match counts."
      phase="Phase 5 — Employer Hub"
    />
  ),
});
