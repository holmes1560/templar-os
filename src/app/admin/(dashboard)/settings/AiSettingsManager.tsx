"use client";

import { useState, useTransition } from "react";
import {
  PROVIDERS_CATALOG,
  type AiModelInfo,
  type AiProvider,
} from "@/lib/ai-providers";
import type { AiFullConfig } from "@/server/analyzer";
import {
  fetchModelsAction,
  testConnectionAction,
  saveAiConfigAction,
  type TestConnectionResult,
} from "./actions";

interface Props {
  initialConfig: AiFullConfig;
  initialGeminiModels: AiModelInfo[];
  initialAnthropicModels: AiModelInfo[];
}

const PROVIDER_KEYS = Object.keys(PROVIDERS_CATALOG) as AiProvider[];

export function AiSettingsManager({
  initialConfig,
  initialGeminiModels,
  initialAnthropicModels,
}: Props) {
  const [primaryProvider, setPrimaryProvider] = useState<AiProvider>(
    initialConfig.primary.provider
  );
  const [primaryModel, setPrimaryModel] = useState(initialConfig.primary.model);
  const [isPrimaryCustom, setIsPrimaryCustom] = useState(false);

  const [secondaryProvider, setSecondaryProvider] = useState<AiProvider | "none">(
    initialConfig.secondary.provider
  );
  const [secondaryModel, setSecondaryModel] = useState(initialConfig.secondary.model);
  const [isSecondaryCustom, setIsSecondaryCustom] = useState(false);

  // Custom provider parameters
  const [customProviderName, setCustomProviderName] = useState(
    initialConfig.customProvider.name
  );
  const [customBaseUrl, setCustomBaseUrl] = useState(
    initialConfig.customProvider.baseUrl
  );

  // API Keys inputs (per provider)
  const [keysInput, setKeysInput] = useState<Record<AiProvider, string>>({
    gemini: "",
    anthropic: "",
    openai: "",
    deepseek: "",
    xai: "",
    groq: "",
    mistral: "",
    openrouter: "",
    ollama: "",
    custom: "",
  });

  const [visibleKeys, setVisibleKeys] = useState<Record<AiProvider, boolean>>({
    gemini: false,
    anthropic: false,
    openai: false,
    deepseek: false,
    xai: false,
    groq: false,
    mistral: false,
    openrouter: false,
    ollama: false,
    custom: false,
  });

  // Cached models per provider
  const [modelsCache, setModelsCache] = useState<Record<AiProvider, AiModelInfo[]>>({
    gemini: initialGeminiModels,
    anthropic: initialAnthropicModels,
    openai: PROVIDERS_CATALOG.openai.curatedModels,
    deepseek: PROVIDERS_CATALOG.deepseek.curatedModels,
    xai: PROVIDERS_CATALOG.xai.curatedModels,
    groq: PROVIDERS_CATALOG.groq.curatedModels,
    mistral: PROVIDERS_CATALOG.mistral.curatedModels,
    openrouter: PROVIDERS_CATALOG.openrouter.curatedModels,
    ollama: PROVIDERS_CATALOG.ollama.curatedModels,
    custom: PROVIDERS_CATALOG.custom.curatedModels,
  });

  const [fetchingModels, setFetchingModels] = useState<Record<AiProvider, boolean>>({
    gemini: false,
    anthropic: false,
    openai: false,
    deepseek: false,
    xai: false,
    groq: false,
    mistral: false,
    openrouter: false,
    ollama: false,
    custom: false,
  });

  const [modelFetchNote, setModelFetchNote] = useState<string | null>(null);

  // Test connection states
  const [testingPrimary, setTestingPrimary] = useState(false);
  const [primaryTestResult, setPrimaryTestResult] = useState<TestConnectionResult | null>(null);

  const [testingSecondary, setTestingSecondary] = useState(false);
  const [secondaryTestResult, setSecondaryTestResult] = useState<TestConnectionResult | null>(null);

  // Vault active tab for clean UI
  const [activeVaultTab, setActiveVaultTab] = useState<AiProvider>(primaryProvider);

  // Save transition
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    tone: "ok" | "warn" | "crit";
    text: string;
  } | null>(null);

  // Dynamic model fetching
  async function refreshModels(provider: AiProvider) {
    setFetchingModels((prev) => ({ ...prev, [provider]: true }));
    setModelFetchNote(null);

    const tempKey = keysInput[provider]?.trim() || undefined;
    const tempUrl = provider === "custom" ? customBaseUrl.trim() : undefined;

    const res = await fetchModelsAction(provider, tempKey, tempUrl);
    setFetchingModels((prev) => ({ ...prev, [provider]: false }));

    if (res.ok && res.models.length > 0) {
      setModelsCache((prev) => ({ ...prev, [provider]: res.models }));
      setModelFetchNote(
        res.live
          ? `Discovered ${res.models.length} models live from ${PROVIDERS_CATALOG[provider].name}.`
          : res.error || `Using curated models for ${PROVIDERS_CATALOG[provider].name}.`
      );
    } else if (res.error) {
      setModelFetchNote(`Model discovery error for ${PROVIDERS_CATALOG[provider].name}: ${res.error}`);
    }
  }

  // Connection tester
  async function handleTestPrimary() {
    setTestingPrimary(true);
    setPrimaryTestResult(null);

    const tempKey = keysInput[primaryProvider]?.trim() || undefined;
    const tempUrl = primaryProvider === "custom" ? customBaseUrl.trim() : undefined;

    const res = await testConnectionAction(primaryProvider, primaryModel, tempKey, tempUrl);
    setTestingPrimary(false);
    setPrimaryTestResult(res);
  }

  async function handleTestSecondary() {
    if (secondaryProvider === "none") return;
    setTestingSecondary(true);
    setSecondaryTestResult(null);

    const tempKey = keysInput[secondaryProvider]?.trim() || undefined;
    const tempUrl = secondaryProvider === "custom" ? customBaseUrl.trim() : undefined;

    const res = await testConnectionAction(secondaryProvider, secondaryModel, tempKey, tempUrl);
    setTestingSecondary(false);
    setSecondaryTestResult(res);
  }

  // Submit full configuration
  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    // Collect updated keys
    const keysToUpdate: Partial<Record<AiProvider, string>> = {};
    for (const p of PROVIDER_KEYS) {
      if (keysInput[p]?.trim()) {
        keysToUpdate[p] = keysInput[p].trim();
      }
    }

    startTransition(async () => {
      const res = await saveAiConfigAction({
        primaryProvider,
        primaryModel,
        secondaryProvider,
        secondaryModel,
        customProviderName: customProviderName.trim(),
        customBaseUrl: customBaseUrl.trim(),
        keysToUpdate,
      });

      if (res.ok) {
        setStatusMessage({ tone: "ok", text: "AI analyzer settings saved successfully." });
        // Clear entered key values from client state for security
        setKeysInput({
          gemini: "",
          anthropic: "",
          openai: "",
          deepseek: "",
          xai: "",
          groq: "",
          mistral: "",
          openrouter: "",
          ollama: "",
          custom: "",
        });
      } else {
        setStatusMessage({ tone: "crit", text: res.error || "Failed to save AI settings." });
      }
    });
  }

  const activePrimaryModels = modelsCache[primaryProvider] || [];
  const activeSecondaryModels =
    secondaryProvider !== "none" ? modelsCache[secondaryProvider] || [] : [];

  return (
    <div className="space-y-6">
      {statusMessage && (
        <p
          role="status"
          className={`rounded-[var(--os-r-chip)] border px-3 py-2 text-sm ${
            statusMessage.tone === "ok"
              ? "border-[var(--os-ok)]/30 bg-[var(--os-ok)]/[0.08] text-[var(--os-ok)]"
              : statusMessage.tone === "warn"
              ? "border-[var(--os-warn)]/30 bg-[var(--os-warn)]/[0.08] text-[var(--os-warn)]"
              : "border-[var(--os-crit)]/30 bg-[var(--os-crit)]/[0.08] text-[var(--os-crit)]"
          }`}
        >
          {statusMessage.text}
        </p>
      )}

      {modelFetchNote && (
        <div className="flex items-center justify-between rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg-muted)]">
          <span>{modelFetchNote}</span>
          <button
            type="button"
            onClick={() => setModelFetchNote(null)}
            className="text-[var(--os-fg-faint)] hover:text-[var(--os-fg)]"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tier 1: Primary Model Selector */}
        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--os-accent)] font-mono text-[0.68rem] font-bold text-[var(--os-accent-fg)]">
                  1
                </span>
                <h3 className="text-sm font-semibold text-[var(--os-fg)]">Primary AI Engine</h3>
              </div>
              <p className="mt-0.5 text-xs text-[var(--os-fg-muted)]">
                The primary model invoked for repository analysis and metadata extraction.
              </p>
            </div>
            <span className="rounded-[var(--os-r-chip)] border border-[var(--os-accent)]/40 bg-[var(--os-accent)]/10 px-2.5 py-0.5 font-mono text-[0.68rem] font-medium text-[var(--os-accent)]">
              ACTIVE
            </span>
          </div>

          <div className="space-y-4">
            {/* Provider Selector Dropdown / Grid */}
            <div>
              <label className="label mb-1.5 block">Provider</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {PROVIDER_KEYS.map((p) => {
                  const def = PROVIDERS_CATALOG[p];
                  const hasKey = initialConfig.keys[p]?.configured;
                  const isSelected = primaryProvider === p;

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPrimaryProvider(p);
                        if (!isPrimaryCustom) {
                          setPrimaryModel(modelsCache[p]?.[0]?.id || def.defaultModel);
                        }
                        setPrimaryTestResult(null);
                        setActiveVaultTab(p);
                      }}
                      className={`flex flex-col justify-between rounded-[var(--os-r-chip)] border p-2.5 text-left transition-all ${
                        isSelected
                          ? "border-[var(--os-accent)] bg-[var(--os-accent)]/[0.08]"
                          : "border-[var(--os-line)] bg-[var(--os-surface-2)] opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-[var(--os-fg)]">
                          {def.name}
                        </span>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            hasKey ? "bg-[var(--os-ok)]" : "bg-[var(--os-warn)]"
                          }`}
                        />
                      </div>
                      <span className="mt-1 line-clamp-1 text-[0.65rem] text-[var(--os-fg-faint)]">
                        {def.tagline}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If Custom Provider Selected, reveal URL & Name Inputs */}
            {primaryProvider === "custom" && (
              <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3.5 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label mb-1 block">Custom Provider Name</label>
                    <input
                      type="text"
                      value={customProviderName}
                      onChange={(e) => setCustomProviderName(e.target.value)}
                      placeholder="e.g. Together AI, Perplexity, Private Gateway"
                      className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-3)] px-3 py-1.5 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="label mb-1 block">OpenAI-Compatible Base URL</label>
                    <input
                      type="text"
                      value={customBaseUrl}
                      onChange={(e) => setCustomBaseUrl(e.target.value)}
                      placeholder="e.g. https://api.together.xyz/v1"
                      className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-3)] px-3 py-1.5 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Model Selector & Live Fetcher */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label">
                  Model for {PROVIDERS_CATALOG[primaryProvider]?.name}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => refreshModels(primaryProvider)}
                    disabled={fetchingModels[primaryProvider]}
                    className="flex items-center gap-1 font-mono text-[0.68rem] text-[var(--os-fg-muted)] hover:text-[var(--os-accent)] disabled:opacity-50"
                  >
                    <span className={fetchingModels[primaryProvider] ? "animate-spin" : ""}>↻</span>
                    {fetchingModels[primaryProvider] ? "Fetching models..." : "Refresh models from API"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrimaryCustom(!isPrimaryCustom)}
                    className="font-mono text-[0.68rem] text-[var(--os-fg-faint)] underline hover:text-[var(--os-fg)]"
                  >
                    {isPrimaryCustom ? "Choose from list" : "Enter custom model ID"}
                  </button>
                </div>
              </div>

              {isPrimaryCustom ? (
                <input
                  type="text"
                  value={primaryModel}
                  onChange={(e) => setPrimaryModel(e.target.value)}
                  placeholder="Type any model ID, e.g. gpt-4o, deepseek-chat, gemini-3.8-flash"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-2 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
                  required
                />
              ) : (
                <div className="relative">
                  <select
                    value={primaryModel}
                    onChange={(e) => setPrimaryModel(e.target.value)}
                    className="w-full appearance-none rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-2 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
                  >
                    {activePrimaryModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) {m.isRecommended ? "★ Recommended" : ""}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-[var(--os-fg-faint)]">
                    ▼
                  </span>
                </div>
              )}

              {/* Model Description snippet */}
              {(() => {
                const found = activePrimaryModels.find((m) => m.id === primaryModel);
                if (found?.description) {
                  return (
                    <p className="mt-1.5 text-[0.7rem] text-[var(--os-fg-muted)]">
                      {found.description}
                      {found.contextWindow && (
                        <span className="ml-2 font-mono text-[var(--os-fg-faint)]">
                          Context: {found.contextWindow.toLocaleString()} tokens
                        </span>
                      )}
                    </p>
                  );
                }
                return null;
              })()}
            </div>

            {/* Test Connection Button & Result */}
            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--os-line)]/40 pt-3">
              <button
                type="button"
                onClick={handleTestPrimary}
                disabled={testingPrimary}
                className="pressable rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 font-mono text-xs text-[var(--os-fg)] hover:bg-[var(--os-surface-3)] disabled:opacity-50"
              >
                {testingPrimary ? "Pinging model..." : "Test Primary Connection"}
              </button>

              {primaryTestResult && (
                <div
                  className={`rounded-[var(--os-r-chip)] border px-2.5 py-1 font-mono text-[0.7rem] ${
                    primaryTestResult.ok
                      ? "border-[var(--os-ok)]/40 bg-[var(--os-ok)]/10 text-[var(--os-ok)]"
                      : "border-[var(--os-crit)]/40 bg-[var(--os-crit)]/10 text-[var(--os-crit)]"
                  }`}
                >
                  {primaryTestResult.ok ? `✓ ${primaryTestResult.message}` : `✕ ${primaryTestResult.error}`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tier 2: Secondary / Fallback Model Selector */}
        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--os-surface-3)] font-mono text-[0.68rem] font-bold text-[var(--os-fg)]">
                  2
                </span>
                <h3 className="text-sm font-semibold text-[var(--os-fg)]">Fallback Engine (OpenRouter Style)</h3>
              </div>
              <p className="mt-0.5 text-xs text-[var(--os-fg-muted)]">
                Automatically triggered if the primary model hits a rate limit, quota exhaustion, or outage.
              </p>
            </div>
            <span
              className={`rounded-[var(--os-r-chip)] border px-2 py-0.5 font-mono text-[0.68rem] ${
                secondaryProvider === "none"
                  ? "border-[var(--os-line)] bg-[var(--os-surface-2)] text-[var(--os-fg-faint)]"
                  : "border-[var(--os-ok)]/40 bg-[var(--os-ok)]/10 text-[var(--os-ok)]"
              }`}
            >
              {secondaryProvider === "none" ? "DISABLED" : "FAILOVER READY"}
            </span>
          </div>

          <div className="space-y-4">
            {/* Fallback Provider Select */}
            <div>
              <label className="label mb-1.5 block">Fallback Provider</label>
              <select
                value={secondaryProvider}
                onChange={(e) => {
                  const val = e.target.value as AiProvider | "none";
                  setSecondaryProvider(val);
                  if (val !== "none" && !isSecondaryCustom) {
                    setSecondaryModel(modelsCache[val]?.[0]?.id || PROVIDERS_CATALOG[val].defaultModel);
                  }
                  setSecondaryTestResult(null);
                }}
                className="w-full appearance-none rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-2 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
              >
                <option value="none">Disabled (No failover)</option>
                {PROVIDER_KEYS.map((p) => (
                  <option key={p} value={p}>
                    {PROVIDERS_CATALOG[p].name} {initialConfig.keys[p]?.configured ? "(✓ Configured)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* If Secondary is enabled, render model selection */}
            {secondaryProvider !== "none" && (
              <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3.5 space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="label">
                      Fallback Model for {PROVIDERS_CATALOG[secondaryProvider]?.name}
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => refreshModels(secondaryProvider)}
                        disabled={fetchingModels[secondaryProvider]}
                        className="flex items-center gap-1 font-mono text-[0.68rem] text-[var(--os-fg-muted)] hover:text-[var(--os-accent)] disabled:opacity-50"
                      >
                        <span className={fetchingModels[secondaryProvider] ? "animate-spin" : ""}>↻</span>
                        {fetchingModels[secondaryProvider] ? "Fetching..." : "Refresh models"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSecondaryCustom(!isSecondaryCustom)}
                        className="font-mono text-[0.68rem] text-[var(--os-fg-faint)] underline hover:text-[var(--os-fg)]"
                      >
                        {isSecondaryCustom ? "Choose from list" : "Enter custom model ID"}
                      </button>
                    </div>
                  </div>

                  {isSecondaryCustom ? (
                    <input
                      type="text"
                      value={secondaryModel}
                      onChange={(e) => setSecondaryModel(e.target.value)}
                      placeholder="Type custom fallback model ID"
                      className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-3)] px-3 py-2 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
                      required
                    />
                  ) : (
                    <div className="relative">
                      <select
                        value={secondaryModel}
                        onChange={(e) => setSecondaryModel(e.target.value)}
                        className="w-full appearance-none rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-3)] px-3 py-2 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
                      >
                        {activeSecondaryModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.id}) {m.isRecommended ? "★ Recommended" : ""}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-[var(--os-fg-faint)]">
                        ▼
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-[var(--os-line)]/40 pt-2">
                  <button
                    type="button"
                    onClick={handleTestSecondary}
                    disabled={testingSecondary}
                    className="pressable rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-3)] px-3 py-1 font-mono text-xs text-[var(--os-fg)] hover:bg-[var(--os-surface-1)] disabled:opacity-50"
                  >
                    {testingSecondary ? "Pinging..." : "Test Fallback Connection"}
                  </button>

                  {secondaryTestResult && (
                    <div
                      className={`rounded-[var(--os-r-chip)] border px-2 py-0.5 font-mono text-[0.7rem] ${
                        secondaryTestResult.ok
                          ? "border-[var(--os-ok)]/40 bg-[var(--os-ok)]/10 text-[var(--os-ok)]"
                          : "border-[var(--os-crit)]/40 bg-[var(--os-crit)]/10 text-[var(--os-crit)]"
                      }`}
                    >
                      {secondaryTestResult.ok ? `✓ ${secondaryTestResult.message}` : `✕ ${secondaryTestResult.error}`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Key Vault */}
        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--os-fg)]">Encrypted Credentials Vault</h3>
            <p className="mt-0.5 text-xs text-[var(--os-fg-muted)]">
              Manage keys for all AI providers. Keys saved here are encrypted at rest using AES-256-GCM. Unset fields fall back to your{" "}
              <span className="font-mono">.env</span> file.
            </p>
          </div>

          {/* Provider Tabs for Vault */}
          <div className="mb-3 flex flex-wrap gap-1.5 border-b border-[var(--os-line)] pb-3">
            {PROVIDER_KEYS.map((p) => {
              const def = PROVIDERS_CATALOG[p];
              const keyStatus = initialConfig.keys[p];
              const isSelected = activeVaultTab === p;

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActiveVaultTab(p)}
                  className={`flex items-center gap-1.5 rounded-[var(--os-r-chip)] border px-2.5 py-1 font-mono text-[0.68rem] transition-all ${
                    isSelected
                      ? "border-[var(--os-accent)] bg-[var(--os-accent)]/10 text-[var(--os-accent)] font-semibold"
                      : "border-[var(--os-line)] bg-[var(--os-surface-2)] text-[var(--os-fg-muted)] hover:text-[var(--os-fg)]"
                  }`}
                >
                  <span>{def.name}</span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      keyStatus?.configured ? "bg-[var(--os-ok)]" : "bg-[var(--os-warn)]"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Active Provider Vault Card */}
          {(() => {
            const p = activeVaultTab;
            const def = PROVIDERS_CATALOG[p];
            const status = initialConfig.keys[p];
            const isVisible = visibleKeys[p];

            return (
              <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-semibold text-[var(--os-fg)]">
                      {def.name} API Key
                    </span>
                    {def.envKey && (
                      <span className="ml-2 font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
                        (or {def.envKey} in .env)
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-mono text-[0.68rem] ${
                      status?.configured ? "text-[var(--os-ok)]" : "text-[var(--os-warn)]"
                    }`}
                  >
                    {status?.configured
                      ? `✓ Configured (${status.source === "db" ? "Database" : ".env"})`
                      : "⚠ Key missing"}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={isVisible ? "text" : "password"}
                    value={keysInput[p]}
                    onChange={(e) =>
                      setKeysInput((prev) => ({ ...prev, [p]: e.target.value }))
                    }
                    placeholder={
                      status?.configured
                        ? `Key is set (${status.masked}) — enter new key to replace`
                        : `Paste ${def.name} API key...`
                    }
                    className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-3)] px-3 py-1.5 pr-14 font-mono text-xs text-[var(--os-fg)] placeholder:text-[var(--os-fg-faint)] focus:border-[var(--os-accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleKeys((prev) => ({ ...prev, [p]: !prev[p] }))
                    }
                    className="absolute right-2 top-1.5 font-mono text-[0.68rem] text-[var(--os-fg-muted)] hover:text-[var(--os-fg)]"
                  >
                    {isVisible ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-4">
          <div className="text-xs text-[var(--os-fg-muted)]">
            Active:{" "}
            <span className="font-mono font-medium text-[var(--os-fg)]">
              {PROVIDERS_CATALOG[primaryProvider]?.name || primaryProvider}
            </span>{" "}
            / <span className="font-mono font-medium text-[var(--os-fg)]">{primaryModel}</span>
            {secondaryProvider !== "none" && (
              <>
                {" "}
                (Fallback:{" "}
                <span className="font-mono text-[var(--os-fg)]">
                  {PROVIDERS_CATALOG[secondaryProvider]?.name || secondaryProvider}/
                  {secondaryModel}
                </span>
                )
              </>
            )}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-4 py-2 text-xs font-medium text-[var(--os-accent-fg)] disabled:opacity-50"
          >
            {isPending ? "Saving configuration..." : "Save AI Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
