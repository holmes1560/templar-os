import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "revisions:read");
  if (authError) return authError;

  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));

  const where: any = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  const revisions = await db.revision.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: { select: { id: true, email: true, name: true } },
      apiKey: { select: { id: true, name: true, keyPrefix: true } },
    },
  });

  return Response.json({ ok: true, data: revisions });
}
