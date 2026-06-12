import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/role-shell";

export const Route = createFileRoute("/_authenticated/student/coach")({
  component: () => (
    <PagePlaceholder
      title="AI Career Coach"
      description="Chat with an AI coach tuned to the Bangladesh job market."
      phase="Phase 3 — AI Coach"
    />
  ),
});
