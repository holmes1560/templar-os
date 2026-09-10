# TEMPLAR OS — Interactive Portfolio Operating System & Agent Platform

> An OS-inspired interactive engineering portfolio and autonomous AI agent CMS built with Next.js 15 App Router, Prisma ORM, PostgreSQL (Neon), and the Model Context Protocol (MCP).

---

## Overview

**TEMPLAR OS** transforms the traditional static portfolio into a fully interactive retro-modern desktop environment with window chrome, dock, scanlines, CRT effects, and deep project inspectability.

Beyond the UI, TEMPLAR OS is an **API-driven, agent-agnostic platform**. Content is no longer hardcoded into source files — every project, skill, timeline milestone, and engineering case study is dynamically managed via:
1. **Authenticated REST APIs** (`/api/v1/...`)
2. **Model Context Protocol (MCP) Server** with 25 domain tools
3. **Draft Review Queue** for AI agents (Claude, Cursor, Antigravity, ChatGPT)
4. **Admin Dashboard** (`/admin`) for human editorial control and API key management
5. **Offline Snapshot Fallback** (`src/data/snapshot.json`) ensuring 100% uptime even if the database is asleep

---

## Features

- **Interactive Desktop Window Manager**: Move, minimize, maximize, and focus multiple project windows, timeline explorer, terminal, system monitor, and settings.
- **Career Timeline App**: Structured visual milestones covering university research, internships, hardware projects, and engineering achievements.
- **AI Agent Platform & MCP**: Standard `@modelcontextprotocol/sdk` stdio server exposing 25 tools for inspecting state, drafting case studies, discovering GitHub repos, and managing timeline entries.
- **Strict Verifiability & Draft-First Principle**: Autonomous agents submit updates to a visual review queue (`PENDING`) with diff inspection before anything hits the live site.
- **Multi-Model Analyzer**: Automatically scans GitHub repositories and extracts architecture diagrams, failure stories, and engineering takeaways using Gemini or Claude.
- **Dual Cloud Ready**: Pre-configured for serverless edge deployment on **Vercel** with **Neon Serverless PostgreSQL**, plus container standby on **Render**.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript (strict mode, zero untyped `any`)
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS + Lucide Icons + Custom Scanline Shaders
- **Agent Protocols**: Model Context Protocol (MCP), OpenAPI v3
- **Security**: Argon2id/Scrypt password hashing, SHA-256 scoped API keys, secure HttpOnly session cookies

---

## Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/holmes1560/templar-os.git
cd templar-os
pnpm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and configure your database:
```bash
cp .env.example .env
```

### 3. Database Migration & Seed
```bash
pnpm db:migrate
pnpm db:seed
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3100](http://localhost:3100) to view the OS desktop environment.
Access the admin portal at [http://localhost:3100/admin](http://localhost:3100/admin).

---

## AI Agent Integration (MCP & Skills)

TEMPLAR OS can be controlled directly by your AI coding agents:

### Model Context Protocol (MCP) Configuration
Add the server to your agent's MCP settings (`claude_desktop_config.json`, `~/.claude.json`, `.cursor/mcp.json`, or `~/.gemini/config/mcp_config.json`):

```json
{
  "mcpServers": {
    "templar-portfolio": {
      "command": "npx",
      "args": ["-y", "tsx", "src/mcp/server.ts"],
      "env": {
        "PORTFOLIO_API_URL": "https://your-domain.vercel.app",
        "PORTFOLIO_API_KEY": "tpl_live_your_key_here"
      }
    }
  }
}
```

### Agent Skill
Provide `skills/portfolio-management/SKILL.md` to your agent. It defines the operational runbook, verifiability rules, and standard workflows for project audits, draft submissions, and timeline updates.

### One-Command CLI
```bash
pnpm cli status
pnpm cli projects list
pnpm cli drafts list
```

---

## Deployment

### Deploy to Vercel (Recommended)
1. Push this repository to your GitHub account.
2. Import the project into [Vercel](https://vercel.com/new).
3. Set the required Environment Variables:
   - `DATABASE_URL`: Neon PostgreSQL pooled connection string
   - `DIRECT_URL`: Neon direct connection string
   - `ADMIN_SESSION_SECRET`: Random 64-char string
   - `AUTH_SECRET`: Random 32-char string
   - `ENCRYPTION_KEY`: Random 32-char string
   - `PORTFOLIO_API_URL`: Your Vercel deployment URL
4. Deploy!

### Deploy to Render
Using the included `render.yaml`:
```bash
render blueprints launch
```

---

## License

MIT © [Asenso Owusu Ansah](https://github.com/holmes1560)
