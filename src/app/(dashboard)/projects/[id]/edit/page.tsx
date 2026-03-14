import { notFound } from "next/navigation";
import { EditProjectFormWrapper } from "./form-wrapper";
import { getProjectById } from "@/lib/queries/projects";
import { getClients } from "@/lib/queries/clients";
import { getTemplates } from "@/lib/queries/templates";

export default async function EditProjectPage({
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

  const [allClients, allTemplates] = await Promise.all([getClients(), getTemplates()]);

  const clientOptions = allClients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company,
    address: c.address,
  }));

  const templateOptions = allTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    thumbnail_url: t.thumbnail_url,
    category: t.category,
    framework: t.framework,
  }));

  const client = (project as Record<string, unknown>).clients as {
    name: string;
  } | null;

  const contactInfo = project.contact_info as {
    phone?: string;
    email?: string;
    address?: string;
  } | null;

  const initialData = {
    title: project.title,
    domain_name: project.domain_name ?? "",
    is_rebuild: project.is_rebuild,
    client_name: client?.name ?? "",
    pages_required: project.pages_required ?? "",
    brief: project.brief ?? "",
    brief_summary: project.brief_summary ?? "",
    contact_info: {
      phone: contactInfo?.phone ?? "",
      email: contactInfo?.email ?? "",
      address: contactInfo?.address ?? "",
    },
    google_maps_embed: project.google_maps_embed ?? "",
    additional_notes: project.additional_notes ?? "",
    sitemap_url: project.sitemap_url ?? "",
    target_locations: project.target_locations ?? [],
    ai_model: project.ai_model ?? "orchids",
    one_off_revenue: Number(project.one_off_revenue),
    recurring_revenue: Number(project.recurring_revenue),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <EditProjectFormWrapper projectId={id} initialData={initialData} clients={clientOptions} templates={templateOptions} />
    </div>
  );
}
