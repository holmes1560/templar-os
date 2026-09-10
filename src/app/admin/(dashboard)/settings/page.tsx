import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/server/auth";
import { connectionStatus } from "@/server/github";
import {
  getAiConfigStatus,
  setActiveAiProvider,
  saveAiApiKey,
  type AiProvider,
} from "@/server/analyzer";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, { tone: "ok" | "warn" | "crit"; text: string }> = {
  connected: { tone: "ok", text: "GitHub connected." },
  denied: { tone: "warn", text: "Authorization was cancelled on GitHub." },
  unconfigured: { tone: "warn", text: "No GitHub App is configured yet — see SETUP.md." },
  bad_request: { tone: "crit", text: "GitHub sent an incomplete response. Try again." },
  state_mismatch: { tone: "crit", text: "Security check failed. Start the connection again from this page." },
  exchange_failed: { tone: "crit", text: "GitHub rejected the authorization. Check the client secret." },
  identify_failed: { tone: "crit", text: "Connected, but the account could not be identified. Try again." },
  disconnected: { tone: "ok", text: "GitHub disconnected. Your projects are untouched." },
  ai_saved: { tone: "ok", text: "AI analyzer settings saved." },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ github?: string; ai?: string }>;
}) {
  await requireAdmin();
  const { github, ai } = await searchParams;
  const status = await connectionStatus();
  const aiStatus = await getAiConfigStatus();
  const msg = github ? MESSAGES[github] : ai ? MESSAGES[ai] : undefined;

  async function disconnectGitHub() {
    "use server";
    const user = await requireAdmin();
    // credential only — projects and their GitHub metadata survive (§21)
    await db.gitHubConnection.deleteMany({});
    await audit(user.id, "github.disconnected", "GitHubConnection");
    revalidatePath("/admin/settings");
    redirect("/admin/settings?github=disconnected");
  }

  async function updateAiProvider(formData: FormData) {
    "use server";
    const user = await requireAdmin();
    const provider = formData.get("provider") as AiProvider;
    if (provider === "gemini" || provider === "anthropic") {
      await setActiveAiProvider(provider);
      await audit(user.id, "ai.set_provider", "Setting", provider);
    }
    const apiKey = formData.get("apiKey") as string | null;
    if (apiKey && apiKey.trim().length > 0) {
      await saveAiApiKey(provider, apiKey.trim());
      await audit(user.id, "ai.save_key", "Setting", provider);
    }
    revalidatePath("/admin/settings");
    redirect("/admin/settings?ai=ai_saved");
  }

  const linkedProjects = await db.project.count({ where: { githubRepoId: { not: null } } });

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-[var(--os-fg)]">Settings</h1>
      <p className="mb-7 text-sm text-[var(--os-fg-muted)]">Integrations and system configuration.</p>

      {msg && (
        <p
          role="status"
          className={`mb-6 rounded-[var(--os-r-chip)] border px-3 py-2 text-sm ${
            msg.tone === "ok"
              ? "border-[var(--os-ok)]/30 bg-[var(--os-ok)]/[0.08]"
              : msg.tone === "warn"
              ? "border-[var(--os-warn)]/30 bg-[var(--os-warn)]/[0.08]"
              : "border-[var(--os-crit)]/30 bg-[var(--os-crit)]/[0.08]"
          }`}
        >
          {msg.text}
        </p>
      )}

      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-[var(--os-fg)]">GitHub</h2>
            <p className="mt-0.5 text-xs text-[var(--os-fg-muted)]">
              Import projects straight from your repositories.
            </p>
          </div>
          <Status state={status.state} />
        </div>

        {status.state === "unconfigured" && (
          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3">
            <p className="text-xs leading-relaxed text-[var(--os-fg-muted)]">
              No GitHub App registered yet. Follow <span className="font-mono">SETUP.md § 5</span> —
              register the app with read-only <span className="font-mono">Contents</span> and{" "}
              <span className="font-mono">Metadata</span>, then add the credentials to{" "}
              <span className="font-mono">.env</span> and restart.
            </p>
            <p className="mt-2 text-xs text-[var(--os-fg-faint)]">
              Manual project creation works without this.
            </p>
          </div>
        )}

        {status.state === "disconnected" && (
          <>
            <p className="mb-4 max-w-[52ch] text-xs leading-relaxed text-[var(--os-fg-muted)]">
              Connect your GitHub account to browse repositories and import them automatically.
              You choose which repositories the app can see, and can change that on GitHub at
              any time.
            </p>
            <a
              href="/api/github/authorize"
              className="pressable inline-block rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3.5 py-2 text-sm font-medium text-[var(--os-accent-fg)]"
            >
              Connect GitHub
            </a>
          </>
        )}

        {(status.state === "connected" || status.state === "invalid") && (
          <>
            <div className="mb-4 flex items-center gap-3">
              {status.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={status.avatarUrl} alt="" width={36} height={36}
                     className="rounded-full border border-[var(--os-line)]" />
              )}
              <div>
                <div className="font-mono text-sm text-[var(--os-fg)]">@{status.login}</div>
                <div className="label">
                  {linkedProjects} project{linkedProjects === 1 ? "" : "s"} linked
                </div>
              </div>
            </div>

            {status.state === "invalid" && (
              <p className="mb-4 rounded-[var(--os-r-chip)] border border-[var(--os-warn)]/30 bg-[var(--os-warn)]/[0.07] px-3 py-2 text-xs text-[var(--os-fg-muted)]">
                This connection is no longer accepted by GitHub — the authorization was revoked or
                expired. Reauthorize to resume importing. Existing projects are unaffected.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <a
                href="/api/github/authorize"
                className="pressable rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] px-3 py-2 text-sm text-[var(--os-fg)] hover:bg-[var(--os-surface-3)]"
              >
                Reauthorize
              </a>
              <form action={disconnectGitHub}>
                <button className="pressable rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/40 px-3 py-2 text-sm text-[var(--os-crit)] hover:bg-[var(--os-crit)]/10">
                  Disconnect
                </button>
              </form>
              <Link
                href="/admin/projects/import"
                className="ml-auto self-center text-xs text-[var(--os-fg-muted)] hover:text-[var(--os-accent)]"
              >
                Import a repository →
              </Link>
            </div>

            <p className="mt-3 text-[0.68rem] leading-relaxed text-[var(--os-fg-faint)]">
              Disconnecting removes only the ability to import and sync. No project is deleted.
            </p>
          </>
        )}
      </section>

      <section className="mt-6 rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-[var(--os-fg)]">AI Project Analyzer</h2>
            <p className="mt-0.5 text-xs text-[var(--os-fg-muted)]">
              Model provider used for automated repository analysis and metadata extraction.
            </p>
          </div>
          <span className={`shrink-0 rounded-[var(--os-r-chip)] border px-2 py-1 font-mono text-[0.65rem] ${
            aiStatus.isReady
              ? "text-[var(--os-ok)] bg-[var(--os-ok)]/10 border-[var(--os-ok)]/30"
              : "text-[var(--os-warn)] bg-[var(--os-warn)]/10 border-[var(--os-warn)]/30"
          }`}>
            ● {aiStatus.isReady ? `Ready (${aiStatus.activeProvider})` : "Key needed"}
          </span>
        </div>

        <form action={updateAiProvider} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Gemini Option */}
            <label className={`relative flex cursor-pointer flex-col rounded-[var(--os-r-chip)] border p-3.5 transition-colors ${
              aiStatus.activeProvider === "gemini"
                ? "border-[var(--os-accent)] bg-[var(--os-accent)]/[0.05]"
                : "border-[var(--os-line)] bg-[var(--os-surface-2)] hover:border-[var(--os-line-strong)]"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="provider"
                    value="gemini"
                    defaultChecked={aiStatus.activeProvider === "gemini"}
                    className="accent-[var(--os-accent)]"
                  />
                  <span className="font-mono text-xs font-semibold text-[var(--os-fg)]">Google Gemini (Default)</span>
                </div>
                <span className="font-mono text-[0.65rem] text-[var(--os-fg-faint)]">{aiStatus.gemini.model}</span>
              </div>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-[var(--os-fg-muted)]">
                Fast, cost-effective structured JSON analysis using the latest Gemini models.
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[0.68rem]">
                <span className={aiStatus.gemini.configured ? "text-[var(--os-ok)]" : "text-[var(--os-warn)]"}>
                  {aiStatus.gemini.configured ? `✓ Configured (${aiStatus.gemini.keySource})` : "⚠ Key missing"}
                </span>
              </div>
            </label>

            {/* Anthropic Option */}
            <label className={`relative flex cursor-pointer flex-col rounded-[var(--os-r-chip)] border p-3.5 transition-colors ${
              aiStatus.activeProvider === "anthropic"
                ? "border-[var(--os-accent)] bg-[var(--os-accent)]/[0.05]"
                : "border-[var(--os-line)] bg-[var(--os-surface-2)] hover:border-[var(--os-line-strong)]"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="provider"
                    value="anthropic"
                    defaultChecked={aiStatus.activeProvider === "anthropic"}
                    className="accent-[var(--os-accent)]"
                  />
                  <span className="font-mono text-xs font-semibold text-[var(--os-fg)]">Anthropic Claude</span>
                </div>
                <span className="font-mono text-[0.65rem] text-[var(--os-fg-faint)]">{aiStatus.anthropic.model}</span>
              </div>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-[var(--os-fg-muted)]">
                Deep architectural analysis using Claude with extended thinking and Zod output schemas.
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[0.68rem]">
                <span className={aiStatus.anthropic.configured ? "text-[var(--os-ok)]" : "text-[var(--os-warn)]"}>
                  {aiStatus.anthropic.configured ? `✓ Configured (${aiStatus.anthropic.keySource})` : "⚠ Key missing"}
                </span>
              </div>
            </label>
          </div>

          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3.5">
            <label htmlFor="apiKey" className="block text-xs font-medium text-[var(--os-fg)]">
              API Key (Optional — override or set for the chosen provider)
            </label>
            <p className="mt-0.5 text-[0.68rem] text-[var(--os-fg-muted)]">
              Keys can also be placed in <span className="font-mono">.env</span> as <span className="font-mono">GEMINI_API_KEY</span> or <span className="font-mono">ANTHROPIC_API_KEY</span>. Any key saved here is encrypted at rest (AES-256-GCM).
            </p>
            <input
              id="apiKey"
              name="apiKey"
              type="password"
              placeholder="Paste new API key to save (e.g. AIzaSy... or sk-ant-...)"
              className="mt-2 w-full rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] bg-[var(--os-surface-3)] px-3 py-1.5 font-mono text-xs text-[var(--os-fg)] placeholder:text-[var(--os-fg-faint)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-4 py-2 text-xs font-medium text-[var(--os-accent-fg)]"
            >
              Save AI Settings
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

function Status({ state }: { state: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    connected: { label: "Connected", cls: "text-[var(--os-ok)] bg-[var(--os-ok)]/10 border-[var(--os-ok)]/30" },
    invalid: { label: "Needs reauthorization", cls: "text-[var(--os-warn)] bg-[var(--os-warn)]/10 border-[var(--os-warn)]/30" },
    disconnected: { label: "Not connected", cls: "text-[var(--os-fg-faint)] border-[var(--os-line)]" },
    unconfigured: { label: "Not configured", cls: "text-[var(--os-fg-faint)] border-[var(--os-line)]" },
  };
  const s = map[state] ?? map.disconnected;
  return (
    <span className={`shrink-0 rounded-[var(--os-r-chip)] border px-2 py-1 font-mono text-[0.65rem] ${s.cls}`}>
      ● {s.label}
    </span>
  );
}
