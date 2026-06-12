import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleShell, type NavItem } from "@/components/dashboard/role-shell";
import { BookOpen, BarChart3, GraduationCap } from "lucide-react";

const items: NavItem[] = [
  { title: "Programs", to: "/institution", icon: BookOpen },
  { title: "Curriculum Analytics", to: "/institution/analytics", icon: BarChart3 },
  { title: "Graduate Outcomes", to: "/institution/outcomes", icon: GraduationCap },
];

export const Route = createFileRoute("/_authenticated/institution")({
  component: () => (
    <RoleShell items={items} roleLabel="Institution">
      <Outlet />
    </RoleShell>
  ),
});
