"use client";

import { useState } from "react";
import Link from "next/link";

interface AgentOption {
  id: string;
  label: string;
  icon: string;
  configPath: string;
  clientName: string;
}

const AGENTS: AgentOption[] = [
  { id: "all", label: "All Agents", icon: "🌐", configPath: "Auto-detects all installed AI clients", clientName: "All Supported Agents" },
  { id: "claude", label: "Claude Desktop", icon: "🤖", configPath: "~/Library/Application Support/Claude/claude_desktop_config.json", clientName: "Claude Desktop" },
  { id: "cursor", label: "Cursor IDE", icon: "💻", configPath: ".cursor/mcp.json (or Cursor Settings)", clientName: "Cursor IDE" },
  { id: "claude-code", label: "Claude Code CLI", icon: "⌨️", configPath: "~/.claude.json (or claude mcp add)", clientName: "Claude Code" },
  { id: "windsurf", label: "Windsurf", icon: "🌊", configPath: "~/.codeium/windsurf/mcp_config.json", clientName: "Windsurf" },
];

export function ApiDocsHub() {
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [apiKey, setApiKey] = useState<string>("");
  const [copiedInstallCmd, setCopiedInstallCmd] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeJsonTab, setActiveJsonTab] = useState<string>("claude");

  const effectiveKey = apiKey.trim() || "<YOUR_API_KEY>";

  // Determine current origin or default to production vercel url
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://templar-os.vercel.app";

  const isCustomDomain =
    !origin.includes("templar-os.vercel.app") &&
    !origin.includes("localhost:3000") &&
    !origin.includes("localhost:3100");

  const urlFlag = isCustomDomain ? ` --url ${origin}` : "";
  const installCmd = `npx -y templar-os install ${selectedAgent} --key ${effectiveKey}${urlFlag}`;

  const manualConfigs: Record<string, string> = {
    claude: JSON.stringify(
      {
        mcpServers: {
          "templar-portfolio": {
            command: "npx",
            args: ["-y", "templar-os", "mcp"],
            env: {
              PORTFOLIO_API_URL: origin,
              PORTFOLIO_API_KEY: effectiveKey,
            },
          },
        },
      },
      null,
      2
    ),
    cursor: JSON.stringify(
      {
        mcpServers: {
          "templar-portfolio": {
            command: "npx",
            args: ["-y", "templar-os", "mcp"],
            env: {
              PORTFOLIO_API_URL: origin,
              PORTFOLIO_API_KEY: effectiveKey,
            },
          },
        },
      },
      null,
      2
    ),
    "claude-code": `# Run directly in Claude Code CLI:
claude mcp add templar-portfolio -- npx -y templar-os mcp`,
    windsurf: JSON.stringify(
      {
        mcpServers: {
          "templar-portfolio": {
            command: "npx",
            args: ["-y", "templar-os", "mcp"],
            env: {
              PORTFOLIO_API_URL: origin,
              PORTFOLIO_API_KEY: effectiveKey,
            },
          },
        },
      },
      null,
      2
    ),
    generic: JSON.stringify(
      {
        name: "templar-portfolio",
        command: "npx",
        args: ["-y", "templar-os", "mcp"],
        env: {
          PORTFOLIO_API_URL: origin,
          PORTFOLIO_API_KEY: effectiveKey,
        },
      },
      null,
      2
    ),
  };

  function copyText(text: string, type: "cmd" | "json") {
    navigator.clipboard.writeText(text);
    if (type === "cmd") {
      setCopiedInstallCmd(true);
      setTimeout(() => setCopiedInstallCmd(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  }

  const selectedAgentInfo = AGENTS.find((a) => a.id === selectedAgent) || AGENTS[0];

  return (
    <div className="space-y-8">
      {/* Top Banner: Package Status & Deployment */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-4 sm:p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--os-fg)]">
              Official NPM Package Deployed
            </h2>
            <span className="rounded-full bg-[var(--os-ok-wash)] px-2 py-0.5 font-mono text-[0.65rem] font-semibold text-[var(--os-ok)] border border-[var(--os-ok)]/30">
              v1.0.1 Live
            </span>
            <span className="rounded-full bg-[var(--os-surface-3)] px-2 py-0.5 font-mono text-[0.65rem] text-[var(--os-accent)]">
              Production
            </span>
          </div>
          <p className="text-xs text-[var(--os-fg-muted)]">
            Autonomous AI agents and coding tools can now connect from any computer via global <code className="text-[var(--os-fg)] font-mono">npx -y templar-os</code> without cloning the repository.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://www.npmjs.com/package/templar-os"
            target="_blank"
            rel="noopener noreferrer"
            className="pressable rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] hover:bg-[var(--os-surface-3)]"
          >
            NPM Package ↗
          </a>
          <Link
            href="/admin/keys"
            className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1.5 text-xs font-medium text-[var(--os-accent-fg)]"
          >
            Get API Key →
          </Link>
        </div>
      </div>

      {/* ── 1. One-Command Instant Agent Installer ── */}
      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--os-line)] pb-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--os-fg)]">
              1. Automated One-Line Agent Installer
            </h2>
            <p className="text-xs text-[var(--os-fg-muted)]">
              Run this single command in terminal to automatically inject the MCP server and install the agent skill into your editor.
            </p>
          </div>
          <span className="rounded-[var(--os-r-chip)] bg-[var(--os-surface-2)] px-2 py-0.5 font-mono text-[0.65rem] text-[var(--os-fg-muted)]">
            Zero-Clone Setup
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5 block">Select AI Agent Client:</label>
            <div className="flex flex-wrap gap-1.5">
              {AGENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAgent(a.id)}
                  className={`rounded-[var(--os-r-chip)] px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedAgent === a.id
                      ? "bg-[var(--os-accent)] text-[var(--os-accent-fg)] shadow-sm"
                      : "bg-[var(--os-surface-2)] text-[var(--os-fg-muted)] hover:text-[var(--os-fg)] border border-[var(--os-line)]"
                  }`}
                >
                  <span className="mr-1">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[0.7rem] font-mono text-[var(--os-fg-faint)]">
              Config target: {selectedAgentInfo.configPath}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label block">API Key (Optional):</label>
              <Link
                href="/admin/keys"
                className="text-[0.68rem] text-[var(--os-accent)] hover:underline"
              >
                Create API Key →
              </Link>
            </div>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value.trim())}
              placeholder="tpl_live_... (paste here to pre-populate)"
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs font-mono text-[var(--os-fg)] focus:outline-none"
            />
            <p className="mt-1 text-[0.68rem] text-[var(--os-fg-faint)]">
              If left blank, you can paste the key directly into the terminal prompt.
            </p>
          </div>
        </div>

        {/* Terminal Command Output Box */}
        <div className="rounded-[var(--os-r-chip)] border border-[var(--os-accent)]/40 bg-[var(--os-surface-base)] p-2.5 pl-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-mono uppercase tracking-wide text-[var(--os-fg-muted)]">
              Run in Terminal (macOS / Linux / Windows):
            </span>
            <button
              type="button"
              onClick={() => copyText(installCmd, "cmd")}
              className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1 text-xs font-medium text-[var(--os-accent-fg)] shrink-0"
            >
              {copiedInstallCmd ? "✓ Copied Command!" : "Copy Command"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="select-none font-mono text-xs font-bold text-[var(--os-accent)]">$</span>
            <code className="min-w-0 flex-1 select-all overflow-x-auto whitespace-nowrap font-mono text-xs text-[var(--os-fg)] py-0.5">
              {installCmd}
            </code>
          </div>
        </div>

        <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3 text-xs text-[var(--os-fg-muted)] space-y-1.5">
          <p className="font-medium text-[var(--os-fg)]">What this automated command performs:</p>
          <ul className="list-disc pl-4 space-y-1 text-[0.75rem]">
            <li>Tests live connectivity against <code className="text-[var(--os-fg)] font-mono">{origin}</code>.</li>
            <li>Locates and injects the <code className="text-[var(--os-fg)] font-mono">templar-portfolio</code> MCP server definition into your agent configuration.</li>
            <li>Installs the <code className="text-[var(--os-fg)] font-mono">portfolio-management</code> agent skill into your local AI agent directory.</li>
          </ul>
        </div>
      </section>

      {/* ── 2. Manual MCP Client Configurations ── */}
      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--os-line)] pb-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--os-fg)]">
              2. Manual MCP Configuration Snippets
            </h2>
            <p className="text-xs text-[var(--os-fg-muted)]">
              If you prefer manual configuration, paste these snippets directly into your client settings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyText(manualConfigs[activeJsonTab], "json")}
            className="pressable rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1 text-xs text-[var(--os-fg)] hover:bg-[var(--os-surface-3)]"
          >
            {copiedJson ? "✓ Copied Snippet!" : "Copy Configuration"}
          </button>
        </div>

        {/* Client Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "claude", label: "Claude Desktop" },
            { id: "cursor", label: "Cursor IDE" },
            { id: "claude-code", label: "Claude Code CLI" },
            { id: "windsurf", label: "Windsurf" },
            { id: "generic", label: "Generic stdio" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveJsonTab(tab.id)}
              className={`rounded-[var(--os-r-chip)] px-2.5 py-1 text-xs font-mono transition-colors ${
                activeJsonTab === tab.id
                  ? "bg-[var(--os-surface-3)] text-[var(--os-accent)] border border-[var(--os-line-strong)] font-semibold"
                  : "bg-[var(--os-surface-2)] text-[var(--os-fg-muted)] hover:text-[var(--os-fg)] border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <pre className="overflow-x-auto rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-base)] p-3 font-mono text-[0.72rem] text-[var(--os-fg)]">
          {manualConfigs[activeJsonTab]}
        </pre>
      </section>

      {/* ── 3. Built-in CLI Commands ── */}
      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--os-fg)]">
            3. Global CLI Commands (via npx)
          </h2>
          <p className="text-xs text-[var(--os-fg-muted)]">
            The published <code className="text-[var(--os-fg)] font-mono">templar-os</code> package includes a complete terminal toolkit:
          </p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 font-mono text-xs">
          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3 space-y-1">
            <span className="text-[var(--os-accent)] font-bold">npx -y templar-os install &lt;client&gt;</span>
            <p className="text-[0.68rem] text-[var(--os-fg-muted)] font-sans">
              Automates MCP configuration and skill installation for Claude, Cursor, Windsurf, or All.
            </p>
          </div>

          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3 space-y-1">
            <span className="text-[var(--os-accent)] font-bold">npx -y templar-os mcp</span>
            <p className="text-[0.68rem] text-[var(--os-fg-muted)] font-sans">
              Spawns the live stdio Model Context Protocol server for AI coding agents.
            </p>
          </div>

          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3 space-y-1">
            <span className="text-[var(--os-accent)] font-bold">npx -y templar-os status</span>
            <p className="text-[0.68rem] text-[var(--os-fg-muted)] font-sans">
              Pings the production API, tests credentials, and prints entity counts and pending review queue items.
            </p>
          </div>

          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3 space-y-1">
            <span className="text-[var(--os-accent)] font-bold">npx -y templar-os sync</span>
            <p className="text-[0.68rem] text-[var(--os-fg-muted)] font-sans">
              Scans your GitHub profile and automatically queues draft showcase entries for new projects.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. Exposed MCP Tools Reference ── */}
      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--os-fg)]">
            4. Exposed Model Context Protocol (MCP) Tools
          </h2>
          <p className="text-xs text-[var(--os-fg-muted)]">
            Your connected agent automatically gains access to these validated portfolio management tools:
          </p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 font-mono text-xs">
          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] p-3 bg-[var(--os-surface-2)]">
            <span className="text-[var(--os-accent)] font-semibold">portfolio_get_state</span>
            <p className="text-[0.68rem] text-[var(--os-fg-muted)] font-sans mt-0.5">
              Returns full profile bio, published project counts, skills taxonomy, and pending review queue items.
            </p>
          </div>
          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] p-3 bg-[var(--os-surface-2)]">
            <span className="text-[var(--os-accent)] font-semibold">portfolio_list_projects</span>
            <p className="text-[0.68rem] text-[var(--os-fg-muted)] font-sans mt-0.5">
              Query published projects with category filters (Full-Stack, Systems, IoT, etc.) and search keywords.
            </p>
          </div>
          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] p-3 bg-[var(--os-surface-2)]">
            <span className="text-[var(--os-accent)] font-semibold">portfolio_create_project_draft</span>
            <p className="text-[0.68rem] text-[var(--os-fg-muted)] font-sans mt-0.5">
              Proposes a new project showcase entry. Creates a pending draft in the Admin Review Queue for safety.
            </p>
          </div>
          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] p-3 bg-[var(--os-surface-2)]">
            <span className="text-[var(--os-accent)] font-semibold">portfolio_publish_draft</span>
            <p className="text-[0.68rem] text-[var(--os-fg-muted)] font-sans mt-0.5">
              Approves and publishes a pending draft into production (requires write authorization).
            </p>
          </div>
          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] p-3 bg-[var(--os-surface-2)]">
            <span className="text-[var(--os-accent)] font-semibold">portfolio_discover_missing_github_projects</span>
            <p className="text-[0.68rem] text-[var(--os-fg-muted)] font-sans mt-0.5">
              Analyzes repos under github.com/holmes1560 and proposes showcase stories with technical depth.
            </p>
          </div>
          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] p-3 bg-[var(--os-surface-2)]">
            <span className="text-[var(--os-accent)] font-semibold">portfolio_rollback_revision</span>
            <p className="text-[0.68rem] text-[var(--os-fg-muted)] font-sans mt-0.5">
              Restores previous entity state from the cryptographically hashed audit log trail.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. Versioned REST API (v1) ── */}
      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--os-line)] pb-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--os-fg)]">5. Versioned REST API (v1)</h2>
            <p className="text-xs text-[var(--os-fg-muted)]">Base URL: <code className="text-[var(--os-fg)] font-mono">{origin}/api/v1</code></p>
          </div>
          <Link
            href="/api/v1/openapi.json"
            target="_blank"
            className="pressable rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-3 py-1 text-xs text-[var(--os-accent)] hover:bg-[var(--os-surface-2)]"
          >
            OpenAPI 3.1 JSON ↗
          </Link>
        </div>

        <div className="space-y-3">
          <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3 font-mono text-xs text-[var(--os-fg-muted)]">
            <p className="text-[var(--os-fg)] font-medium">Authorization Header:</p>
            <p className="mt-1">Authorization: Bearer tpl_live_&lt;your-api-key&gt;</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-[var(--os-line)] text-[var(--os-fg-faint)]">
                <tr>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Endpoint</th>
                  <th className="py-2 pr-4">Scope</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--os-line)] text-[var(--os-fg-muted)]">
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-ok)]">GET</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/portfolio</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">portfolio:read</td>
                  <td className="py-2 font-sans text-[0.72rem]">Aggregate snapshot of full portfolio</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-ok)]">GET</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/profile</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">profile:read</td>
                  <td className="py-2 font-sans text-[0.72rem]">Bio, tagline, social links, contact coordinates</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-warn)]">PUT</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/profile</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">profile:write</td>
                  <td className="py-2 font-sans text-[0.72rem]">Update profile (creates audit revision)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-ok)]">GET</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/projects</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">projects:read</td>
                  <td className="py-2 font-sans text-[0.72rem]">List published engineering projects</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-accent)]">POST</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/projects</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">projects:create</td>
                  <td className="py-2 font-sans text-[0.72rem]">Create project or queue draft for review</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-ok)]">GET</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/timeline</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">timeline:read</td>
                  <td className="py-2 font-sans text-[0.72rem]">List career milestones and academic transitions</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-ok)]">GET</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/drafts</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">drafts:read</td>
                  <td className="py-2 font-sans text-[0.72rem]">Review Queue for pending agent proposals</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-accent)]">POST</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/github/discover</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">github:sync</td>
                  <td className="py-2 font-sans text-[0.72rem]">Audit GitHub repositories and generate draft entries</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 6. Agent Skill Rules ── */}
      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--os-fg)]">6. Standard Agent Skill Principles</h2>
        <p className="text-xs text-[var(--os-fg-muted)]">
          The skill bundled inside <code className="text-[var(--os-fg)] font-mono">templar-os</code> adheres to these non-negotiable directives:
        </p>

        <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3 text-xs space-y-2">
          <ul className="list-disc pl-4 space-y-1.5 text-[var(--os-fg-muted)]">
            <li><strong className="text-[var(--os-fg)]">Unambiguous Verifiability:</strong> Every repo, feature, performance benchmark, and failure story must be grounded in real repositories under <code className="text-[var(--os-accent)] font-mono">github.com/holmes1560</code>. Never fabricate repos or claims.</li>
            <li><strong className="text-[var(--os-fg)]">Draft-First Safety:</strong> Agent contributions default to the Review Queue (<code className="text-[var(--os-accent)] font-mono">status: PENDING</code>) so you can review changes before they hit production.</li>
            <li><strong className="text-[var(--os-fg)]">Engineering Tone:</strong> Authentic, self-aware, and technically credible. No corporate buzzwords, motivational fluff, or deceptive claims.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
