"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { importProjectAction, type FormState } from "../../actions";
import { CATEGORIES, STATUSES, VISIBILITIES } from "@/server/validation";
import type { Analysis, AiProvider } from "@/server/analyzer";
import type { GhRepo } from "@/server/github";

interface Props {
  repo: GhRepo;
  analysis: Analysis | null;
  provider: AiProvider;
  model?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  aiSuccess: boolean;
  errorMessage?: string;
  headSha?: string;
}

const ICONS = [
  "folder", "globe", "terminal", "user", "chart",
  "doc", "mail", "files", "github", "pulse", "cog", "note",
];

const LAUNCH_MODES = [
  { value: "INTERNAL", label: "INTERNAL (OS window / project sheet)" },
  { value: "EXTERNAL", label: "EXTERNAL (Open in new browser tab)" },
  { value: "IFRAME", label: "IFRAME (Embedded web app inside window)" },
  { value: "DEMO", label: "DEMO (Self-contained interactive demo)" },
];

const PROVIDER_NAMES: Record<string, string> = {
  gemini: "Google Gemini",
  anthropic: "Anthropic Claude",
  openai: "OpenAI",
  deepseek: "DeepSeek",
  xai: "xAI (Grok)",
  groq: "Groq",
  mistral: "Mistral AI",
  openrouter: "OpenRouter",
  ollama: "Ollama",
  custom: "Custom Provider",
};

export function ImportReviewForm({
  repo,
  analysis,
  provider,
  model,
  fallbackUsed,
  fallbackReason,
  aiSuccess,
  errorMessage,
  headSha,
}: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    importProjectAction,
    {}
  );

  const [createApp, setCreateApp] = useState(true);

  const defaultName = analysis?.name || repo.name;
  const defaultSlug = (analysis?.name || repo.name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const defaultShort = analysis?.shortDescription || repo.description || "";
  const defaultLong = analysis?.longDescription || repo.description || "";
  const defaultCategory = (analysis?.category || "web").toUpperCase();
  const defaultTech = analysis?.technologies?.join(", ") || repo.language || "";
  const defaultFeatures = analysis?.features?.join("\n") || "";
  const defaultChallenges = analysis?.challenges?.join("\n") || "";
  const defaultLiveUrl = analysis?.liveUrlFound || "";
  const defaultIcon = analysis?.suggestedIcon || "folder";
  const defaultAppName = analysis?.applicationName || defaultName;
  const defaultLaunchMode = (analysis?.suggestedLaunchMode || "INTERNAL").toUpperCase();
  const defaultDesktopVisible = analysis?.desktopVisible ?? true;

  return (
    <form action={action} className="space-y-7">
      {/* Hidden GitHub Linkage Data */}
      <input type="hidden" name="githubRepoId" value={repo.id} />
      <input type="hidden" name="defaultBranch" value={repo.default_branch} />
      <input type="hidden" name="lastAnalyzedSha" value={headSha || ""} />

      {/* AI Analysis Diagnostics Banner */}
      <div className={`rounded-[var(--os-r-panel)] border p-4 ${
        aiSuccess
          ? "border-[var(--os-ok)]/30 bg-[var(--os-ok)]/[0.05]"
          : "border-[var(--os-warn)]/30 bg-[var(--os-warn)]/[0.07]"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${aiSuccess ? "bg-[var(--os-ok)]" : "bg-[var(--os-warn)]"}`} />
            <span className="font-mono text-xs font-semibold text-[var(--os-fg)]">
              {aiSuccess
                ? `Analyzed with ${PROVIDER_NAMES[provider] || provider}${model ? ` (${model})` : ""}`
                : "Fallback Mode"}
            </span>
            {fallbackUsed && (
              <span className="rounded-[var(--os-r-chip)] border border-[var(--os-warn)]/40 bg-[var(--os-warn)]/10 px-2 py-0.5 font-mono text-[0.65rem] text-[var(--os-warn)]">
                Failover Triggered
              </span>
            )}
          </div>
          {analysis?.categoryConfidence && (
            <span className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-2 py-0.5 font-mono text-[0.65rem] text-[var(--os-fg-muted)]">
              Category confidence: {analysis.categoryConfidence}
            </span>
          )}
        </div>

        {fallbackReason && (
          <p className="mt-1.5 font-mono text-[0.68rem] text-[var(--os-warn)]">
            Primary engine note: {fallbackReason}
          </p>
        )}

        {errorMessage && (
          <p className="mt-2 text-xs text-[var(--os-warn)]">{errorMessage}</p>
        )}

        {analysis?.unknowns && analysis.unknowns.length > 0 && (
          <div className="mt-2.5 border-t border-[var(--os-line)]/50 pt-2 text-[0.7rem] text-[var(--os-fg-muted)]">
            <span className="font-mono text-[var(--os-fg-faint)]">Model notes: </span>
            {analysis.unknowns.join(" • ")}
          </div>
        )}
      </div>

      {state.error && (
        <div className="rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/30 bg-[var(--os-crit)]/10 p-3 text-sm text-[var(--os-crit)]">
          {state.error}
        </div>
      )}

      {/* Identity */}
      <fieldset className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
        <legend className="label px-1">Identity</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5 block">Name</label>
            <input
              name="name"
              defaultValue={defaultName}
              required
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 text-sm text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Slug</label>
            <input
              name="slug"
              defaultValue={defaultSlug}
              required
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 font-mono text-sm text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="label mb-1.5 block">Short description (One line)</label>
          <input
            name="shortDescription"
            defaultValue={defaultShort}
            required
            className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 text-sm text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <label className="label mb-1.5 block">Long description</label>
          <textarea
            name="longDescription"
            defaultValue={defaultLong}
            required
            rows={4}
            className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] p-3 text-sm text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
          />
        </div>
      </fieldset>

      {/* Classification */}
      <fieldset className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
        <legend className="label px-1">Classification & Status</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5 block">Category</label>
            <select
              name="category"
              defaultValue={defaultCategory}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 text-sm text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label mb-1.5 block">Status</label>
            <select
              name="status"
              defaultValue="PUBLISHED"
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 text-sm text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5 block">Period</label>
            <input
              name="period"
              placeholder="e.g. 2026 or 2024–2025"
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 text-sm text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Team / Attribution</label>
            <input
              name="team"
              placeholder="e.g. Solo or Group project"
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 text-sm text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
        </div>
      </fieldset>

      {/* Tech & Narrative */}
      <fieldset className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
        <legend className="label px-1">Technologies & Narrative</legend>
        <div>
          <label className="label mb-1.5 block">Technologies (comma-separated)</label>
          <input
            name="technologies"
            defaultValue={defaultTech}
            className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 font-mono text-sm text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5 block">Features (one per line)</label>
            <textarea
              name="features"
              defaultValue={defaultFeatures}
              rows={4}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] p-2.5 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Challenges (one per line)</label>
            <textarea
              name="challenges"
              defaultValue={defaultChallenges}
              rows={4}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] p-2.5 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
        </div>
      </fieldset>

      {/* Links */}
      <fieldset className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
        <legend className="label px-1">Links & Hosting</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5 block">GitHub URL</label>
            <input
              name="githubUrl"
              defaultValue={repo.html_url}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Live Demo URL</label>
            <input
              name="liveUrl"
              defaultValue={defaultLiveUrl}
              placeholder="https://..."
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 font-mono text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 text-xs text-[var(--os-fg)]">
            <input type="checkbox" name="featured" defaultChecked={false} className="accent-[var(--os-accent)]" />
            Featured project
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--os-fg)]">
            <input type="checkbox" name="hosted" defaultChecked={Boolean(defaultLiveUrl)} className="accent-[var(--os-accent)]" />
            Hosted (Live deployment active)
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--os-fg)]">
            <input type="checkbox" name="clientWork" defaultChecked={false} className="accent-[var(--os-accent)]" />
            Client Work
          </label>
        </div>
      </fieldset>

      {/* Desktop App Integration */}
      <fieldset className="rounded-[var(--os-r-panel)] border border-[var(--os-accent)]/30 bg-[var(--os-surface-1)] p-5">
        <legend className="label px-1 text-[var(--os-accent)]">OS Desktop App Integration</legend>

        <label className="mb-4 flex items-center gap-2 text-xs font-semibold text-[var(--os-fg)]">
          <input
            type="checkbox"
            name="createApp"
            checked={createApp}
            onChange={(e) => setCreateApp(e.target.checked)}
            className="accent-[var(--os-accent)]"
          />
          Create Desktop Application icon immediately
        </label>

        {createApp && (
          <div className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label mb-1.5 block">App Name</label>
                <input
                  name="appName"
                  defaultValue={defaultAppName}
                  required={createApp}
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 text-sm text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="label mb-1.5 block">App Icon</label>
                <select
                  name="appIcon"
                  defaultValue={defaultIcon}
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 text-sm text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
                >
                  {ICONS.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label mb-1.5 block">Launch Mode</label>
                <select
                  name="launchMode"
                  defaultValue={defaultLaunchMode}
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
                >
                  {LAUNCH_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label mb-1.5 block">Workspace</label>
                <select
                  name="workspace"
                  defaultValue="1"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
                >
                  <option value="0">Home (Workspace 1)</option>
                  <option value="1">Projects (Workspace 2)</option>
                  <option value="2">Cyber Lab (Workspace 3)</option>
                  <option value="3">Experiments (Workspace 4)</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-[var(--os-fg)]">
              <input
                type="checkbox"
                name="desktopVisible"
                defaultChecked={defaultDesktopVisible}
                className="accent-[var(--os-accent)]"
              />
              Show icon on desktop grid
            </label>
          </div>
        )}
      </fieldset>

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/projects/import"
          className="label hover:text-[var(--os-fg)]"
        >
          ← Cancel and return to repos
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-5 py-2.5 text-sm font-medium text-[var(--os-accent-fg)] disabled:opacity-50"
        >
          {pending ? "Publishing Project..." : "Approve & Publish to Portfolio"}
        </button>
      </div>
    </form>
  );
}
