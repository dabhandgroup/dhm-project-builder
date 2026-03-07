import type { Database } from "./database";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
export type ProjectImage = Database["public"]["Tables"]["project_images"]["Row"];

export interface ProjectWithClient extends Project {
  clients: {
    id: string;
    name: string;
    company: string | null;
  } | null;
}

export interface ProjectWithImages extends Project {
  project_images: ProjectImage[];
}

export interface ProjectFormData {
  title: string;
  domain_name: string;
  is_rebuild: boolean;
  client_name: string;
  favicon: File | null;
  logo: File | null;
  alt_logo: File | null;
  pages_required: string;
  brief: string;
  brief_summary: string;
  square_images: File[];
  landscape_images: File[];
  contact_info: {
    phone: string;
    email: string;
    address: string;
  };
  google_maps_embed: string;
  additional_notes: string;
  sitemap_url: string;
  target_locations: string[];
  ai_model: string;
  one_off_revenue: number;
  recurring_revenue: number;
}

export const defaultProjectFormData: ProjectFormData = {
  title: "",
  domain_name: "",
  is_rebuild: false,
  client_name: "",
  favicon: null,
  logo: null,
  alt_logo: null,
  pages_required: "",
  brief: "",
  brief_summary: "",
  square_images: [],
  landscape_images: [],
  contact_info: {
    phone: "",
    email: "",
    address: "",
  },
  google_maps_embed: "",
  additional_notes: "",
  sitemap_url: "",
  target_locations: [],
  ai_model: "orchids",
  one_off_revenue: 0,
  recurring_revenue: 199,
};
