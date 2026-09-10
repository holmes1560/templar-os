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

export function KeysManager({ keys }: { keys: KeyItem[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newSecret, setNewSecret] = useState<{ secret: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

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

  function copySecret() {
    if (!newSecret) return;
    navigator.clipboard.writeText(newSecret.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--os-fg-muted)]">
          API keys allow external AI agents and scripts to authenticate against <code className="text-[var(--os-fg)]">/api/v1</code> and the MCP server.
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1.5 text-xs font-medium text-[var(--os-accent-fg)]"
        >
          {showCreate ? "Cancel" : "+ Generate API Key"}
        </button>
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

      {/* One-time secret display banner */}
      {newSecret && (
        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-ok)] bg-[var(--os-ok-wash)] p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--os-ok)]">
              API Key Generated: {newSecret.name}
            </h3>
            <button
              onClick={() => setNewSecret(null)}
              className="text-xs text-[var(--os-fg-faint)] hover:text-[var(--os-fg)]"
            >
              Dismiss ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-[var(--os-fg-muted)]">
            Copy this secret token now. For security, it cannot be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={newSecret.secret}
              className="min-w-0 flex-1 rounded-[var(--os-r-chip)] border border-[var(--os-ok)]/50 bg-[var(--os-surface-1)] px-3 py-1.5 font-mono text-xs text-[var(--os-fg)] select-all"
            />
            <button
              onClick={copySecret}
              className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1.5 text-xs font-medium text-[var(--os-accent-fg)]"
            >
              {copied ? "Copied!" : "Copy Secret"}
            </button>
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

            {k.isActive && (
              <button
                onClick={() => handleRevoke(k.id, k.name)}
                className="rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/30 px-2.5 py-1 text-xs text-[var(--os-crit)] hover:bg-[var(--os-crit-wash)]"
              >
                Revoke Key
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
