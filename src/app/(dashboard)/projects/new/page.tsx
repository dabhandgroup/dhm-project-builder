import { PageHeader } from "@/components/shared/page-header";
import { ProjectFormWrapper } from "./form-wrapper";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New Project"
        description="Create a new website project"
      />
      <ProjectFormWrapper />
    </div>
  );
}
