import { getFinancialTargets } from "@/lib/queries/financials";
import { TargetsClient } from "./targets-client";

export default async function TargetsEditPage() {
  const targets = await getFinancialTargets();

  const formattedTargets = targets.map((t) => ({
    id: t.id,
    currency: t.currency,
    label: t.label ?? t.currency,
    monthlyMrrTarget: Number(t.monthly_mrr_target),
    monthlyOneOffTarget: Number(t.monthly_one_off_target),
    deadline: "",
  }));

  return <TargetsClient initialTargets={formattedTargets} />;
}
