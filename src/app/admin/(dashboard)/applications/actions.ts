"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit, requireAdmin } from "@/server/auth";
import { ApplicationInput, formBool } from "@/server/validation";

export type FormState = { error?: string; ok?: string };

/**
 * Applications are how a project appears inside the OS (§5). Everything the
 * desktop needs — icon, grid cell, window size, launch behaviour — lives
 * here, so surfacing a project or changing how it opens never touches code.
 */

function parse(fd: FormData) {
  return ApplicationInput.safeParse({
    appKey: fd.get("appKey"),
    name: fd.get("name"),
    icon: fd.get("icon"),
    launchMode: fd.get("launchMode"),
    url: fd.get("url") ?? "",
    projectId: fd.get("projectId") ?? "",
    enabled: formBool(fd, "enabled"),
    desktopVisible: formBool(fd, "desktopVisible"),
    workspace: fd.get("workspace"),
    cell: fd.get("cell"),
    windowWidth: fd.get("windowWidth"),
    windowHeight: fd.get("windowHeight"),
    resizable: formBool(fd, "resizable"),
    maximizable: formBool(fd, "maximizable"),
    minimizable: formBool(fd, "minimizable"),
  });
}

export async function saveApplication(
  id: string | null,
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  const user = await requireAdmin();

  const parsed = parse(fd);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `${first.path.join(".") || "form"}: ${first.message}` };
  }
  const d = parsed.data;

  // An iframe or external launch with no URL would produce a window that can
  // only ever render blank. Catch it here rather than shipping a dead icon.
  if ((d.launchMode === "IFRAME" || d.launchMode === "EXTERNAL") && !d.url) {
    return { error: `${d.launchMode.toLowerCase()} launch mode needs a URL.` };
  }

  const data = {
    appKey: d.appKey,
    name: d.name,
    icon: d.icon,
    launchMode: d.launchMode,
    url: d.url ?? null,
    projectId: d.projectId || null,
    enabled: d.enabled,
    desktopVisible: d.desktopVisible,
    workspace: d.workspace,
    cell: d.cell,
    windowWidth: d.windowWidth,
    windowHeight: d.windowHeight,
    resizable: d.resizable,
    maximizable: d.maximizable,
    minimizable: d.minimizable,
  };

  let appId = id;
  try {
    if (id) {
      await db.application.update({ where: { id }, data });
    } else {
      const created = await db.application.create({ data });
      appId = created.id;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) {
      return { error: `The key "${d.appKey}" is already used by another application.` };
    }
    return { error: "Could not save. Check the fields and try again." };
  }

  await audit(user.id, id ? "application.update" : "application.create", "Application", appId!, {
    appKey: d.appKey, launchMode: d.launchMode,
  });

  revalidatePath("/");
  revalidatePath("/admin/applications");

  if (!id) redirect(`/admin/applications/${appId}`);
  return { ok: "Saved. The desktop already reflects it." };
}

export async function toggleApplication(id: string, field: "enabled" | "desktopVisible") {
  const user = await requireAdmin();

  const app = await db.application.findUnique({ where: { id } });
  if (!app) return;

  await db.application.update({ where: { id }, data: { [field]: !app[field] } });
  await audit(user.id, `application.${field}`, "Application", id, { value: !app[field] });

  revalidatePath("/");
  revalidatePath("/admin/applications");
}

/** §8 — desktop placement, changed without touching code */
export async function moveApplication(id: string, workspace: number, cell: number) {
  const user = await requireAdmin();

  await db.application.update({
    where: { id },
    data: {
      workspace: Math.max(0, Math.min(9, workspace)),
      cell: Math.max(0, Math.min(200, cell)),
    },
  });
  await audit(user.id, "application.move", "Application", id, { workspace, cell });

  revalidatePath("/");
  revalidatePath("/admin/applications");
}

export async function deleteApplication(id: string) {
  const user = await requireAdmin();

  const app = await db.application.findUnique({ where: { id }, select: { appKey: true } });
  await db.application.delete({ where: { id } });
  await audit(user.id, "application.delete", "Application", id, { appKey: app?.appKey });

  revalidatePath("/");
  revalidatePath("/admin/applications");
  redirect("/admin/applications");
}

/**
 * Creates the application that makes a project openable in the OS.
 * One click from the project side, rather than making the admin hand-build
 * an application row and remember the key convention.
 */
export async function surfaceProject(projectId: string) {
  const user = await requireAdmin();

  const p = await db.project.findUnique({ where: { id: projectId } });
  if (!p) return;

  const appKey = `live-${p.slug}`;
  const existing = await db.application.findUnique({ where: { appKey } });
  if (existing) redirect(`/admin/applications/${existing.id}`);

  // hosted decides whether it can run in a window at all
  const created = await db.application.create({
    data: {
      appKey,
      projectId: p.id,
      name: p.name,
      icon: "globe",
      launchMode: p.hosted && p.liveUrl ? "IFRAME" : "DEMO",
      url: p.hosted ? p.liveUrl : null,
      enabled: true,
      desktopVisible: true,
      workspace: 1,
      cell: await nextFreeCell(1),
      windowWidth: 1024,
      windowHeight: 680,
    },
  });

  await audit(user.id, "application.surface", "Application", created.id, { slug: p.slug });
  revalidatePath("/");
  redirect(`/admin/applications/${created.id}`);
}

async function nextFreeCell(workspace: number) {
  const taken = new Set(
    (await db.application.findMany({ where: { workspace }, select: { cell: true } })).map((a) => a.cell)
  );
  let c = 0;
  while (taken.has(c)) c++;
  return c;
}
