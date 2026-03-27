import { notFound } from "next/navigation";
import { getAuditById } from "@/lib/queries/audits";
import { AuditDetailClient } from "./audit-detail-client";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let audit;
  try {
    audit = await getAuditById(id);
  } catch {
    notFound();
  }

  if (!audit) notFound();

  return <AuditDetailClient audit={audit} id={id} />;
}
