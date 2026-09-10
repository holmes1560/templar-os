/**
 * The shape the OS and public web view render. Deliberately free of Prisma imports
 * so client components can use these types without pulling the query engine into
 * the browser bundle, and so the snapshot fallback can be plain JSON.
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

  // Engineering experience & lessons learned (§13)
  role?: string;
  architecture?: string;
  failedApproaches?: string[];
  problemSolutions?: string[];
  outcome?: string;
  order?: number;

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

export interface PublicProfile {
  fullName: string;
  shortName: string;
  title: string;
  tagline: string;
  bio: string;
  aboutMe: string;
  location: string;
  availabilityStatus: string;
  careerInterests: string[];
  whatImDrawnTo: string[];
  howIWorkWithAi?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  websiteUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
}

export interface PublicSkill {
  id: string;
  name: string;
  description?: string;
  proficiency?: number;
  technologies: string[];
  order: number;
  featured: boolean;
  projectCount?: number;
}

export interface PublicSkillCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  skills: PublicSkill[];
}

export type TimelineTypeKey =
  | "university"
  | "internship"
  | "employment"
  | "project"
  | "certification"
  | "milestone"
  | "learning";

export const TIMELINE_TYPE_LABEL: Record<TimelineTypeKey, string> = {
  university: "University",
  internship: "Internship",
  employment: "Employment",
  project: "Major Project",
  certification: "Certification",
  milestone: "Milestone",
  learning: "Learning Track",
};

export interface PublicTimelineEntry {
  id: string;
  title: string;
  type: TimelineTypeKey;
  organization?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  shortDescription: string;
  detailedDescription?: string;
  technologies: string[];
  skills: string[];
  relatedProjectIds: string[];
  icon: string;
  color?: string;
  order: number;
}

export interface PublicExperience {
  id: string;
  organization: string;
  role: string;
  employmentType?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  order: number;
}

export interface PublicEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  achievements: string[];
  order: number;
}

export interface PublicCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
  credentialId?: string;
  description?: string;
  order: number;
}

export interface PublicAchievement {
  id: string;
  title: string;
  description: string;
  date?: string;
  organization?: string;
  linkUrl?: string;
  order: number;
}

export interface PublicSocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  username?: string;
  icon: string;
  order: number;
}

export interface PublicResume {
  version: string;
  fileName: string;
  downloadUrl: string;
  fileSize?: number;
  uploadedAt: string;
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
  profile: PublicProfile;
  projects: PublicProject[];
  skills: PublicSkillCategory[];
  timeline: PublicTimelineEntry[];
  experience: PublicExperience[];
  education: PublicEducation[];
  certifications: PublicCertification[];
  achievements: PublicAchievement[];
  socialLinks: PublicSocialLink[];
  resume?: PublicResume;
  apps: PublicApp[];
  settings: Record<string, string>;
  generatedAt: string;
  /** true when served from the committed snapshot because the DB was unreachable */
  stale?: boolean;
}
