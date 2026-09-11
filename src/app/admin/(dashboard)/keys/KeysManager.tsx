"use client";

import { useState } from "react";
import { createApiKeyAction, revokeApiKeyAction } from "./actions";

interface KeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  role: string;
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

const AGENT_OPTIONS = [
  { id: "all", label: "All Agents", icon: "🌐" },
  { id: "claude", label: "Claude Desktop", icon: "🤖" },
  { id: "cursor", label: "Cursor IDE", icon: "💻" },
  { id: "claude-code", label: "Claude Code CLI", icon: "⌨️" },
  { id: "windsurf", label: "Windsurf", icon: "🌊" },
] as const;

export function KeysManager({ keys }: { keys: KeyItem[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [newSecret, setNewSecret] = useState<{ secret: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [helperAgent, setHelperAgent] = useState<string>("all");
  const [helperKey, setHelperKey] = useState<string>("");

  function getInstallCommand(agent: string, keyVal: string) {
    const isCustomDomain =
      typeof window !== "undefined" &&
      window.location.origin &&
      !window.location.origin.includes("templar-os.vercel.app") &&
      !window.location.origin.includes("localhost:3000") &&
      !window.location.origin.includes("localhost:3100");

    const urlFlag = isCustomDomain ? ` --url ${window.location.origin}` : "";
    return `npx -y templar-os install ${agent} --key ${keyVal || "<YOUR_API_KEY>"}${urlFlag}`;
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createApiKeyAction(formData);
      if (res.error) {
        setMsg({ type: "err", text: res.error });
      } else if (res.secret) {
        setNewSecret({ secret: res.secret, name: res.keyName || "API Key" });
        setShowCreate(false);
      }
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(id: string, name: string) {
    if (!confirm(`Revoke key "${name}"? Agents using it will lose access immediately.`)) return;
    setLoading(true);
    try {
      await revokeApiKeyAction(id);
      setMsg({ type: "ok", text: `Revoked key "${name}".` });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string, isCommand = false) {
    navigator.clipboard.writeText(text);
    if (isCommand) {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--os-fg-muted)]">
          API keys allow external AI agents and scripts to authenticate against <code className="text-[var(--os-fg)]">/api/v1</code> and the MCP server.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelper(!showHelper)}
            className="pressable rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] hover:bg-[var(--os-surface-3)] px-3 py-1.5 text-xs font-medium text-[var(--os-fg)]"
          >
            {showHelper ? "Close Generator" : "Generate MCP Command"}
          </button>
          <button
            onClick={() => {
              setShowCreate(!showCreate);
              if (showHelper) setShowHelper(false);
            }}
            className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1.5 text-xs font-medium text-[var(--os-accent-fg)]"
          >
            {showCreate ? "Cancel" : "+ Generate API Key"}
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`rounded-[var(--os-r-panel)] p-3 text-xs font-mono ${
            msg.type === "ok"
              ? "bg-[var(--os-ok-wash)] text-[var(--os-ok)] border border-[var(--os-ok)]/30"
              : "bg-[var(--os-crit-wash)] text-[var(--os-crit)] border border-[var(--os-crit)]/30"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Standalone MCP Install Command Generator */}
      {showHelper && (
        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-accent)]/40 bg-[var(--os-surface-1)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--os-fg)] flex items-center gap-1.5">
              Generate Terminal MCP Install Command
            </h3>
            <button
              onClick={() => setShowHelper(false)}
              className="text-xs text-[var(--os-fg-faint)] hover:text-[var(--os-fg)]"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-[var(--os-fg-muted)]">
            Run this command directly in any terminal (macOS, Linux, or Windows) to configure your AI agent via global <code className="text-[var(--os-accent)]">npx</code> without needing to clone any code repository.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label mb-1 block">1. Select AI Agent Client</label>
              <div className="flex flex-wrap gap-1.5">
                {AGENT_OPTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setHelperAgent(a.id)}
                    className={`rounded-[var(--os-r-chip)] px-2.5 py-1 text-xs font-medium transition-colors ${
                      helperAgent === a.id
                        ? "bg-[var(--os-accent)] text-[var(--os-accent-fg)] shadow-sm"
                        : "bg-[var(--os-surface-2)] text-[var(--os-fg-muted)] hover:text-[var(--os-fg)] border border-[var(--os-line)]"
                    }`}
                  >
                    <span className="mr-1">{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label mb-1 block">2. API Key (Optional)</label>
              <input
                value={helperKey}
                onChange={(e) => setHelperKey(e.target.value.trim())}
                placeholder="tpl_live_... (or leave blank to replace in terminal)"
                className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs font-mono text-[var(--os-fg)] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="label mb-1 block">3. Copy & Run Terminal Command</label>
            <div className="flex items-center gap-2 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-base)] p-1.5 pl-3">
              <span className="text-xs text-[var(--os-accent)] select-none font-mono font-bold">$</span>
              <code className="min-w-0 flex-1 font-mono text-xs text-[var(--os-fg)] select-all overflow-x-auto whitespace-nowrap py-0.5">
                {getInstallCommand(helperAgent, helperKey)}
              </code>
              <button
                type="button"
                onClick={() => copyText(getInstallCommand(helperAgent, helperKey), true)}
                className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1 text-xs font-medium text-[var(--os-accent-fg)] shrink-0"
              >
                {copiedCmd ? "✓ Copied!" : "Copy Command"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One-time secret display banner with Interactive MCP Install Generator */}
      {newSecret && (
        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-ok)] bg-[var(--os-ok-wash)] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--os-ok)] flex items-center gap-1.5">
              <span>✓</span> API Key Generated: {newSecret.name}
            </h3>
            <button
              onClick={() => setNewSecret(null)}
              className="text-xs text-[var(--os-fg-faint)] hover:text-[var(--os-fg)]"
            >
              Dismiss ✕
            </button>
          </div>
          <p className="text-xs text-[var(--os-fg-muted)]">
            Copy this secret token now. For security, it cannot be recovered after this session.
          </p>

          {/* Raw Key Input */}
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={newSecret.secret}
              className="min-w-0 flex-1 rounded-[var(--os-r-chip)] border border-[var(--os-ok)]/50 bg-[var(--os-surface-1)] px-3 py-1.5 font-mono text-xs text-[var(--os-fg)] select-all"
            />
            <button
              onClick={() => copyText(newSecret.secret, false)}
              className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-surface-2)] hover:bg-[var(--os-surface-3)] border border-[var(--os-line)] px-3 py-1.5 text-xs font-medium text-[var(--os-fg)] shrink-0"
            >
              {copiedKey ? "✓ Copied Key!" : "Copy Key"}
            </button>
          </div>

          {/* Embedded Terminal MCP Installer Section */}
          <div className="pt-3 border-t border-[var(--os-ok)]/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[0.72rem] font-semibold tracking-wide uppercase text-[var(--os-fg)] flex items-center gap-1">
                One-Line Terminal MCP Installer
              </span>
              <span className="text-[0.68rem] text-[var(--os-fg-muted)] font-mono">
                Runs via npx without cloning
              </span>
            </div>

            {/* Agent Selector Pills */}
            <div className="flex flex-wrap gap-1.5">
              {AGENT_OPTIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAgent(a.id)}
                  className={`rounded-[var(--os-r-chip)] px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedAgent === a.id
                      ? "bg-[var(--os-accent)] text-[var(--os-accent-fg)] shadow-sm"
                      : "bg-[var(--os-surface-1)] text-[var(--os-fg-muted)] hover:text-[var(--os-fg)] border border-[var(--os-line)]"
                  }`}
                >
                  <span className="mr-1">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>

            {/* Terminal Command Box */}
            <div className="flex items-center gap-2 rounded-[var(--os-r-chip)] border border-[var(--os-ok)]/40 bg-[var(--os-surface-base)] p-1.5 pl-3">
              <span className="text-xs text-[var(--os-accent)] select-none font-mono font-bold">$</span>
              <code className="min-w-0 flex-1 font-mono text-xs text-[var(--os-fg)] select-all overflow-x-auto whitespace-nowrap py-0.5">
                {getInstallCommand(selectedAgent, newSecret.secret)}
              </code>
              <button
                type="button"
                onClick={() => copyText(getInstallCommand(selectedAgent, newSecret.secret), true)}
                className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1 text-xs font-medium text-[var(--os-accent-fg)] shrink-0"
              >
                {copiedCmd ? "✓ Copied Command!" : "Copy Command"}
              </button>
            </div>

            <p className="text-[0.7rem] text-[var(--os-fg-faint)]">
              Paste and run directly in terminal. It will auto-detect your client settings, inject the MCP server configuration, and install the agent skills.
            </p>
          </div>
        </div>
      )}

      {/* Creation form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-[var(--os-r-panel)] border border-[var(--os-accent)] bg-[var(--os-surface-1)] p-4 space-y-3"
        >
          <h3 className="text-xs font-semibold text-[var(--os-fg)]">Generate New API Key</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label mb-1 block">Key Name / Description</label>
              <input
                name="name"
                required
                placeholder="e.g. Claude Code Assistant"
                className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
              />
            </div>
            <div>
              <label className="label mb-1 block">Role</label>
              <select
                name="role"
                defaultValue="AGENT"
                className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
              >
                <option value="AGENT">AGENT (Read + Draft Submissions)</option>
                <option value="ADMIN">ADMIN (Full Root Access)</option>
                <option value="READ_ONLY">READ_ONLY (Public Data Reads)</option>
              </select>
            </div>
            <div>
              <label className="label mb-1 block">Custom Scopes (Optional)</label>
              <input
                name="scopes"
                placeholder="projects:*, drafts:*"
                className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-2.5 py-1 text-xs text-[var(--os-fg-muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1 text-xs font-medium text-[var(--os-accent-fg)]"
            >
              Generate Key
            </button>
          </div>
        </form>
      )}

      {/* Keys List */}
      <div className="divide-y divide-[var(--os-line)] rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)]">
        {keys.map((k) => (
          <div
            key={k.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-[var(--os-surface-2)]/50"
          >
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-[var(--os-fg)]">{k.name}</h4>
                <span className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-3)] px-1.5 py-0.2 font-mono text-[0.6rem] text-[var(--os-fg-muted)]">
                  {k.role}
                </span>
                <span
                  className={`rounded-[var(--os-r-chip)] px-1.5 py-0.2 font-mono text-[0.6rem] ${
                    k.isActive
                      ? "bg-[var(--os-ok-wash)] text-[var(--os-ok)]"
                      : "bg-[var(--os-crit-wash)] text-[var(--os-crit)]"
                  }`}
                >
                  {k.isActive ? "ACTIVE" : "REVOKED"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[0.68rem] text-[var(--os-fg-faint)]">
                <span>Prefix: {k.keyPrefix}...</span>
                <span>•</span>
                <span>Scopes: {k.scopes.join(", ")}</span>
                <span>•</span>
                <span>Last used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {k.isActive && (
                <button
                  type="button"
                  onClick={() => {
                    setHelperKey(`${k.keyPrefix}...`);
                    setShowHelper(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="pressable rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] hover:bg-[var(--os-surface-3)] px-2.5 py-1 text-xs font-medium text-[var(--os-fg)] flex items-center gap-1"
                >
                  MCP Command
                </button>
              )}
              {k.isActive && (
                <button
                  onClick={() => handleRevoke(k.id, k.name)}
                  className="rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/30 px-2.5 py-1 text-xs text-[var(--os-crit)] hover:bg-[var(--os-crit-wash)]"
                >
                  Revoke Key
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
