import { requireAdmin } from "@/server/auth";
import { ApiDocsHub } from "./ApiDocsHub";

export const dynamic = "force-dynamic";

export default async function AdminApiDocsPage() {
  await requireAdmin();

  return <ApiDocsHub />;
}
