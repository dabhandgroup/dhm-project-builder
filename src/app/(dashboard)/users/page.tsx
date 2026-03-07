import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { mockProfiles } from "@/lib/mock-data";

export default function UsersPage() {
  const profiles = mockProfiles;

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage team members">
        <Button disabled>
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {profiles.map((p) => {
          const initials = p.full_name
            ? p.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
            : "??";
          return (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{p.full_name || "Unnamed User"}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.email} &middot; Joined {formatDate(p.created_at)}
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
