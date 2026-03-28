"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ArrowLeft, PenTool, Loader2, UserPlus, Search, Building2, X } from "lucide-react";
import { createContentPlan } from "@/actions/content-plans";
import { createClientAction } from "@/actions/clients";
import { toast } from "@/components/ui/toast";

interface ProjectOption {
  id: string;
  title: string;
  client_id: string | null;
}

interface ClientOption {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
}

export function NewContentPlanClient({
  projects,
  clients: initialClients,
}: {
  projects: ProjectOption[];
  clients: ClientOption[];
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [clients, setClients] = useState(initialClients);
  const [formData, setFormData] = useState({
    project_id: "",
    client_name: "",
    business_type: "",
    target_audience: "",
    locations: "",
    monthly_post_count: "4",
    notes: "",
  });

  // Inline client creation state
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newClientData, setNewClientData] = useState({ name: "", email: "", phone: "" });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    }
    if (clientDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [clientDropdownOpen]);

  const filteredClients = clientSearch.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.company?.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients;

  async function handleGenerate() {
    if (!formData.client_name.trim() || !formData.business_type.trim()) {
      toast({ title: "Please fill in client name and business type", variant: "destructive" });
      return;
    }

    // Create new client if needed
    if (isNewClient && newClientData.name) {
      const result = await createClientAction({
        name: newClientData.name,
        email: newClientData.email || undefined,
        phone: newClientData.phone || undefined,
      });
      if (result && "error" in result) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }
      if (result && "id" in result) {
        setSelectedClientId(result.id);
        setClients((prev) => [...prev, { id: result.id, name: newClientData.name }]);
      }
    }

    setGenerating(true);

    try {
      // Generate plan with AI
      const aiRes = await fetch("/api/content-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: formData.client_name,
          businessType: formData.business_type,
          targetAudience: formData.target_audience,
          locations: formData.locations,
          postsPerMonth: formData.monthly_post_count,
          notes: formData.notes,
          projectId: formData.project_id || undefined,
        }),
      });

      if (!aiRes.ok) {
        const err = await aiRes.json();
        toast({ title: err.error || "Failed to generate plan", variant: "destructive" });
        setGenerating(false);
        return;
      }

      const { plan } = await aiRes.json();

      // Save the generated plan
      const result = await createContentPlan({
        project_id: formData.project_id || null,
        plan_data: plan,
      });

      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
        setGenerating(false);
        return;
      }

      // Navigate to the new plan
      if (result.id) {
        router.push(`/content/${result.id}`);
      } else {
        router.push("/content");
      }
    } catch (err) {
      toast({ title: "Failed to generate content plan", variant: "destructive" });
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/content">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Create Content Plan</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client selector with inline creation */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <Label>Client (optional)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={isNewClient ? newClientData.name : clientSearch}
                onChange={(e) => {
                  if (isNewClient) {
                    setNewClientData((prev) => ({ ...prev, name: e.target.value }));
                  } else {
                    setClientSearch(e.target.value);
                    setClientDropdownOpen(true);
                  }
                }}
                onFocus={() => {
                  if (!isNewClient) setClientDropdownOpen(true);
                }}
                placeholder="Search clients or create new..."
                className="pl-9"
              />
              {isNewClient && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNewClient(false);
                    setClientSearch("");
                    setSelectedClientId(null);
                    setNewClientData({ name: "", email: "", phone: "" });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {clientDropdownOpen && !isNewClient && (
              <div className="absolute left-0 right-0 z-20 mt-1 rounded-lg border bg-background shadow-lg max-h-[240px] overflow-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewClient(true);
                    setNewClientData({ name: clientSearch, email: "", phone: "" });
                    setClientDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors border-b text-sm"
                >
                  <UserPlus className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-primary font-medium">
                    Create new client{clientSearch.trim() ? `: "${clientSearch}"` : ""}
                  </span>
                </button>

                {filteredClients.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">No clients found</p>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setClientSearch(client.name);
                        setClientDropdownOpen(false);
                        setFormData((prev) => ({ ...prev, client_name: client.name }));
                        // Auto-select project linked to this client
                        const linkedProject = projects.find((p) => p.client_id === client.id);
                        if (linkedProject) {
                          setFormData((prev) => ({ ...prev, project_id: linkedProject.id }));
                        }
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{client.name}</p>
                        {client.company && (
                          <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {isNewClient && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <p className="text-xs font-medium flex items-center gap-1">
                  <UserPlus className="h-3 w-3 text-primary" />
                  New Client Details
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. john@business.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={newClientData.phone}
                      onChange={(e) => setNewClientData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. 07700 900000"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Link to Project (optional)</Label>
            <Select
              value={formData.project_id}
              onChange={(e) => {
                const proj = projects.find((p) => p.id === e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  project_id: e.target.value,
                  client_name: proj?.title?.split("—")[0]?.trim() ?? prev.client_name,
                }));
              }}
              options={[
                { value: "", label: "Select a project..." },
                ...projects.map((p) => ({ value: p.id, label: p.title })),
              ]}
            />
            {projects.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No projects yet.{" "}
                <Link href="/" className="text-primary underline">
                  Create a project
                </Link>{" "}
                first to link content to it.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Client / Business Name</Label>
            <Input
              value={formData.client_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
              placeholder="e.g. Richardson Legal"
            />
          </div>

          <div className="space-y-2">
            <Label>Business Type / Industry</Label>
            <Input
              value={formData.business_type}
              onChange={(e) => setFormData((prev) => ({ ...prev, business_type: e.target.value }))}
              placeholder="e.g. Family law solicitor"
            />
          </div>

          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Input
              value={formData.target_audience}
              onChange={(e) => setFormData((prev) => ({ ...prev, target_audience: e.target.value }))}
              placeholder="e.g. Homeowners in Manchester"
            />
          </div>

          <div className="space-y-2">
            <Label>Target Locations</Label>
            <Input
              value={formData.locations}
              onChange={(e) => setFormData((prev) => ({ ...prev, locations: e.target.value }))}
              placeholder="e.g. Manchester, Salford, Stockport"
            />
          </div>

          <div className="space-y-2">
            <Label>Posts per Month</Label>
            <Select
              value={formData.monthly_post_count}
              onChange={(e) => setFormData((prev) => ({ ...prev, monthly_post_count: e.target.value }))}
              options={[
                { value: "2", label: "2 posts" },
                { value: "3", label: "3 posts" },
                { value: "4", label: "4 posts" },
                { value: "6", label: "6 posts" },
                { value: "8", label: "8 posts" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any specific topics, keywords, or goals..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button className="w-full h-11" onClick={handleGenerate} disabled={generating}>
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Plan...
          </>
        ) : (
          <>
            <PenTool className="h-4 w-4" />
            Generate Content Plan
          </>
        )}
      </Button>
    </div>
  );
}
