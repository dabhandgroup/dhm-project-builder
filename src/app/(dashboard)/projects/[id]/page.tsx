import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectStatusSelect } from "@/components/projects/project-status-select";
import { OutreachMessageEditor } from "@/components/projects/outreach-message-editor";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Globe,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Image as ImageIcon,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateOutreachMessage } from "@/constants/message-templates";
import { getProjectById } from "@/lib/queries/projects";
import { PipelineStatus } from "@/components/projects/pipeline-status";
import { ConfettiTrigger } from "@/components/shared/confetti-trigger";
import { Suspense } from "react";
import type { ProjectStatus } from "@/types/database";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let project;
  try {
    project = await getProjectById(id);
  } catch {
    notFound();
  }

  if (!project) notFound();

  const client = (project as Record<string, unknown>).clients as {
    id: string;
    name: string;
    company: string | null;
  } | null;

  const outreachMessage = generateOutreachMessage({
    clientName: client?.name || "there",
    previewUrl: project.preview_url || `https://${project.domain_name || "preview.dabhandmarketing.com"}`,
    projectTitle: project.title,
  });

  const contactInfo = project.contact_info as {
    phone?: string;
    email?: string;
    address?: string;
  } | null;

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      <Suspense><ConfettiTrigger /></Suspense>
      <PageHeader title={project.title}>
        <Link href={`/projects/${id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>
      </PageHeader>

      {/* Project Details + Financials in 2 columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Project Details</CardTitle>
              <ProjectStatusSelect projectId={id} status={project.status as ProjectStatus} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm overflow-hidden">
            {project.logo_url ? (
              <div className="flex items-center gap-3 pb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.logo_url}
                  alt="Client logo"
                  className="h-10 max-w-[120px] object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span className="text-xs">No logo uploaded</span>
              </div>
            )}

            {project.domain_name && (
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{project.domain_name}</span>
                </div>
                <CopyButton text={project.domain_name} />
              </div>
            )}
            {project.preview_url && (
              <div className="flex items-center gap-2 min-w-0">
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={project.preview_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {project.preview_url}
                </a>
              </div>
            )}
            <div className="flex gap-2">
              <Badge variant="outline">
                {project.is_rebuild ? "Rebuild" : "New Build"}
              </Badge>
              {project.ai_model && (
                <Badge variant="secondary" className="uppercase text-[10px]">
                  {project.ai_model}
                </Badge>
              )}
            </div>
            {client && (
              <p className="text-muted-foreground">
                Client: <span className="text-foreground font-medium">{client.name}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Created {formatDate(project.created_at)}
            </p>
          </CardContent>
        </Card>

        {/* Right column: Financials + Contact */}
        <div className="space-y-6">
          {/* Financials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">One-off</span>
                <span className="font-medium">
                  {formatCurrency(Number(project.one_off_revenue))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(Number(project.recurring_revenue))}/mo
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          {contactInfo &&
            (contactInfo.phone || contactInfo.email || contactInfo.address) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {contactInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{contactInfo.phone}</span>
                    </div>
                  )}
                  {contactInfo.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{contactInfo.email}</span>
                    </div>
                  )}
                  {contactInfo.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{contactInfo.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Target Locations */}
          {project.target_locations && project.target_locations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Target Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {project.target_locations.map((loc: string) => (
                    <Badge key={loc} variant="secondary" className="text-xs">
                      {loc}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <PipelineStatus projectId={id} />

      {/* Brief — full width with copy */}
      {project.brief && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Brief</CardTitle>
              <CopyButton text={project.brief} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap break-words overflow-hidden">{project.brief}</p>
            {project.brief_summary && (
              <div className="mt-4 rounded-md bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  AI Summary
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {project.brief_summary}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pages Required — full width with copy */}
      {project.pages_required && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pages Required</CardTitle>
              <CopyButton text={project.pages_required} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {project.pages_required}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      {project.additional_notes && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Additional Notes</CardTitle>
              <CopyButton text={project.additional_notes} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{project.additional_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Outreach Message — full width, editable */}
      <OutreachMessageEditor initialMessage={outreachMessage} />
    </div>
  );
}
