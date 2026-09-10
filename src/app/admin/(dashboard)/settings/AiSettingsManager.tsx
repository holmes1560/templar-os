"use client";

import { useState, useTransition } from "react";
import type { AiFullConfig, AiModelInfo, AiProvider } from "@/server/analyzer";
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

  // API Keys inputs
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  // Model lists state
  const [geminiModels, setGeminiModels] = useState<AiModelInfo[]>(initialGeminiModels);
  const [anthropicModels, setAnthropicModels] = useState<AiModelInfo[]>(initialAnthropicModels);
  const [fetchingGemini, setFetchingGemini] = useState(false);
  const [fetchingAnthropic, setFetchingAnthropic] = useState(false);
  const [modelFetchNote, setModelFetchNote] = useState<string | null>(null);

  // Test connection states
  const [testingPrimary, setTestingPrimary] = useState(false);
  const [primaryTestResult, setPrimaryTestResult] = useState<TestConnectionResult | null>(null);

  const [testingSecondary, setTestingSecondary] = useState(false);
  const [secondaryTestResult, setSecondaryTestResult] = useState<TestConnectionResult | null>(null);

  // Save transition
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    tone: "ok" | "warn" | "crit";
    text: string;
  } | null>(null);

  // Helpers to fetch models dynamically
  async function refreshModels(provider: AiProvider) {
    if (provider === "gemini") {
      setFetchingGemini(true);
      setModelFetchNote(null);
      const res = await fetchModelsAction("gemini", geminiApiKey.trim() || undefined);
      setFetchingGemini(false);
      if (res.ok && res.models.length > 0) {
        setGeminiModels(res.models);
        setModelFetchNote(
          res.live
            ? `Discovered ${res.models.length} Gemini models live from Google API.`
            : res.error || "Using curated Gemini models."
        );
      } else if (res.error) {
        setModelFetchNote(`Gemini model discovery error: ${res.error}`);
      }
    } else {
      setFetchingAnthropic(true);
      setModelFetchNote(null);
      const res = await fetchModelsAction("anthropic", anthropicApiKey.trim() || undefined);
      setFetchingAnthropic(false);
      if (res.ok && res.models.length > 0) {
        setAnthropicModels(res.models);
        setModelFetchNote(
          res.live
            ? `Discovered ${res.models.length} Claude models from Anthropic API.`
            : res.error || "Using curated Anthropic models."
        );
      } else if (res.error) {
        setModelFetchNote(`Anthropic model discovery error: ${res.error}`);
      }
    }
  }

  // Connection tester
  async function handleTestPrimary() {
    setTestingPrimary(true);
    setPrimaryTestResult(null);
    const tempKey =
      primaryProvider === "gemini"
        ? geminiApiKey.trim() || undefined
        : anthropicApiKey.trim() || undefined;

    const res = await testConnectionAction(primaryProvider, primaryModel, tempKey);
    setTestingPrimary(false);
    setPrimaryTestResult(res);
  }

  async function handleTestSecondary() {
    if (secondaryProvider === "none") return;
    setTestingSecondary(true);
    setSecondaryTestResult(null);
    const tempKey =
      secondaryProvider === "gemini"
        ? geminiApiKey.trim() || undefined
        : anthropicApiKey.trim() || undefined;

    const res = await testConnectionAction(secondaryProvider, secondaryModel, tempKey);
    setTestingSecondary(false);
    setSecondaryTestResult(res);
  }

  // Submit full configuration
  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      const res = await saveAiConfigAction({
        primaryProvider,
        primaryModel,
        secondaryProvider,
        secondaryModel,
        geminiApiKey: geminiApiKey.trim() || null,
        anthropicApiKey: anthropicApiKey.trim() || null,
      });

      if (res.ok) {
        setStatusMessage({ tone: "ok", text: "AI analyzer settings saved successfully." });
        setGeminiApiKey("");
        setAnthropicApiKey("");
      } else {
        setStatusMessage({ tone: "crit", text: res.error || "Failed to save AI settings." });
      }
    });
  }

  const activePrimaryModels = primaryProvider === "gemini" ? geminiModels : anthropicModels;
  const activeSecondaryModels = secondaryProvider === "gemini" ? geminiModels : anthropicModels;

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
            {/* Provider Switch Tabs */}
            <div>
              <label className="label mb-1.5 block">Provider</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrimaryProvider("gemini");
                    if (!isPrimaryCustom) setPrimaryModel(geminiModels[0]?.id || "gemini-3.8-flash");
                    setPrimaryTestResult(null);
                  }}
                  className={`flex items-center justify-between rounded-[var(--os-r-chip)] border p-3 text-left transition-all ${
                    primaryProvider === "gemini"
                      ? "border-[var(--os-accent)] bg-[var(--os-accent)]/[0.08]"
                      : "border-[var(--os-line)] bg-[var(--os-surface-2)] opacity-70 hover:opacity-100"
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-[var(--os-fg)]">Google Gemini</div>
                    <div className="mt-0.5 text-[0.68rem] text-[var(--os-fg-muted)]">
                      Fast structured JSON extraction
                    </div>
                  </div>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      initialConfig.geminiKeyStatus.configured ? "bg-[var(--os-ok)]" : "bg-[var(--os-warn)]"
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPrimaryProvider("anthropic");
                    if (!isPrimaryCustom) setPrimaryModel(anthropicModels[0]?.id || "claude-3-7-sonnet-latest");
                    setPrimaryTestResult(null);
                  }}
                  className={`flex items-center justify-between rounded-[var(--os-r-chip)] border p-3 text-left transition-all ${
                    primaryProvider === "anthropic"
                      ? "border-[var(--os-accent)] bg-[var(--os-accent)]/[0.08]"
                      : "border-[var(--os-line)] bg-[var(--os-surface-2)] opacity-70 hover:opacity-100"
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-[var(--os-fg)]">Anthropic Claude</div>
                    <div className="mt-0.5 text-[0.68rem] text-[var(--os-fg-muted)]">
                      Extended thinking & reasoning
                    </div>
                  </div>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      initialConfig.anthropicKeyStatus.configured ? "bg-[var(--os-ok)]" : "bg-[var(--os-warn)]"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Model Selector & Live Fetcher */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label">Model ID</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => refreshModels(primaryProvider)}
                    disabled={fetchingGemini || fetchingAnthropic}
                    className="flex items-center gap-1 font-mono text-[0.68rem] text-[var(--os-fg-muted)] hover:text-[var(--os-accent)] disabled:opacity-50"
                  >
                    <span className={fetchingGemini || fetchingAnthropic ? "animate-spin" : ""}>↻</span>
                    {fetchingGemini || fetchingAnthropic ? "Fetching models..." : "Refresh models from API"}
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
                  placeholder="e.g. gemini-3.8-flash or claude-3-7-sonnet-latest"
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
            {/* Fallback Provider Radio */}
            <div>
              <label className="label mb-1.5 block">Fallback Provider</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSecondaryProvider("none");
                    setSecondaryTestResult(null);
                  }}
                  className={`rounded-[var(--os-r-chip)] border p-2.5 text-center font-mono text-xs transition-all ${
                    secondaryProvider === "none"
                      ? "border-[var(--os-accent)] bg-[var(--os-accent)]/[0.08] text-[var(--os-fg)] font-semibold"
                      : "border-[var(--os-line)] bg-[var(--os-surface-2)] text-[var(--os-fg-muted)] hover:opacity-100"
                  }`}
                >
                  Disabled (No failover)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSecondaryProvider("anthropic");
                    if (!isSecondaryCustom) setSecondaryModel(anthropicModels[0]?.id || "claude-3-7-sonnet-latest");
                    setSecondaryTestResult(null);
                  }}
                  className={`rounded-[var(--os-r-chip)] border p-2.5 text-center font-mono text-xs transition-all ${
                    secondaryProvider === "anthropic"
                      ? "border-[var(--os-accent)] bg-[var(--os-accent)]/[0.08] text-[var(--os-fg)] font-semibold"
                      : "border-[var(--os-line)] bg-[var(--os-surface-2)] text-[var(--os-fg-muted)] hover:opacity-100"
                  }`}
                >
                  Anthropic Claude
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSecondaryProvider("gemini");
                    if (!isSecondaryCustom) setSecondaryModel(geminiModels[0]?.id || "gemini-3.8-flash");
                    setSecondaryTestResult(null);
                  }}
                  className={`rounded-[var(--os-r-chip)] border p-2.5 text-center font-mono text-xs transition-all ${
                    secondaryProvider === "gemini"
                      ? "border-[var(--os-accent)] bg-[var(--os-accent)]/[0.08] text-[var(--os-fg)] font-semibold"
                      : "border-[var(--os-line)] bg-[var(--os-surface-2)] text-[var(--os-fg-muted)] hover:opacity-100"
                  }`}
                >
                  Google Gemini
                </button>
              </div>
            </div>

            {/* If Secondary is enabled, render model selection */}
            {secondaryProvider !== "none" && (
              <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3.5 space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="label">Fallback Model ID</label>
                    <button
                      type="button"
                      onClick={() => setIsSecondaryCustom(!isSecondaryCustom)}
                      className="font-mono text-[0.68rem] text-[var(--os-fg-faint)] underline hover:text-[var(--os-fg)]"
                    >
                      {isSecondaryCustom ? "Choose from list" : "Enter custom model ID"}
                    </button>
                  </div>

                  {isSecondaryCustom ? (
                    <input
                      type="text"
                      value={secondaryModel}
                      onChange={(e) => setSecondaryModel(e.target.value)}
                      placeholder="e.g. claude-3-7-sonnet-latest"
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
              API keys entered here are encrypted at rest using AES-256-GCM. Unset fields fall back to your{" "}
              <span className="font-mono">.env</span> file.
            </p>
          </div>

          <div className="space-y-4">
            {/* Google Gemini Key */}
            <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--os-fg)]">Google Gemini API Key</label>
                <span
                  className={`font-mono text-[0.68rem] ${
                    initialConfig.geminiKeyStatus.configured ? "text-[var(--os-ok)]" : "text-[var(--os-warn)]"
                  }`}
                >
                  {initialConfig.geminiKeyStatus.configured
                    ? `✓ Configured (${initialConfig.geminiKeyStatus.source === "db" ? "Database" : ".env"})`
                    : "⚠ Key missing"}
                </span>
              </div>

              <div className="relative mt-2">
                <input
                  type={showGeminiKey ? "text" : "password"}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder={
                    initialConfig.geminiKeyStatus.configured
                      ? `Key is set (${initialConfig.geminiKeyStatus.masked}) — enter new key to replace`
                      : "Paste AIzaSy... key"
                  }
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-3)] px-3 py-1.5 pr-14 font-mono text-xs text-[var(--os-fg)] placeholder:text-[var(--os-fg-faint)] focus:border-[var(--os-accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2 top-1.5 font-mono text-[0.68rem] text-[var(--os-fg-muted)] hover:text-[var(--os-fg)]"
                >
                  {showGeminiKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Anthropic Claude Key */}
            <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--os-fg)]">Anthropic Claude API Key</label>
                <span
                  className={`font-mono text-[0.68rem] ${
                    initialConfig.anthropicKeyStatus.configured ? "text-[var(--os-ok)]" : "text-[var(--os-warn)]"
                  }`}
                >
                  {initialConfig.anthropicKeyStatus.configured
                    ? `✓ Configured (${initialConfig.anthropicKeyStatus.source === "db" ? "Database" : ".env"})`
                    : "⚠ Key missing"}
                </span>
              </div>

              <div className="relative mt-2">
                <input
                  type={showAnthropicKey ? "text" : "password"}
                  value={anthropicApiKey}
                  onChange={(e) => setAnthropicApiKey(e.target.value)}
                  placeholder={
                    initialConfig.anthropicKeyStatus.configured
                      ? `Key is set (${initialConfig.anthropicKeyStatus.masked}) — enter new key to replace`
                      : "Paste sk-ant-... key"
                  }
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-3)] px-3 py-1.5 pr-14 font-mono text-xs text-[var(--os-fg)] placeholder:text-[var(--os-fg-faint)] focus:border-[var(--os-accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="absolute right-2 top-1.5 font-mono text-[0.68rem] text-[var(--os-fg-muted)] hover:text-[var(--os-fg)]"
                >
                  {showAnthropicKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-4">
          <div className="text-xs text-[var(--os-fg-muted)]">
            Active: <span className="font-mono font-medium text-[var(--os-fg)]">{primaryProvider}</span> /{" "}
            <span className="font-mono font-medium text-[var(--os-fg)]">{primaryModel}</span>
            {secondaryProvider !== "none" && (
              <>
                {" "}
                (Fallback:{" "}
                <span className="font-mono text-[var(--os-fg)]">
                  {secondaryProvider}/{secondaryModel}
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
