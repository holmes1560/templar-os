"use server";

import { revalidatePath } from "next/cache";
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
  tempKey?: string
): Promise<FetchModelsResult> {
  await requireAdmin();
  try {
    const res = await listAvailableModels(provider, tempKey);
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
  tempKey?: string
): Promise<TestConnectionResult> {
  await requireAdmin();
  try {
    return await testAiModelConnection(provider, model, tempKey);
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
  geminiApiKey?: string | null;
  anthropicApiKey?: string | null;
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
      updatedGeminiKey: Boolean(payload.geminiApiKey?.trim()),
      updatedAnthropicKey: Boolean(payload.anthropicApiKey?.trim()),
    });

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save AI configuration.";
    return { ok: false, error: msg };
  }
}
