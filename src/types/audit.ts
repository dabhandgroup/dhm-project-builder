import type { Database } from "./database";

export type Audit = Database["public"]["Tables"]["audits"]["Row"];
export type AuditInsert = Database["public"]["Tables"]["audits"]["Insert"];

export interface PageSpeedResult {
  performanceScore: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  speedIndex: number;
  interactive: number;
}

export interface GTmetrixResult {
  grade: string;
  performanceScore: number;
  structureScore: number;
  lcp: number;
  tbt: number;
  cls: number;
  pageLoadTime: number;
  totalPageSize: number;
  totalRequests: number;
}
