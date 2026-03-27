import { redirect } from "next/navigation";

export default async function AuditDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/tools/performance-audit/${id}`);
}
