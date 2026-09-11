"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/server/auth";
import {
  listAvailableModels,
  testAiModelConnection,
  saveAiFullConfig,
  type AiProvider,
  type AiModelInfo,
} from "@/server/analyzer";

export interface FetchModelsResult {
  ok: boolean;
  models: AiModelInfo[];
  live: boolean;
  error?: string;
}

export async function fetchModelsAction(
  provider: AiProvider,
  tempKey?: string,
  customBaseUrl?: string
): Promise<FetchModelsResult> {
  await requireAdmin();
  try {
    const res = await listAvailableModels(provider, tempKey, customBaseUrl);
    return {
      ok: true,
      models: res.models,
      live: res.live,
      error: res.error,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch models.";
    return {
      ok: false,
      models: [],
      live: false,
      error: msg,
    };
  }
}

export interface TestConnectionResult {
  ok: boolean;
  latencyMs?: number;
  message?: string;
  error?: string;
}

export async function testConnectionAction(
  provider: AiProvider,
  model: string,
  tempKey?: string,
  customBaseUrl?: string
): Promise<TestConnectionResult> {
  await requireAdmin();
  try {
    return await testAiModelConnection(provider, model, tempKey, customBaseUrl);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Connection test failed unexpectedly.";
    return { ok: false, error: msg };
  }
}

export interface SaveAiConfigPayload {
  primaryProvider: AiProvider;
  primaryModel: string;
  secondaryProvider: AiProvider | "none";
  secondaryModel: string;
  customProviderName?: string;
  customBaseUrl?: string;
  keysToUpdate?: Partial<Record<AiProvider, string>>;
}

export async function saveAiConfigAction(
  payload: SaveAiConfigPayload
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAdmin();

  if (!payload.primaryModel || payload.primaryModel.trim().length === 0) {
    return { ok: false, error: "Primary model cannot be empty." };
  }

  if (payload.secondaryProvider !== "none" && (!payload.secondaryModel || payload.secondaryModel.trim().length === 0)) {
    return { ok: false, error: "Fallback model cannot be empty when a fallback provider is selected." };
  }

  try {
    await saveAiFullConfig(payload);
    await audit(user.id, "ai.config_updated", "Setting", payload.primaryProvider, {
      primaryProvider: payload.primaryProvider,
      primaryModel: payload.primaryModel,
      secondaryProvider: payload.secondaryProvider,
      secondaryModel: payload.secondaryModel,
      updatedKeys: Object.keys(payload.keysToUpdate || {}),
    });

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save AI configuration.";
    return { ok: false, error: msg };
  }
}

export async function saveModelSelectionAction(
  target: "primary" | "secondary",
  provider: AiProvider | "none",
  model: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAdmin();
  try {
    if (target === "primary" && provider !== "none") {
      await db.setting.upsert({
        where: { key: "ai_primary_provider" },
        update: { value: provider },
        create: { key: "ai_primary_provider", value: provider },
      });
      await db.setting.upsert({
        where: { key: "ai_provider" },
        update: { value: provider },
        create: { key: "ai_provider", value: provider },
      });
      await db.setting.upsert({
        where: { key: "ai_primary_model" },
        update: { value: model.trim() },
        create: { key: "ai_primary_model", value: model.trim() },
      });
    } else if (target === "secondary") {
      await db.setting.upsert({
        where: { key: "ai_secondary_provider" },
        update: { value: provider },
        create: { key: "ai_secondary_provider", value: provider },
      });
      if (provider !== "none") {
        await db.setting.upsert({
          where: { key: "ai_secondary_model" },
          update: { value: model.trim() },
          create: { key: "ai_secondary_model", value: model.trim() },
        });
      }
    }

    await audit(user.id, `ai.${target}_selection_updated`, "Setting", provider, {
      target,
      provider,
      model,
    });

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to persist model choice.";
    return { ok: false, error: msg };
  }
}

export interface DesktopHeroSettingsPayload {
  greeting: string;
  systemName: string;
  name: string;
  subtitle: string;
  prompt: string;
  missionCount: string;
  missionLabel: string;
  workspacesCount?: string;
  appsCount?: string;
  projectsCount?: string;
  enabled: boolean;
  showOnAllWorkspaces: boolean;
}

export async function saveDesktopHeroSettingsAction(
  payload: DesktopHeroSettingsPayload
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAdmin();

  const entries: [string, string][] = [
    ["hero.greeting", payload.greeting.trim()],
    ["hero.systemName", payload.systemName.trim()],
    ["hero.name", payload.name.trim()],
    ["hero.subtitle", payload.subtitle.trim()],
    ["hero.prompt", payload.prompt.trim()],
    ["hero.missionCount", payload.missionCount.trim() || "1"],
    ["hero.missionLabel", payload.missionLabel.trim() || "Mission"],
    ["hero.workspacesCount", (payload.workspacesCount || "").trim()],
    ["hero.appsCount", (payload.appsCount || "").trim()],
    ["hero.projectsCount", (payload.projectsCount || "").trim()],
    ["hero.enabled", payload.enabled ? "true" : "false"],
    ["hero.showOnAllWorkspaces", payload.showOnAllWorkspaces ? "true" : "false"],
  ];

  try {
    for (const [key, value] of entries) {
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    await audit(user.id, "settings.desktop_hero_updated", "Setting", "desktop_hero", {
      greeting: payload.greeting,
      systemName: payload.systemName,
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save desktop hero settings.";
    return { ok: false, error: msg };
  }
}
