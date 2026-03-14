import { getClients } from "@/lib/queries/clients";
import { getTemplates } from "@/lib/queries/templates";
import { ProjectFormWrapper } from "./form-wrapper";

export default async function NewProjectPage() {
  const [clients, templates] = await Promise.all([getClients(), getTemplates()]);

  const clientOptions = clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company,
    address: c.address,
  }));

  const templateOptions = templates.map((t) => ({
    id: t.id,
    name: t.name,
    thumbnail_url: t.thumbnail_url,
    category: t.category,
    framework: t.framework,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ProjectFormWrapper clients={clientOptions} templates={templateOptions} />
    </div>
  );
}
