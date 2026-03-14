import { getTemplates } from "@/lib/queries/templates";
import { TemplatesClient } from "./templates-client";

export default async function TemplatesPage() {
  const templates = await getTemplates(false);

  return <TemplatesClient initialTemplates={templates} />;
}
