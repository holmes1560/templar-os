#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { PortfolioApiClient } from "./client";

/**
 * High-Level Model Context Protocol (MCP) Server for TEMPLAR OS Portfolio (§6, §7).
 *
 * Exposes rich domain tools to any standard AI agent (Claude Code, Antigravity,
 * Cursor, Codex, Gemini, etc.) over stdio.
 *
 * All tools communicate with the authenticated REST API backend, ensuring
 * that validation, permission scopes, rate limits, and audit logs are consistently
 * enforced.
 */

const client = new PortfolioApiClient();

const server = new McpServer({
  name: "templar-os-portfolio-mcp",
  version: "1.0.0",
});

function formatResult(res: { ok: boolean; data?: unknown; error?: string; status?: number }) {
  if (!res.ok) {
    return {
      content: [
        {
          type: "text" as const,
          text: `[Error ${res.status || ""}] ${res.error || "Operation failed"}\n${
            res.data ? JSON.stringify(res.data, null, 2) : ""
          }`,
        },
      ],
      isError: true,
    };
  }
  return {
    content: [
      {
        type: "text" as const,
        text: typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2),
      },
    ],
  };
}

// ────────────────────── State & Overview ──────────────────────

server.tool(
  "portfolio_get_state",
  "Get the complete portfolio state (profile, counts of projects, timeline milestones, skills, and pending drafts).",
  {},
  async () => {
    const res = await client.getPortfolioState();
    return formatResult(res);
  }
);

// ────────────────────── Profile & About ──────────────────────

server.tool(
  "portfolio_get_profile",
  "Retrieve the public profile, bio, career interests, and contact coordinates.",
  {},
  async () => {
    const res = await client.getProfile();
    return formatResult(res);
  }
);

server.tool(
  "portfolio_update_profile",
  "Update fields on the public profile (title, tagline, bio, aboutMe, location, availabilityStatus, careerInterests, etc.).",
  {
    title: z.string().optional().describe("Professional title (e.g. Computer Science · KNUST)"),
    tagline: z.string().optional().describe("Single-sentence high-impact tagline"),
    bio: z.string().optional().describe("Short 1-2 sentence biographical summary"),
    aboutMe: z.string().optional().describe("Full markdown or multi-paragraph About Me description"),
    location: z.string().optional().describe("Current location"),
    availabilityStatus: z.string().optional().describe("Status (e.g. Open to opportunities)"),
    careerInterests: z.array(z.string()).optional().describe("List of engineering focus areas"),
    whatImDrawnTo: z.array(z.string()).optional().describe("List of core engineering principles"),
    howIWorkWithAi: z.string().optional().describe("Honest disclosure of how AI tooling is leveraged"),
  },
  async (args) => {
    const res = await client.updateProfile(args);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_get_about",
  "Retrieve the About Me section, including learning through-line, AI philosophy, and what Asenso is drawn to.",
  {},
  async () => {
    const res = await client.getAbout();
    return formatResult(res);
  }
);

server.tool(
  "portfolio_update_about",
  "Update the About Me narrative prose and engineering philosophy.",
  {
    aboutMe: z.string().optional().describe("The primary About Me prose"),
    bio: z.string().optional().describe("Short bio summary"),
    whatImDrawnTo: z.array(z.string()).optional().describe("Key engineering interests and design values"),
    howIWorkWithAi: z.string().optional().describe("How AI is used as an engineering tool"),
  },
  async (args) => {
    const res = await client.updateAbout(args);
    return formatResult(res);
  }
);

// ────────────────────────── Skills ──────────────────────────

server.tool(
  "portfolio_list_skills",
  "List all skills grouped by category (Languages, Frontend, Backend, Mobile, Databases, Embedded, Security, etc.).",
  {
    categorySlug: z.string().optional().describe("Optional filter by category slug (e.g. 'languages', 'backend')"),
  },
  async ({ categorySlug }) => {
    const res = await client.listSkills(categorySlug);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_create_skill",
  "Add a new skill under an existing category with associated technology tags.",
  {
    categoryId: z.string().describe("Category ID where this skill belongs"),
    name: z.string().describe("Skill name (e.g. 'PostgreSQL', 'ESP32')"),
    description: z.string().optional().describe("Brief note on experience with this skill"),
    proficiency: z.number().int().min(0).max(100).optional().describe("Proficiency percentage (0-100)"),
    technologies: z.array(z.string()).optional().describe("Associated framework/tool names"),
    featured: z.boolean().optional().describe("Whether to feature this skill prominently"),
  },
  async (args) => {
    const res = await client.createSkill(args);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_update_skill",
  "Update an existing skill's details, proficiency, or category.",
  {
    id: z.string().describe("The ID of the skill to update"),
    name: z.string().optional(),
    description: z.string().optional(),
    proficiency: z.number().int().min(0).max(100).optional(),
    technologies: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    visible: z.boolean().optional(),
  },
  async ({ id, ...data }) => {
    const res = await client.updateSkill(id, data);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_delete_skill",
  "Delete a skill from the portfolio.",
  {
    id: z.string().describe("The ID of the skill to remove"),
  },
  async ({ id }) => {
    const res = await client.deleteSkill(id);
    return formatResult(res);
  }
);

// ───────────────────────── Projects ─────────────────────────

server.tool(
  "portfolio_list_projects",
  "List portfolio projects with optional filters by category, status, or featured flag.",
  {
    category: z.enum(["WEB", "MOBILE", "CYBERSECURITY", "AI", "HARDWARE", "EXPERIMENTS"]).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    featured: z.boolean().optional(),
  },
  async (filters) => {
    const res = await client.listProjects(filters);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_get_project",
  "Retrieve a project by its slug or ID, including full engineering details, challenges, and lessons learned.",
  {
    idOrSlug: z.string().describe("The unique slug (e.g. 'taas', 'olympus-gate') or CUID of the project"),
  },
  async ({ idOrSlug }) => {
    const res = await client.getProject(idOrSlug);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_create_project",
  "Create a project directly or create a DRAFT if the API key lacks publisher rights.",
  {
    name: z.string().describe("Project title"),
    slug: z.string().describe("URL-safe slug (lowercase letters, numbers, hyphens)"),
    shortDescription: z.string().describe("Single-sentence factual overview"),
    longDescription: z.string().describe("Detailed architectural and feature overview"),
    category: z.enum(["WEB", "MOBILE", "CYBERSECURITY", "AI", "HARDWARE", "EXPERIMENTS"]),
    period: z.string().optional().describe("When it was built (e.g. '2026 · Year 3 Sem 2')"),
    team: z.string().optional().describe("Team or group credit where applicable (e.g. 'Group 16, KNUST')"),
    githubUrl: z.string().optional().describe("Public or internal GitHub repo URL"),
    liveUrl: z.string().optional().describe("Live deployment URL if applicable"),
    technologies: z.array(z.string()).optional().describe("List of verified technologies used"),
    features: z.array(z.string()).optional().describe("Key verified technical features"),
    challenges: z.array(z.string()).optional().describe("Actual engineering challenges encountered"),
    learned: z.array(z.string()).optional().describe("Key lessons and takeaways"),
    role: z.string().optional().describe("Specific contribution and role in the project"),
    architecture: z.string().optional().describe("System architecture summary"),
    failedApproaches: z.array(z.string()).optional().describe("Approaches that were tried and discarded"),
    problemSolutions: z.array(z.string()).optional().describe("How specific technical hurdles were solved"),
    outcome: z.string().optional().describe("Real outcome or metrics achieved"),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional().default("DRAFT"),
  },
  async (args) => {
    const res = await client.createProject(args);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_update_project",
  "Update an existing project's fields, engineering lessons, or status.",
  {
    id: z.string().describe("Project ID or slug"),
    name: z.string().optional(),
    shortDescription: z.string().optional(),
    longDescription: z.string().optional(),
    category: z.enum(["WEB", "MOBILE", "CYBERSECURITY", "AI", "HARDWARE", "EXPERIMENTS"]).optional(),
    period: z.string().optional(),
    team: z.string().optional(),
    githubUrl: z.string().optional(),
    liveUrl: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    challenges: z.array(z.string()).optional(),
    learned: z.array(z.string()).optional(),
    role: z.string().optional(),
    architecture: z.string().optional(),
    failedApproaches: z.array(z.string()).optional(),
    problemSolutions: z.array(z.string()).optional(),
    outcome: z.string().optional(),
    featured: z.boolean().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  },
  async ({ id, ...data }) => {
    const res = await client.updateProject(id, data);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_publish_project",
  "Mark a project as PUBLISHED so it renders immediately on the public website and in the OS window manager.",
  {
    id: z.string().describe("Project ID or slug to publish"),
  },
  async ({ id }) => {
    const res = await client.publishProject(id);
    return formatResult(res);
  }
);

// ───────────────────────── Timeline ─────────────────────────

server.tool(
  "portfolio_list_timeline",
  "List career/learning timeline milestones in chronological order.",
  {
    type: z.enum([
      "UNIVERSITY",
      "INTERNSHIP",
      "EMPLOYMENT",
      "PROJECT",
      "CERTIFICATION",
      "MILESTONE",
      "LEARNING",
    ]).optional().describe("Filter by milestone type"),
  },
  async ({ type }) => {
    const res = await client.listTimeline(type);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_create_timeline_entry",
  "Add a new milestone or period to the visual career timeline.",
  {
    title: z.string().describe("Milestone title (e.g. 'Internship at X', 'Built P2P Escrow')"),
    type: z.enum([
      "UNIVERSITY",
      "INTERNSHIP",
      "EMPLOYMENT",
      "PROJECT",
      "CERTIFICATION",
      "MILESTONE",
      "LEARNING",
    ]).describe("Category of milestone"),
    organization: z.string().optional().describe("Associated organization, university, or company"),
    startDate: z.string().describe("Start date (e.g. 'Oct 2025' or '2024')"),
    endDate: z.string().optional().describe("End date, or leave empty if current/ongoing"),
    isCurrent: z.boolean().optional().default(false).describe("Whether this is an ongoing activity"),
    shortDescription: z.string().describe("One or two sentence summary"),
    detailedDescription: z.string().optional().describe("Detailed breakdown of responsibilities/learning"),
    technologies: z.array(z.string()).optional().describe("Key technologies used during this period"),
    skills: z.array(z.string()).optional().describe("Key skills developed"),
    icon: z.string().optional().default("milestone").describe("Icon name (academic, briefcase, code, mobile, etc.)"),
    order: z.number().int().optional().default(0).describe("Sort order"),
  },
  async (args) => {
    const res = await client.createTimelineEntry(args);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_update_timeline_entry",
  "Update an existing timeline entry.",
  {
    id: z.string().describe("The ID of the timeline entry"),
    title: z.string().optional(),
    type: z.enum([
      "UNIVERSITY",
      "INTERNSHIP",
      "EMPLOYMENT",
      "PROJECT",
      "CERTIFICATION",
      "MILESTONE",
      "LEARNING",
    ]).optional(),
    organization: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isCurrent: z.boolean().optional(),
    shortDescription: z.string().optional(),
    detailedDescription: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    order: z.number().int().optional(),
  },
  async ({ id, ...data }) => {
    const res = await client.updateTimelineEntry(id, data);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_delete_timeline_entry",
  "Remove an entry from the timeline.",
  {
    id: z.string().describe("Timeline entry ID to delete"),
  },
  async ({ id }) => {
    const res = await client.deleteTimelineEntry(id);
    return formatResult(res);
  }
);

// ──────────────────── Drafts & Review Queue ───────────────────

server.tool(
  "portfolio_get_drafts",
  "Inspect all items currently waiting in the Review Queue (status: PENDING, APPROVED, etc.).",
  {
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "PUBLISHED"]).optional().default("PENDING"),
  },
  async ({ status }) => {
    const res = await client.listDrafts(status);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_create_project_draft",
  "Propose a new project as a DRAFT for human review in the Admin Panel without immediately publishing.",
  {
    name: z.string().describe("Project name"),
    slug: z.string().describe("Slug"),
    shortDescription: z.string().describe("Single-sentence summary"),
    longDescription: z.string().describe("Detailed description"),
    category: z.enum(["WEB", "MOBILE", "CYBERSECURITY", "AI", "HARDWARE", "EXPERIMENTS"]),
    technologies: z.array(z.string()).describe("Technologies used"),
    features: z.array(z.string()).optional(),
    challenges: z.array(z.string()).optional(),
    learned: z.array(z.string()).optional(),
    role: z.string().optional(),
    architecture: z.string().optional(),
    failedApproaches: z.array(z.string()).optional(),
    problemSolutions: z.array(z.string()).optional(),
    outcome: z.string().optional(),
    githubUrl: z.string().optional(),
    liveUrl: z.string().optional(),
    aiOrigin: z.string().optional().describe("Description of agent or source (e.g. 'Analyzed local repo')"),
  },
  async (data) => {
    const res = await client.createDraft({
      entityType: "project",
      action: "CREATE",
      title: data.name,
      summary: data.shortDescription,
      data,
      isAiGenerated: true,
      aiOrigin: data.aiOrigin || "AI Agent",
    });
    return formatResult(res);
  }
);

server.tool(
  "portfolio_approve_draft",
  "Approve a pending draft in the review queue.",
  {
    id: z.string().describe("Draft ID to approve"),
  },
  async ({ id }) => {
    const res = await client.approveDraft(id);
    return formatResult(res);
  }
);

server.tool(
  "portfolio_publish_draft",
  "Publish an approved draft, committing the changes directly to the live portfolio database.",
  {
    id: z.string().describe("Draft ID to publish"),
  },
  async ({ id }) => {
    const res = await client.publishDraft(id);
    return formatResult(res);
  }
);

// ──────────────────── GitHub Automated Discovery ──────────────────

server.tool(
  "portfolio_discover_missing_github_projects",
  "Discover accessible repositories on the user's GitHub that do not yet exist in the portfolio.",
  {},
  async () => {
    const res = await client.discoverMissingGitHubProjects();
    return formatResult(res);
  }
);

server.tool(
  "portfolio_analyze_and_draft_github_project",
  "Fetch files from an authorized GitHub repo, analyze with multi-provider AI, and create a portfolio DRAFT.",
  {
    owner: z.string().describe("Repository owner (e.g. 'holmes1560')"),
    repo: z.string().describe("Repository name (e.g. 'RFID_Door_lock')"),
  },
  async ({ owner, repo }) => {
    const res = await client.analyzeAndDraftGitHubProject(owner, repo);
    return formatResult(res);
  }
);

// ────────────────────── Change History ──────────────────────

server.tool(
  "portfolio_get_change_history",
  "Retrieve recent revisions and audit history to verify what was changed and by whom.",
  {
    limit: z.number().int().min(1).max(50).optional().default(20),
  },
  async ({ limit }) => {
    const res = await client.getChangeHistory(limit);
    return formatResult(res);
  }
);

// ────────────────────────── Startup ──────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TEMPLAR OS MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting TEMPLAR OS MCP Server:", err);
  process.exit(1);
});
