import { getFinancialSummary } from "@/lib/queries/financials";
import { FinancialsClient } from "./financials-client";

export default async function FinancialsPage() {
  const summary = await getFinancialSummary();

  return <FinancialsClient initialData={summary} />;
}
