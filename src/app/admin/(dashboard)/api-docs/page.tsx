import Link from "next/link";
import { requireAdmin } from "@/server/auth";

export default async function AdminApiDocsPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">
          API & MCP Integration Hub
        </h1>
        <p className="text-sm text-[var(--os-fg-muted)]">
          Complete specifications, agent skills, and connection guides for integrating AI coding assistants and automation workflows.
        </p>
      </div>

      {/* ── 1. REST API Specification ── */}
      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
        <div className="flex items-center justify-between border-b border-[var(--os-line)] pb-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--os-fg)]">1. Versioned REST API (v1)</h2>
            <p className="text-xs text-[var(--os-fg-muted)]">Base URL: <code className="text-[var(--os-fg)]">/api/v1</code></p>
          </div>
          <Link
            href="/api/v1/openapi.json"
            target="_blank"
            className="pressable rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-3 py-1 text-xs text-[var(--os-accent)] hover:bg-[var(--os-surface-2)]"
          >
            OpenAPI 3.1 JSON ↗
          </Link>
        </div>

        <div className="mt-4 space-y-3">
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
                  <th className="py-2 pr-4">Required Scope</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--os-line)] text-[var(--os-fg-muted)]">
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-ok)]">GET</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/portfolio</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">portfolio:read</td>
                  <td className="py-2">Aggregate snapshot of full portfolio</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-ok)]">GET</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/profile</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">profile:read</td>
                  <td className="py-2">Bio, tagline, social links, contact info</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-warn)]">PUT</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/profile</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">profile:write</td>
                  <td className="py-2">Update profile (with audit revision)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-ok)]">GET</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/projects</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">projects:read</td>
                  <td className="py-2">List all published engineering projects</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-accent)]">POST</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/projects</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">projects:create</td>
                  <td className="py-2">Create project (or queue draft for review)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-ok)]">GET</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/timeline</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">timeline:read</td>
                  <td className="py-2">List career transitions & milestones</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-ok)]">GET</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/drafts</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">drafts:read</td>
                  <td className="py-2">Review Queue for pending agent proposals</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--os-accent)]">POST</td>
                  <td className="py-2 pr-4 text-[var(--os-fg)]">/api/v1/github/discover</td>
                  <td className="py-2 pr-4 text-[var(--os-fg-faint)]">github:sync</td>
                  <td className="py-2">Audit GitHub and generate draft proposals</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 2. MCP Server Configuration ── */}
      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
        <h2 className="text-sm font-semibold text-[var(--os-fg)]">2. Model Context Protocol (MCP) Server</h2>
        <p className="mt-1 text-xs text-[var(--os-fg-muted)]">
          Connects autonomous AI agents over stdio using the standard <code className="text-[var(--os-fg)]">@modelcontextprotocol/sdk</code>.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-[var(--os-fg)] mb-1">Configuration Snippet:</h3>
            <pre className="overflow-x-auto rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3 font-mono text-[0.7rem] text-[var(--os-fg-muted)]">
{`{
  "mcpServers": {
    "templar-portfolio": {
      "command": "tsx",
      "args": ["${process.cwd()}/src/mcp/server.ts"],
      "env": {
        "PORTFOLIO_API_URL": "http://localhost:3100",
        "PORTFOLIO_API_KEY": "tpl_live_..."
      }
    }
  }
}`}
            </pre>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[var(--os-fg)] mb-1">Exposed MCP Tools:</h3>
            <div className="grid gap-2 sm:grid-cols-2 font-mono text-xs">
              <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] p-2.5 bg-[var(--os-surface-2)]">
                <span className="text-[var(--os-accent)]">portfolio_get_state</span>
                <p className="text-[0.65rem] text-[var(--os-fg-muted)] mt-0.5">Read full profile, projects, and skills.</p>
              </div>
              <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] p-2.5 bg-[var(--os-surface-2)]">
                <span className="text-[var(--os-accent)]">portfolio_list_projects</span>
                <p className="text-[0.65rem] text-[var(--os-fg-muted)] mt-0.5">Filter by category or keyword.</p>
              </div>
              <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] p-2.5 bg-[var(--os-surface-2)]">
                <span className="text-[var(--os-accent)]">portfolio_create_project_draft</span>
                <p className="text-[0.65rem] text-[var(--os-fg-muted)] mt-0.5">Submit new project proposal to review queue.</p>
              </div>
              <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] p-2.5 bg-[var(--os-surface-2)]">
                <span className="text-[var(--os-accent)]">portfolio_publish_draft</span>
                <p className="text-[0.65rem] text-[var(--os-fg-muted)] mt-0.5">Publish approved draft into production.</p>
              </div>
              <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] p-2.5 bg-[var(--os-surface-2)]">
                <span className="text-[var(--os-accent)]">portfolio_discover_missing_github_projects</span>
                <p className="text-[0.65rem] text-[var(--os-fg-muted)] mt-0.5">Scan GitHub repos and propose showcase entries.</p>
              </div>
              <div className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] p-2.5 bg-[var(--os-surface-2)]">
                <span className="text-[var(--os-accent)]">portfolio_rollback_revision</span>
                <p className="text-[0.65rem] text-[var(--os-fg-muted)] mt-0.5">Restore previous snapshot from audit log.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Agent Skill ── */}
      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
        <h2 className="text-sm font-semibold text-[var(--os-fg)]">3. Standard Agent Skill</h2>
        <p className="mt-1 text-xs text-[var(--os-fg-muted)]">
          The skill at <code className="text-[var(--os-fg)]">skills/portfolio-management/SKILL.md</code> guides any agent on the engineering standards, ground rules, tone, and step-by-step workflows for managing this platform.
        </p>

        <div className="mt-4 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-3 text-xs space-y-2">
          <p className="font-semibold text-[var(--os-fg)]">Key Principles for AI Agents:</p>
          <ul className="list-disc pl-4 space-y-1 text-[var(--os-fg-muted)]">
            <li><strong className="text-[var(--os-fg)]">Unambiguous Verifiability:</strong> Every repo, feature, and benchmark must exist in local code or at github.com/holmes1560.</li>
            <li><strong className="text-[var(--os-fg)]">Review Queue Default:</strong> Agents submit proposals to the Review Queue as Drafts. Only publish directly with explicit user approval.</li>
            <li><strong className="text-[var(--os-fg)]">Snapshot Freshness:</strong> After making database modifications, always run <code className="text-[var(--os-fg)]">pnpm db:snapshot</code> to refresh offline fallback data.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
