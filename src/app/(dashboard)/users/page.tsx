import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at");

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage team members">
        <Button disabled>
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {(profiles ?? []).map((p) => {
          const initials = p.full_name
            ? p.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
            : "??";
          return (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{p.full_name || "Unnamed User"}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(p.created_at)}
                  </p>
                </div>
                <Badge variant={p.role === "admin" ? "default" : "secondary"}>
                  {p.role}
                </Badge>
                {p.must_change_password && (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    Pending password
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
