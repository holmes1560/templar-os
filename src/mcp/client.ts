/**
 * Authenticated HTTP client that connects the MCP server to the Portfolio REST API.
 * Ensures that external AI agents go through the exact same authentication,
 * validation, rate limiting, and revision tracking as any REST client.
 */

export interface PortfolioApiClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export class PortfolioApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config?: Partial<PortfolioApiClientConfig>) {
    this.baseUrl = (
      config?.baseUrl ||
      process.env.PORTFOLIO_API_URL ||
      "http://localhost:3100"
    ).replace(/\/$/, "");
    this.apiKey = config?.apiKey || process.env.PORTFOLIO_API_KEY;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, "");
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
      headers["X-API-Key"] = this.apiKey;
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = res.headers.get("content-type") || "";
      let json: any = null;
      if (contentType.includes("application/json")) {
        json = await res.json();
      } else {
        const text = await res.text();
        return {
          ok: res.ok,
          status: res.status,
          error: res.ok ? undefined : text || `HTTP status ${res.status}`,
          data: (res.ok ? text : undefined) as any,
        };
      }

      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          error: json?.error || json?.message || `HTTP error ${res.status}`,
          data: json,
        };
      }

      return {
        ok: true,
        status: res.status,
        data: json?.data !== undefined ? json.data : json,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to Portfolio API";
      return {
        ok: false,
        status: 0,
        error: `${msg} (target: ${url})`,
      };
    }
  }

  // --- Portfolio & Overview ---
  getPortfolioState() {
    return this.request("/api/v1/portfolio");
  }

  // --- Profile & About ---
  getProfile() {
    return this.request("/api/v1/profile");
  }

  updateProfile(data: Record<string, unknown>) {
    return this.request("/api/v1/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  getAbout() {
    return this.request("/api/v1/about");
  }

  updateAbout(data: Record<string, unknown>) {
    return this.request("/api/v1/about", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // --- Skills ---
  listSkills(categorySlug?: string) {
    const q = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : "";
    return this.request(`/api/v1/skills${q}`);
  }

  createSkill(data: Record<string, unknown>) {
    return this.request("/api/v1/skills", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateSkill(id: string, data: Record<string, unknown>) {
    return this.request(`/api/v1/skills/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteSkill(id: string) {
    return this.request(`/api/v1/skills/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  // --- Projects ---
  listProjects(filters?: { category?: string; status?: string; featured?: boolean }) {
    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.featured !== undefined) params.set("featured", String(filters.featured));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/api/v1/projects${qs}`);
  }

  getProject(idOrSlug: string) {
    return this.request(`/api/v1/projects/${encodeURIComponent(idOrSlug)}`);
  }

  createProject(data: Record<string, unknown>) {
    return this.request("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateProject(id: string, data: Record<string, unknown>) {
    return this.request(`/api/v1/projects/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteProject(id: string) {
    return this.request(`/api/v1/projects/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  publishProject(id: string) {
    return this.request(`/api/v1/projects/${encodeURIComponent(id)}/publish`, {
      method: "POST",
    });
  }

  // --- Timeline ---
  listTimeline(type?: string) {
    const q = type ? `?type=${encodeURIComponent(type)}` : "";
    return this.request(`/api/v1/timeline${q}`);
  }

  createTimelineEntry(data: Record<string, unknown>) {
    return this.request("/api/v1/timeline", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateTimelineEntry(id: string, data: Record<string, unknown>) {
    return this.request(`/api/v1/timeline/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteTimelineEntry(id: string) {
    return this.request(`/api/v1/timeline/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  // --- Experience & Education ---
  listExperience() {
    return this.request("/api/v1/experience");
  }

  createExperience(data: Record<string, unknown>) {
    return this.request("/api/v1/experience", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateExperience(id: string, data: Record<string, unknown>) {
    return this.request(`/api/v1/experience/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  listEducation() {
    return this.request("/api/v1/education");
  }

  createEducation(data: Record<string, unknown>) {
    return this.request("/api/v1/education", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateEducation(id: string, data: Record<string, unknown>) {
    return this.request(`/api/v1/education/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // --- Certifications & Achievements ---
  listCertifications() {
    return this.request("/api/v1/certifications");
  }

  createCertification(data: Record<string, unknown>) {
    return this.request("/api/v1/certifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  listAchievements() {
    return this.request("/api/v1/achievements");
  }

  createAchievement(data: Record<string, unknown>) {
    return this.request("/api/v1/achievements", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Resume ---
  getResume() {
    return this.request("/api/v1/resume");
  }

  updateResume(data: { version: string; fileName: string; filePath: string }) {
    return this.request("/api/v1/resume", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Contact & Socials ---
  getContact() {
    return this.request("/api/v1/contact");
  }

  updateContact(data: Record<string, unknown>) {
    return this.request("/api/v1/contact", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  getSocialLinks() {
    return this.request("/api/v1/social-links");
  }

  createSocialLink(data: Record<string, unknown>) {
    return this.request("/api/v1/social-links", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Drafts & Revisions ---
  listDrafts(status?: string) {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request(`/api/v1/drafts${q}`);
  }

  createDraft(data: Record<string, unknown>) {
    return this.request("/api/v1/drafts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  approveDraft(id: string) {
    return this.request(`/api/v1/drafts/${encodeURIComponent(id)}/approve`, {
      method: "POST",
    });
  }

  publishDraft(id: string) {
    return this.request(`/api/v1/drafts/${encodeURIComponent(id)}/publish`, {
      method: "POST",
    });
  }

  rejectDraft(id: string, reviewNotes?: string) {
    return this.request(`/api/v1/drafts/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      body: JSON.stringify({ reviewNotes }),
    });
  }

  getChangeHistory(limit = 25) {
    return this.request(`/api/v1/revisions?limit=${limit}`);
  }

  // --- GitHub Ingestion ---
  discoverMissingGitHubProjects() {
    return this.request("/api/v1/github/discover");
  }

  analyzeAndDraftGitHubProject(owner: string, repo: string) {
    return this.request("/api/v1/github/discover", {
      method: "POST",
      body: JSON.stringify({ owner, repo, createDraft: true }),
    });
  }
}
