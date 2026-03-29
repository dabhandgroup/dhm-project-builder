export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "member";
export type ProjectStatus = "lead" | "initial_draft" | "awaiting_feedback" | "revisions" | "awaiting_payment" | "complete";
export type ImageType = "square" | "landscape";
export type AuditStatus = "pending" | "running_before" | "running_after" | "complete" | "failed";
export type PipelineStatus = "pending" | "scraping" | "generating" | "pushing" | "deploying" | "complete" | "failed";
export type CostType = "one_off" | "monthly";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          role: UserRole;
          must_change_password: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          must_change_password?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          must_change_password?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          address: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          address?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          address?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          title: string;
          domain_name: string | null;
          is_rebuild: boolean;
          status: ProjectStatus;
          client_id: string | null;
          favicon_url: string | null;
          logo_url: string | null;
          alt_logo_url: string | null;
          pages_required: string | null;
          brief: string | null;
          brief_summary: string | null;
          contact_info: Json | null;
          google_maps_embed: string | null;
          additional_notes: string | null;
          sitemap_url: string | null;
          target_locations: string[] | null;
          ai_model: string | null;
          one_off_revenue: number;
          recurring_revenue: number;
          preview_url: string | null;
          deploy_subdomain: string | null;
          vercel_project_id: string | null;
          kanban_order: number;
          currency: string;
          deploy_provider: string | null;
          netlify_project_id: string | null;
          github_repo_url: string | null;
          template_id: string | null;
          include_in_financials: boolean;
          pipeline_status: string | null;
          pipeline_error: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          domain_name?: string | null;
          is_rebuild?: boolean;
          status?: ProjectStatus;
          client_id?: string | null;
          favicon_url?: string | null;
          logo_url?: string | null;
          alt_logo_url?: string | null;
          pages_required?: string | null;
          brief?: string | null;
          brief_summary?: string | null;
          contact_info?: Json | null;
          google_maps_embed?: string | null;
          additional_notes?: string | null;
          sitemap_url?: string | null;
          target_locations?: string[] | null;
          ai_model?: string | null;
          one_off_revenue?: number;
          recurring_revenue?: number;
          preview_url?: string | null;
          deploy_subdomain?: string | null;
          vercel_project_id?: string | null;
          kanban_order?: number;
          currency?: string;
          deploy_provider?: string | null;
          netlify_project_id?: string | null;
          github_repo_url?: string | null;
          template_id?: string | null;
          include_in_financials?: boolean;
          pipeline_status?: string | null;
          pipeline_error?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          domain_name?: string | null;
          is_rebuild?: boolean;
          status?: ProjectStatus;
          client_id?: string | null;
          favicon_url?: string | null;
          logo_url?: string | null;
          alt_logo_url?: string | null;
          pages_required?: string | null;
          brief?: string | null;
          brief_summary?: string | null;
          contact_info?: Json | null;
          google_maps_embed?: string | null;
          additional_notes?: string | null;
          sitemap_url?: string | null;
          target_locations?: string[] | null;
          ai_model?: string | null;
          one_off_revenue?: number;
          recurring_revenue?: number;
          preview_url?: string | null;
          deploy_subdomain?: string | null;
          vercel_project_id?: string | null;
          kanban_order?: number;
          currency?: string;
          deploy_provider?: string | null;
          netlify_project_id?: string | null;
          github_repo_url?: string | null;
          template_id?: string | null;
          include_in_financials?: boolean;
          pipeline_status?: string | null;
          pipeline_error?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
        ];
      };
      project_images: {
        Row: {
          id: string;
          project_id: string;
          image_url: string;
          image_type: ImageType;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          image_url: string;
          image_type: ImageType;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          image_url?: string;
          image_type?: ImageType;
          alt_text?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      voice_memos: {
        Row: {
          id: string;
          project_id: string | null;
          source_field: string | null;
          audio_url: string | null;
          transcription: string;
          summary: string | null;
          duration_seconds: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          source_field?: string | null;
          audio_url?: string | null;
          transcription: string;
          summary?: string | null;
          duration_seconds?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          transcription?: string;
          summary?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "voice_memos_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      audits: {
        Row: {
          id: string;
          current_url: string;
          new_url: string;
          gtmetrix_before: Json | null;
          gtmetrix_after: Json | null;
          pagespeed_before: Json | null;
          pagespeed_after: Json | null;
          status: AuditStatus;
          report_pdf_url: string | null;
          created_by: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          current_url: string;
          new_url: string;
          gtmetrix_before?: Json | null;
          gtmetrix_after?: Json | null;
          pagespeed_before?: Json | null;
          pagespeed_after?: Json | null;
          status?: AuditStatus;
          report_pdf_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          gtmetrix_before?: Json | null;
          gtmetrix_after?: Json | null;
          pagespeed_before?: Json | null;
          pagespeed_after?: Json | null;
          status?: AuditStatus;
          report_pdf_url?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      content_plans: {
        Row: {
          id: string;
          project_id: string | null;
          plan_data: Json;
          google_sheet_url: string | null;
          google_doc_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          plan_data?: Json;
          google_sheet_url?: string | null;
          google_doc_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_data?: Json;
          google_sheet_url?: string | null;
          google_doc_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_plans_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          thumbnail_url: string | null;
          storage_path: string;
          category: string | null;
          framework: string;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          thumbnail_url?: string | null;
          storage_path: string;
          category?: string | null;
          framework?: string;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          storage_path?: string;
          category?: string | null;
          framework?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      costs: {
        Row: {
          id: string;
          description: string;
          amount: number;
          currency: string;
          type: string;
          date: string;
          project_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          description: string;
          amount: number;
          currency?: string;
          type?: string;
          date?: string;
          project_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          description?: string;
          amount?: number;
          currency?: string;
          type?: string;
          date?: string;
          project_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "costs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      financial_targets: {
        Row: {
          id: string;
          currency: string;
          monthly_mrr_target: number;
          monthly_one_off_target: number;
          label: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          currency: string;
          monthly_mrr_target?: number;
          monthly_one_off_target?: number;
          label?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          currency?: string;
          monthly_mrr_target?: number;
          monthly_one_off_target?: number;
          label?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      redirect_plans: {
        Row: {
          id: string;
          name: string;
          original_url: string;
          new_url: string;
          comments: string | null;
          original_pages: Json;
          new_pages: Json;
          original_urls: string[];
          new_urls: string[];
          redirects: Json;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          original_url: string;
          new_url: string;
          comments?: string | null;
          original_pages?: Json;
          new_pages?: Json;
          original_urls?: string[];
          new_urls?: string[];
          redirects?: Json;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          original_url?: string;
          new_url?: string;
          comments?: string | null;
          original_pages?: Json;
          new_pages?: Json;
          original_urls?: string[];
          new_urls?: string[];
          redirects?: Json;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      project_status: ProjectStatus;
      image_type: ImageType;
      audit_status: AuditStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
