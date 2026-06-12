import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleShell, type NavItem } from "@/components/dashboard/role-shell";
import { LayoutDashboard, Network, Building2, Sparkles } from "lucide-react";

const items: NavItem[] = [
  { title: "Workforce Overview", to: "/admin", icon: LayoutDashboard },
  { title: "Sector Heatmap", to: "/admin/sectors", icon: Network },
  { title: "Institution League", to: "/admin/institutions", icon: Building2 },
  { title: "Skill Pulse", to: "/admin/skills", icon: Sparkles },
];

export const Route = createFileRoute("/_authenticated/admin")({
  component: () => (
    <RoleShell items={items} roleLabel="Administrator">
      <Outlet />
    </RoleShell>
  ),
});
