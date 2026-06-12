import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleShell, type NavItem } from "@/components/dashboard/role-shell";
import { Briefcase, PlusCircle, Users } from "lucide-react";

const items: NavItem[] = [
  { title: "My Listings", to: "/employer", icon: Briefcase },
  { title: "Post Requirement", to: "/employer/post", icon: PlusCircle },
  { title: "Candidate Matches", to: "/employer/matches", icon: Users },
];

export const Route = createFileRoute("/_authenticated/employer")({
  component: () => (
    <RoleShell items={items} roleLabel="Employer">
      <Outlet />
    </RoleShell>
  ),
});
