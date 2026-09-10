export const dynamic = "force-dynamic";

export async function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "TEMPLAR OS Portfolio & Agent Platform API",
      version: "1.0.0",
      description:
        "Agent-agnostic REST API for managing the TEMPLAR OS portfolio, profile, projects, timeline, skills, experience, drafts, and revisions.",
      contact: {
        name: "TEMPLAR OS Engineering",
      },
    },
    servers: [
      { url: "http://localhost:3100", description: "Local development server" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "API Key in Authorization header, formatted: Bearer tpl_live_...",
        },
        ApiKeyHeader: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API Key in X-API-Key header",
        },
      },
      schemas: {
        PublicProfile: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            shortName: { type: "string" },
            title: { type: "string" },
            tagline: { type: "string" },
            bio: { type: "string" },
            aboutMe: { type: "string" },
            location: { type: "string" },
            availabilityStatus: { type: "string" },
            careerInterests: { type: "array", items: { type: "string" } },
            whatImDrawnTo: { type: "array", items: { type: "string" } },
            howIWorkWithAi: { type: "string" },
            avatarUrl: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            websiteUrl: { type: "string" },
            githubUrl: { type: "string" },
            linkedinUrl: { type: "string" },
          },
        },
        PublicProject: {
          type: "object",
          properties: {
            slug: { type: "string" },
            title: { type: "string" },
            summary: { type: "string" },
            description: { type: "string" },
            category: { type: "string", enum: ["web", "mobile", "cybersecurity", "ai", "hardware", "experiments"] },
            period: { type: "string" },
            team: { type: "string" },
            technologies: { type: "array", items: { type: "string" } },
            skills: { type: "array", items: { type: "string" } },
            features: { type: "array", items: { type: "string" } },
            challenges: { type: "array", items: { type: "string" } },
            learned: { type: "array", items: { type: "string" } },
            role: { type: "string" },
            architecture: { type: "string" },
            failedApproaches: { type: "array", items: { type: "string" } },
            problemSolutions: { type: "array", items: { type: "string" } },
            outcome: { type: "string" },
            visibility: { type: "string", enum: ["public", "private", "local"] },
            githubUrl: { type: "string" },
            demoUrl: { type: "string" },
            docsUrl: { type: "string" },
            featured: { type: "boolean" },
            clientWork: { type: "boolean" },
            caveat: { type: "string" },
          },
        },
        PublicTimelineEntry: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            type: {
              type: "string",
              enum: ["university", "internship", "employment", "project", "certification", "milestone", "learning"],
            },
            organization: { type: "string" },
            startDate: { type: "string" },
            endDate: { type: "string" },
            isCurrent: { type: "boolean" },
            shortDescription: { type: "string" },
            detailedDescription: { type: "string" },
            technologies: { type: "array", items: { type: "string" } },
            skills: { type: "array", items: { type: "string" } },
            relatedProjectIds: { type: "array", items: { type: "string" } },
            icon: { type: "string" },
            color: { type: "string" },
            order: { type: "integer" },
          },
        },
        Draft: {
          type: "object",
          properties: {
            id: { type: "string" },
            entityType: { type: "string" },
            entityId: { type: "string" },
            action: { type: "string", enum: ["CREATE", "UPDATE", "DELETE"] },
            title: { type: "string" },
            summary: { type: "string" },
            data: { type: "object" },
            status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "PUBLISHED"] },
            isAiGenerated: { type: "boolean" },
            aiOrigin: { type: "string" },
            reviewNotes: { type: "string" },
            createdAt: { type: "string" },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }, { ApiKeyHeader: [] }],
    paths: {
      "/api/v1/portfolio": {
        get: {
          summary: "Get complete aggregate portfolio",
          responses: {
            "200": {
              description: "Portfolio data",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/api/v1/profile": {
        get: { summary: "Get profile details", responses: { "200": { description: "Profile data" } } },
        put: { summary: "Update profile", responses: { "200": { description: "Updated profile" } } },
        patch: { summary: "Partially update profile", responses: { "200": { description: "Updated profile" } } },
      },
      "/api/v1/about": {
        get: { summary: "Get About Me prose", responses: { "200": { description: "About data" } } },
        put: { summary: "Update About Me prose", responses: { "200": { description: "Updated about" } } },
      },
      "/api/v1/skills": {
        get: { summary: "List skills grouped by category", responses: { "200": { description: "Skills list" } } },
        post: { summary: "Create new skill", responses: { "201": { description: "Created skill" } } },
      },
      "/api/v1/skills/{id}": {
        get: { summary: "Get skill detail", responses: { "200": { description: "Skill detail" } } },
        put: { summary: "Update skill", responses: { "200": { description: "Updated skill" } } },
        delete: { summary: "Delete skill", responses: { "200": { description: "Deleted" } } },
      },
      "/api/v1/projects": {
        get: { summary: "List projects", responses: { "200": { description: "Projects list" } } },
        post: { summary: "Create project or submit draft", responses: { "201": { description: "Created" } } },
      },
      "/api/v1/projects/{id}": {
        get: { summary: "Get project detail", responses: { "200": { description: "Project detail" } } },
        put: { summary: "Update project", responses: { "200": { description: "Updated" } } },
        delete: { summary: "Delete project", responses: { "200": { description: "Deleted" } } },
      },
      "/api/v1/projects/{id}/publish": {
        post: { summary: "Publish project", responses: { "200": { description: "Published" } } },
      },
      "/api/v1/projects/{id}/archive": {
        post: { summary: "Archive project", responses: { "200": { description: "Archived" } } },
      },
      "/api/v1/projects/{id}/duplicate": {
        post: { summary: "Duplicate project", responses: { "201": { description: "Duplicated" } } },
      },
      "/api/v1/timeline": {
        get: { summary: "List timeline milestones", responses: { "200": { description: "Timeline entries" } } },
        post: { summary: "Create timeline milestone", responses: { "201": { description: "Created" } } },
      },
      "/api/v1/timeline/{id}": {
        get: { summary: "Get timeline milestone", responses: { "200": { description: "Timeline detail" } } },
        put: { summary: "Update timeline milestone", responses: { "200": { description: "Updated" } } },
        delete: { summary: "Delete timeline milestone", responses: { "200": { description: "Deleted" } } },
      },
      "/api/v1/experience": {
        get: { summary: "List experience records", responses: { "200": { description: "Experience list" } } },
        post: { summary: "Create experience record", responses: { "201": { description: "Created" } } },
      },
      "/api/v1/education": {
        get: { summary: "List education records", responses: { "200": { description: "Education list" } } },
        post: { summary: "Create education record", responses: { "201": { description: "Created" } } },
      },
      "/api/v1/drafts": {
        get: { summary: "List pending drafts", responses: { "200": { description: "Drafts list" } } },
        post: { summary: "Submit new draft proposal", responses: { "201": { description: "Created draft" } } },
      },
      "/api/v1/drafts/{id}/approve": {
        post: { summary: "Approve draft", responses: { "200": { description: "Approved" } } },
      },
      "/api/v1/drafts/{id}/reject": {
        post: { summary: "Reject draft", responses: { "200": { description: "Rejected" } } },
      },
      "/api/v1/drafts/{id}/publish": {
        post: { summary: "Publish draft to live database", responses: { "200": { description: "Published" } } },
      },
      "/api/v1/revisions": {
        get: { summary: "List change history revisions", responses: { "200": { description: "Revisions list" } } },
      },
      "/api/v1/keys": {
        get: { summary: "List API keys", responses: { "200": { description: "Keys list" } } },
        post: { summary: "Create scoped API key", responses: { "201": { description: "Created key" } } },
      },
      "/api/v1/github/discover": {
        get: { summary: "Discover missing GitHub repositories", responses: { "200": { description: "Missing repos" } } },
        post: { summary: "Analyze repository and create draft", responses: { "200": { description: "Generated draft" } } },
      },
    },
  };

  return Response.json(spec, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
