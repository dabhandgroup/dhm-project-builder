import type { Database } from "./database";
import type { CrawlData } from "@/components/projects/site-crawler";
import type { FaviconVariant } from "@/lib/favicon-converter";

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

export type CurrencyCode = "AUD" | "GBP" | "USD" | "CAD";

export interface ProjectFormData {
  title: string;
  domain_name: string;
  is_rebuild: boolean;
  is_manual: boolean;
  client_id: string;
  client_name: string;
  favicon: File | null;
  og_image: File | null;
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
  currency: CurrencyCode;
  one_off_revenue: number;
  recurring_revenue: number;
  include_in_financials: boolean;
  template_id: string | null;
  deploy_provider: string | null;
  crawl_data: CrawlData | null;
  favicon_variants: FaviconVariant[];
  preview_url: string;
  github_repo_url: string;
}

export const defaultProjectFormData: ProjectFormData = {
  title: "",
  domain_name: "",
  is_rebuild: false,
  is_manual: false,
  client_id: "",
  client_name: "",
  favicon: null,
  og_image: null,
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
  currency: "AUD",
  one_off_revenue: 0,
  recurring_revenue: 199,
  include_in_financials: false,
  template_id: null,
  deploy_provider: null,
  crawl_data: null,
  favicon_variants: [],
  preview_url: "",
  github_repo_url: "",
};
