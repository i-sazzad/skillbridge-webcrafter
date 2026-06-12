import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEmployer } from "@/lib/employer-data";
import { toast } from "sonner";
import { Briefcase, MapPin, Plus, Users, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employer/")({
  component: EmployerHome,
});

interface Listing {
  id: string;
  title: string;
  district: string;
  openings: number;
  status: string;
  salary_min: number | null;
  salary_max: number | null;
}

function EmployerHome() {
  const { loading, employer, needsSetup, refresh, profileId } = useEmployer();
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (!employer) return;
    (async () => {
      const { data } = await supabase
        .from("listings")
        .select("id,title,district,openings,status,salary_min,salary_max")
        .eq("employer_id", employer.id)
        .order("created_at", { ascending: false });
      setListings((data as Listing[]) ?? []);
    })();
  }, [employer]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (needsSetup) return <EmployerSetup profileId={profileId} onDone={refresh} />;

  const totalOpenings = listings.reduce((s, l) => s + (l.openings ?? 0), 0);
  const activeCount = listings.filter((l) => l.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            {employer?.name}
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Talent Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {employer?.sector} · {employer?.district}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/employer/matches">View matches</Link>
          </Button>
          <Button asChild>
            <Link to="/employer/post">
              <Plus className="mr-1.5 h-4 w-4" /> Post listing
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5" /> Active listings
          </div>
          <div className="mt-2 text-4xl font-extrabold tracking-tight">{activeCount}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Total openings
          </div>
          <div className="mt-2 text-4xl font-extrabold tracking-tight">{totalOpenings}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Pool size
          </div>
          <div className="mt-2 text-4xl font-extrabold tracking-tight text-primary">25</div>
          <div className="mt-1 text-xs text-muted-foreground">candidates indexed</div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Your listings</h2>
          <Button asChild size="sm" variant="ghost">
            <Link to="/employer/post">
              <Plus className="mr-1 h-3.5 w-3.5" /> New
            </Link>
          </Button>
        </div>
        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No listings yet. Post your first one to start matching.
          </div>
        ) : (
          <div className="space-y-2">
            {listings.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{l.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {l.district} · {l.openings} opening
                    {l.openings === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={
                      l.status === "active"
                        ? "bg-gap-green/15 text-gap-green border-0"
                        : "bg-secondary"
                    }
                  >
                    {l.status}
                  </Badge>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/employer/matches" search={{ listing: l.id }}>
                      Matches
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmployerSetup({
  profileId,
  onDone,
}: {
  profileId: string | null;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [sector, setSector] = useState("Tech");
  const [district, setDistrict] = useState("Dhaka");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;
    setBusy(true);
    const { error } = await supabase
      .from("employers")
      .insert({ profile_id: profileId, name, sector, district });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Company profile created");
    onDone();
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Tell us about your company</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We'll use this on every job listing you post.
      </p>
      <Card className="mt-6 p-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cname">Company name</Label>
            <Input
              id="cname"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PathaoTech Ltd"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sector</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Tech", "Fintech", "Manufacturing", "Healthcare", "Retail", "Education"].map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>District</Label>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi"].map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Saving…" : "Create company profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
