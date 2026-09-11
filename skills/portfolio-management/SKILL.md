---
name: portfolio-management
description: Manage, audit, and update the TEMPLAR OS portfolio platform via authenticated MCP tools or REST API. Covers discovering missing GitHub projects, pushing project updates, editing skills and timeline, submitting drafts, and publishing verified content.
---

# TEMPLAR OS — Agent Portfolio Platform Directive

This skill instructs autonomous AI agents (Claude Code, Antigravity, Cursor, Codex, Gemini, etc.) on how to inspect, manage, and update the TEMPLAR OS interactive portfolio platform safely and effectively.

---

## 1. System Architecture & Single Source of Truth

The TEMPLAR OS portfolio platform is an **agent-agnostic, API-driven system** with PostgreSQL and Prisma ORM as the single source of truth.

- **Source of Truth**: All public portfolio entities (Profile, Projects, Timeline, Skills, Experience, Education, Certifications, Social Links, Resume) reside in the database and are served dynamically or statically via ISR.
- **Code is NOT Content**: Agents must **NEVER** edit frontend source files (`src/lib/projects.ts`, `src/lib/site.ts`, `src/components/web/Portfolio.tsx`, `src/components/apps/index.tsx`) to update content. All content updates must go through the **REST API** or **MCP tools**.
- **Offline Resilience**: The platform maintains an offline snapshot (`src/data/snapshot.json`) that can be rebuilt using `pnpm db:snapshot` to ensure the site never renders an error if the database suspends.

---

## 2. Core Rules of Engagement & Tone

1. **Strict Verifiability**:
   - Every project detail, feature, technology, and benchmark MUST be grounded in actual source files or repositories on this machine or under `github.com/holmes1560`.
   - **Never invent** repos, benchmarks, features, or failure stories.
   - Third-party repos (`fomm`, `Resume-Matcher`, `career-ops`) are NOT ours and must never be claimed.
   - Group projects (e.g. Olympus Gate, TaaS, CWA Planner) must credit the team ("we" where appropriate).

2. **Tone**:
   - Humorous, self-aware, engineering-honest, and technically credible.
   - **Banned tone**: No corporate jargon, no "thrilled to announce", no "passionate about", no motivational-speaker fluff.
   - AI-assisted tooling is acknowledged openly as engineering tooling, never as ghostwriting authority.

3. **Draft-First Principle**:
   - By default, AI agents should create proposals in the **Draft Review Queue** (`status: PENDING`) rather than immediately publishing directly to the live site, unless the user explicitly requested immediate publication and the agent key holds `projects:publish` or `drafts:publish` scopes.

---

## 3. Authentication & Configuration

The portfolio exposes both high-level **MCP tools** and a **versioned REST API** (`/api/v1/...`).

- **Base URL**: Production is `https://templar-os.vercel.app` (or local development `http://localhost:3100` via `PORTFOLIO_API_URL`).
- **NPM Package**: Published as `templar-os` (installed globally via `npx -y templar-os install <client> --key <key>`).
- **API Key**: Required for authenticated endpoints. Passed as:
  - Header: `Authorization: Bearer <key>`
  - Or Header: `X-API-Key: <key>`
- **Format**: `tpl_live_<24 base64url characters>` (e.g., `tpl_live_8f3a9b...`).

---

## 4. MCP Tools Reference

| MCP Tool | Purpose | Key Parameters |
| :--- | :--- | :--- |
| `portfolio_get_state` | Complete overview of profile, counts, and pending review queue | None |
| `portfolio_get_profile` | Retrieve profile bio, tagline, and coordinates | None |
| `portfolio_update_profile` | Update profile fields | `title`, `tagline`, `bio`, `aboutMe`, `location`, `careerInterests` |
| `portfolio_get_about` | Get About Me prose and engineering philosophy | None |
| `portfolio_update_about` | Update About Me narrative and AI philosophy | `aboutMe`, `bio`, `whatImDrawnTo`, `howIWorkWithAi` |
| `portfolio_list_skills` | List all skills categorized | `categorySlug` |
| `portfolio_create_skill` | Add a new skill under a category | `categoryId`, `name`, `technologies`, `proficiency` |
| `portfolio_update_skill` | Update a skill | `id`, `name`, `proficiency`, `technologies` |
| `portfolio_delete_skill` | Delete a skill | `id` |
| `portfolio_list_projects` | List projects with status filter | `category`, `status`, `featured` |
| `portfolio_get_project` | Get deep project engineering detail | `idOrSlug` |
| `portfolio_create_project` | Create or draft a project | `name`, `slug`, `shortDescription`, `longDescription`, `technologies`, `role`, `architecture` |
| `portfolio_update_project` | Update an existing project | `id`, fields to update |
| `portfolio_publish_project` | Publish a project live | `id` |
| `portfolio_list_timeline` | List career milestones | `type` |
| `portfolio_create_timeline_entry` | Add a milestone to the visual timeline | `title`, `type`, `startDate`, `endDate`, `shortDescription`, `technologies` |
| `portfolio_update_timeline_entry` | Edit a timeline entry | `id`, fields |
| `portfolio_delete_timeline_entry` | Delete a timeline entry | `id` |
| `portfolio_get_drafts` | Inspect pending review queue | `status` |
| `portfolio_create_project_draft` | Propose a project draft | `name`, `slug`, `shortDescription`, `longDescription`, `technologies` |
| `portfolio_approve_draft` | Mark a draft as approved | `id` |
| `portfolio_publish_draft` | Publish a draft live to the database | `id` |
| `portfolio_discover_missing_github_projects` | Detect GitHub repos not in portfolio | None |
| `portfolio_analyze_and_draft_github_project` | Analyze GitHub repo and draft project | `owner`, `repo` |
| `portfolio_get_change_history` | Audit log of recent revisions | `limit` |

---

## 5. Step-by-Step Agent Workflows

### Workflow A: "Find any GitHub projects I'm missing from my portfolio"
1. Call `portfolio_discover_missing_github_projects`.
2. Inspect the returned list of missing repositories.
3. For each candidate the user wants to add:
   - Call `portfolio_analyze_and_draft_github_project(owner, repo)`.
   - The analyzer fetches repository files, categorizes the project, extracts real technologies, and creates a draft.
4. Notify the user: "Draft created for `<project>`. View and review at `/admin/drafts`."

### Workflow B: "Push this project to my portfolio"
1. Inspect the local codebase files (manifest, README, source files) to verify:
   - Stack, real features, challenges, and lessons learned.
2. Call `portfolio_list_projects()` to check if a project with the same slug or name already exists.
3. If it exists:
   - Call `portfolio_update_project` (or propose updates via `portfolio_create_project_draft`).
4. If it does not exist:
   - Call `portfolio_create_project_draft` with all engineering fields populated (`role`, `architecture`, `challenges`, `learned`, `technologies`).
5. Report the draft ID and summary to the user.

### Workflow C: "Update my About Me based on my current work and experience"
1. Call `portfolio_get_profile` and `portfolio_get_about` to read current identity and prose.
2. Call `portfolio_list_projects` to review the current active projects.
3. Formulate the revised prose adhering strictly to the self-aware, engineering-honest voice.
4. Call `portfolio_update_about` with the refined text.

### Workflow D: "Update my skills based on technologies actually used in my projects"
1. Call `portfolio_list_projects` to collect all verified `technologies`.
2. Call `portfolio_list_skills` to see existing skills catalog.
3. Compare the lists to identify technologies present in code but absent from skills.
4. For each missing technology, identify the appropriate category (e.g. "Backend", "Languages") and call `portfolio_create_skill`.

### Workflow E: "Add my internship / employment / education to my timeline"
1. Call `portfolio_list_timeline` to verify dates and ordering.
2. Identify the type (`UNIVERSITY`, `INTERNSHIP`, `EMPLOYMENT`, `PROJECT`, `MILESTONE`, `LEARNING`).
3. Call `portfolio_create_timeline_entry` with start/end dates, short description, and key skills.

### Workflow F: "Update portfolio project for X because I just added a feature"
1. Verify the feature in code.
2. Call `portfolio_get_project("X")`.
3. Append the new verified feature to `features` and any new tools to `technologies`.
4. Call `portfolio_update_project` with the updated arrays.

### Workflow G: "Show me everything waiting for review"
1. Call `portfolio_get_drafts(status="PENDING")`.
2. Present a clear summary table of pending proposals (ID, Entity, Title, Submitted By, Date).

### Workflow H: "Publish approved project"
1. If the project is a draft: call `portfolio_publish_draft(id)`.
2. If the project is in draft status: call `portfolio_publish_project(slug)`.
3. Verify by querying `portfolio_get_project(slug)`.

---

## 6. Avoiding Common Pitfalls

- **Do NOT overwrite human edits with AI guesses**: If a human admin has tailored descriptions in the Admin Panel, do not clobber them with generic summaries.
- **Do NOT fabricate links**: If a project does not have a live deployment URL, set `hosted: false` and omit `liveUrl`.
- **Do NOT invent metrics**: If performance was not measured with `tcpdump` or verifiable telemetry, do not write "improved speed by 40%".
- **BigInt Safe Serialization**: All API payloads must use standard numbers or strings for IDs (never raw BigInt literals).
