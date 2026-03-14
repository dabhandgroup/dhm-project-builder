import { getProjects } from "@/lib/queries/projects";
import { NotesClient } from "./notes-client";

export default async function NotesPage() {
  const projects = await getProjects();

  const projectOptions = projects.map((p) => ({
    id: p.id,
    title: p.title,
  }));

  return <NotesClient projects={projectOptions} />;
}
