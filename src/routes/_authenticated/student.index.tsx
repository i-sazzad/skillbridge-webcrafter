import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard/role-shell";
import { useAuthUser } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/student/")({
  component: StudentHome,
});

function StudentHome() {
  const { profile } = useAuthUser();
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Welcome</div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          Hi {profile?.full_name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personalized skill-gap dashboard is coming online next.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Job Match Score", "—%"],
          ["Skills Mastered", "—"],
          ["Skills In Progress", "—"],
        ].map(([k, v]) => (
          <Card key={k} className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {k}
            </div>
            <div className="mt-2 text-4xl font-extrabold tracking-tight">{v}</div>
          </Card>
        ))}
      </div>
      <PagePlaceholder
        title="Your skill-gap radar"
        description="A live radar chart of your skills vs your target role's requirements."
        phase="Phase 2 — Student Experience"
      />
    </div>
  );
}
