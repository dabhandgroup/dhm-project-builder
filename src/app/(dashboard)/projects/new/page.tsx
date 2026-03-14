import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getClients } from "@/lib/queries/clients";
import { getTemplates } from "@/lib/queries/templates";
import { ProjectFormWrapper } from "./form-wrapper";

async function ProjectFormData() {
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

  return <ProjectFormWrapper clients={clientOptions} templates={templateOptions} />;
}

function FormLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-12 rounded-lg" />
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Form title is rendered inside ProjectForm component */}
      <Suspense fallback={<FormLoading />}>
        <ProjectFormData />
      </Suspense>
    </div>
  );
}
