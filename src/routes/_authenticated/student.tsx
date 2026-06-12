import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleShell, type NavItem } from "@/components/dashboard/role-shell";
import { LayoutDashboard, Sparkles, Compass, ListChecks } from "lucide-react";

const items: NavItem[] = [
  { title: "Dashboard", to: "/student", icon: LayoutDashboard },
  { title: "AI Coach", to: "/student/coach", icon: Sparkles },
  { title: "Career Explorer", to: "/student/explorer", icon: Compass },
  { title: "Learning Plan", to: "/student/plan", icon: ListChecks },
];

export const Route = createFileRoute("/_authenticated/student")({
  component: () => (
    <RoleShell items={items} roleLabel="Student">
      <Outlet />
    </RoleShell>
  ),
});
