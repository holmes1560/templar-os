import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/server/auth";
import { connectionStatus } from "@/server/github";
import {
  getAiFullConfig,
  listAvailableModels,
} from "@/server/analyzer";
import { AiSettingsManager } from "./AiSettingsManager";
import { WORKSPACES } from "@/lib/apps";
import { DesktopHeroSettings } from "./DesktopHeroSettings";

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
  const [h, { github, ai }] = await Promise.all([headers(), searchParams]);
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : undefined;

  const [
    status,
    fullAiConfig,
    geminiModelsRes,
    anthropicModelsRes,
    settingsList,
    profile,
    publishedProjectsCount,
    enabledAppsCount,
    visibleSkillsCount,
  ] = await Promise.all([
    connectionStatus(origin),
    getAiFullConfig(),
    listAvailableModels("gemini"),
    listAvailableModels("anthropic"),
    db.setting.findMany(),
    db.profile.findFirst(),
    db.project.count({ where: { status: "PUBLISHED", visible: true } }),
    db.application.count({ where: { enabled: true } }),
    db.skill.count({ where: { visible: true } }),
  ]);

  const initialSettings: Record<string, string> = {};
  for (const s of settingsList) {
    initialSettings[s.key] = s.value;
  }
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

      {/* GitHub Integration Panel */}
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

        <div className="mt-4 pt-3 border-t border-[var(--os-line)] text-xs text-[var(--os-fg-muted)] flex flex-wrap items-center justify-between gap-2">
          <span>Callback URL:</span>
          <code className="font-mono text-[var(--os-fg)] select-all bg-[var(--os-surface-2)] px-2 py-0.5 rounded border border-[var(--os-line)]">
            {status.callbackUrl}
          </code>
        </div>
      </section>

      {/* Desktop Hero HUD Settings */}
      <section className="mt-6">
        <DesktopHeroSettings
          initialSettings={initialSettings}
          defaultName="ASENSO OWUSU ANSAH"
          defaultTitle="Software Engineer  |  Problem Solver  |  Builder"
          dynamicProjectsCount={publishedProjectsCount}
          dynamicAppsCount={enabledAppsCount}
          dynamicWorkspacesCount={WORKSPACES.length}
          dynamicSkillsCount={visibleSkillsCount}
        />
      </section>

      {/* AI Analyzer Configuration (OpenRouter Style) */}
      <section className="mt-6">
        <div className="mb-3">
          <h2 className="text-base font-semibold tracking-tight text-[var(--os-fg)]">
            AI Analyzer & Model Engine
          </h2>
          <p className="text-xs text-[var(--os-fg-muted)]">
            Configure primary and fallback AI models, discover upstream models live from Google and Anthropic APIs, and manage credentials with AES-256-GCM encryption.
          </p>
        </div>

        <AiSettingsManager
          initialConfig={fullAiConfig}
          initialGeminiModels={geminiModelsRes.models}
          initialAnthropicModels={anthropicModelsRes.models}
        />
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
