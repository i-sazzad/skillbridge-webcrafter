import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/role-shell";

export const Route = createFileRoute("/_authenticated/student/plan")({
  component: () => (
    <PagePlaceholder
      title="Learning Plan"
      description="Kanban board for the skills you're planning, learning, and have mastered."
      phase="Phase 2 — Student Experience"
    />
  ),
});
