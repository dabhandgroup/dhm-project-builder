import type { Database } from "./database";

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

export interface ClientWithStats extends Client {
  project_count: number;
  total_recurring_revenue: number;
  total_one_off_revenue: number;
}
