interface ProjectData {
  title: string;
  domain_name: string | null;
  is_rebuild: boolean;
  pages_required: string | null;
  brief: string | null;
  brief_summary: string | null;
  contact_info: {
    phone?: string;
    email?: string;
    address?: string;
  } | null;
  target_locations: string[] | null;
  additional_notes: string | null;
  sitemap_url: string | null;
}

export function assembleOrchidsPrompt(project: ProjectData): string {
  const sections: string[] = [];

  sections.push(`# Website Project: ${project.title}`);
  sections.push("");

  if (project.domain_name) {
    sections.push(`**Domain:** ${project.domain_name}`);
  }

  sections.push(
    `**Type:** ${project.is_rebuild ? "Rebuild of existing website" : "Brand new website"}`
  );
  sections.push("");

  if (project.brief_summary) {
    sections.push("## Project Brief (Summary)");
    sections.push(project.brief_summary);
    sections.push("");
  }

  if (project.brief) {
    sections.push("## Full Brief");
    sections.push(project.brief);
    sections.push("");
  }

  if (project.pages_required) {
    sections.push("## Pages Required");
    sections.push(project.pages_required);
    sections.push("");
  }

  if (project.contact_info) {
    const { phone, email, address } = project.contact_info;
    if (phone || email || address) {
      sections.push("## Contact Information");
      if (phone) sections.push(`- Phone: ${phone}`);
      if (email) sections.push(`- Email: ${email}`);
      if (address) sections.push(`- Address: ${address}`);
      sections.push("");
    }
  }

  if (project.target_locations && project.target_locations.length > 0) {
    sections.push("## Target Locations (for SEO)");
    sections.push(project.target_locations.join(", "));
    sections.push("");
  }

  if (project.is_rebuild && project.sitemap_url) {
    sections.push("## Existing Sitemap");
    sections.push(
      `Rebuild all pages from: ${project.sitemap_url}`
    );
    sections.push(
      "Maintain all existing content and SEO value while improving design and performance."
    );
    sections.push("");
  }

  if (project.additional_notes) {
    sections.push("## Additional Notes");
    sections.push(project.additional_notes);
    sections.push("");
  }

  sections.push("## Requirements");
  sections.push("- Professional, modern design suitable for a service business");
  sections.push("- Mobile-responsive layout");
  sections.push("- Fast loading (target A rating on PageSpeed)");
  sections.push("- Use CSS animations instead of heavy JavaScript libraries");
  sections.push("- SEO optimized with proper meta tags, headings, and schema markup");
  sections.push("- Clear call-to-action buttons on every page");
  sections.push("- Clean, lightweight code with no unnecessary dependencies");

  return sections.join("\n");
}
