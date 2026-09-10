import { db } from "@/lib/db";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";
import { recordRevision } from "@/server/revisions";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  const authError = authorizeScope(auth, "projects:create");
  if (authError) return authError;

  const { id } = await params;
  const existing = await db.project.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { technologies: true },
  });

  if (!existing) {
    return Response.json({ ok: false, error: "Project not found" }, { status: 404 });
  }

  // Generate unique slug
  let newSlug = `${existing.slug}-copy`;
  let counter = 1;
  while (await db.project.findUnique({ where: { slug: newSlug } })) {
    newSlug = `${existing.slug}-copy-${counter++}`;
  }

  const { id: _, slug: __, createdAt: ___, updatedAt: ____, technologies, ...rest } = existing;

  const duplicated = await db.project.create({
    data: {
      ...rest,
      name: `${existing.name} (Copy)`,
      slug: newSlug,
      status: "DRAFT",
    },
  });

  for (const pt of technologies) {
    await db.projectTechnology.create({
      data: {
        projectId: duplicated.id,
        technologyId: pt.technologyId,
        order: pt.order,
      },
    });
  }

  await recordRevision({
    entityType: "project",
    entityId: duplicated.id,
    changeType: "CREATE",
    summary: `Duplicated from ${existing.name} (${existing.slug})`,
    newValue: duplicated,
    apiKeyId: auth.apiKey?.id,
    isAiGenerated: !auth.isSessionAdmin,
  });

  return Response.json({ ok: true, data: duplicated }, { status: 201 });
}
