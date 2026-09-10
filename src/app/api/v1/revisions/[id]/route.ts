import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "revisions:read");
  if (authError) return authError;

  const { id } = await params;
  const revision = await db.revision.findUnique({
    where: { id },
    include: {
      actor: { select: { id: true, email: true, name: true } },
      apiKey: { select: { id: true, name: true, keyPrefix: true } },
    },
  });

  if (!revision) {
    return Response.json({ ok: false, error: "Revision not found" }, { status: 404 });
  }

  return Response.json({ ok: true, data: revision });
}
