import type { Database } from "./database";

export type Cost = Database["public"]["Tables"]["costs"]["Row"];
export type CostInsert = Database["public"]["Tables"]["costs"]["Insert"];
export type CostUpdate = Database["public"]["Tables"]["costs"]["Update"];

export type FinancialTarget = Database["public"]["Tables"]["financial_targets"]["Row"];
export type FinancialTargetInsert = Database["public"]["Tables"]["financial_targets"]["Insert"];
export type FinancialTargetUpdate = Database["public"]["Tables"]["financial_targets"]["Update"];
