import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/role-shell";

export const Route = createFileRoute("/_authenticated/student/explorer")({
  component: () => (
    <PagePlaceholder
      title="Career Explorer"
      description="Browse job roles, see your live match %, and uncover missing skills."
      phase="Phase 2 — Student Experience"
    />
  ),
});
