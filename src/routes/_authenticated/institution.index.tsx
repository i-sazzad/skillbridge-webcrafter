import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/role-shell";

export const Route = createFileRoute("/_authenticated/institution/")({
  component: () => (
    <PagePlaceholder
      title="Programs"
      description="See each program's alignment score against live employer demand."
      phase="Phase 4 — Curriculum Analytics"
    />
  ),
});
