/**
 * The shape the OS renders. Deliberately free of Prisma imports so client
 * components can use these types without pulling the query engine into the
 * browser bundle, and so the snapshot fallback can be plain JSON.
 */

export type CategoryKey =
  | "web" | "mobile" | "cybersecurity" | "ai" | "hardware" | "experiments";

export const CATEGORY_LABEL: Record<CategoryKey, string> = {
  web: "Web Applications",
  mobile: "Mobile Applications",
  cybersecurity: "Cybersecurity",
  ai: "AI",
  hardware: "Hardware",
  experiments: "Experiments",
};

export type RepoVisibilityKey = "public" | "private" | "local";
export type LaunchModeKey = "iframe" | "external" | "internal" | "demo";

export interface PublicProject {
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: CategoryKey;
  period: string;
  team?: string;

  technologies: string[];
  skills: string[];
  features: string[];
  challenges: string[];
  learned: string[];

  visibility: RepoVisibilityKey;
  githubUrl?: string;
  /** only present when the project is actually hosted (§6) */
  demoUrl?: string;
  docsUrl?: string;
  /** true when a live application exists for it in IFRAME mode */
  embeddable: boolean;

  featured: boolean;
  clientWork: boolean;
  caveat?: string;
}

export interface PublicApp {
  /** stable routing key the OS switches on */
  appKey: string;
  name: string;
  icon: string;
  launchMode: LaunchModeKey;
  url?: string;
  workspace: number;
  cell: number;
  width: number;
  height: number;
  resizable: boolean;
  maximizable: boolean;
  minimizable: boolean;
  /** set when this application represents a project */
  projectSlug?: string;
}

export interface PortfolioData {
  projects: PublicProject[];
  apps: PublicApp[];
  settings: Record<string, string>;
  generatedAt: string;
  /** true when served from the committed snapshot because the DB was unreachable */
  stale?: boolean;
}
