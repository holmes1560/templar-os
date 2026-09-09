export type Category =
  | "web"
  | "mobile"
  | "cybersecurity"
  | "ai"
  | "hardware"
  | "experiments";

export const CATEGORY_LABEL: Record<Category, string> = {
  web: "Web Applications",
  mobile: "Mobile Applications",
  cybersecurity: "Cybersecurity",
  ai: "AI",
  hardware: "Hardware",
  experiments: "Experiments",
};

/**
 * Where the source actually lives. The UI reads this and simply does not
 * render a repository link that would 404 or hit a private repo — §16 says
 * connect to real work, which also means never faking a link.
 */
export type Visibility =
  | "public" // real, public repo — link it
  | "private" // repo exists but is private — say so, don't link
  | "local"; // never pushed — mention it, no link

export interface Project {
  slug: string;
  title: string;
  /** one line, shown in list rows */
  summary: string;
  /** full prose, shown in the detail pane */
  description: string;
  category: Category;
  /** e.g. "2026" or "Jun–Sep 2025" — display only, never parsed */
  period: string;
  technologies: string[];
  /** what the project demonstrates — drives the Skills app cross-reference */
  skills: string[];
  features: string[];
  /** the honest bit: what fought back */
  challenges: string[];
  learned: string[];

  visibility: Visibility;
  githubUrl?: string;
  demoUrl?: string;
  docsUrl?: string;

  /**
   * Whether `demoUrl` can be framed inside an OS window. Only true once the
   * deployment actually permits it — the embedded site decides, via
   * `Content-Security-Policy: frame-ancestors`, and no amount of parent-side
   * code can override a refusal. Leave false and the UI offers a real tab
   * instead of a window that would render blank.
   */
  embeddable?: boolean;

  /** paths under /public. Empty until real screenshots are captured. */
  images: { src: string; alt: string }[];

  featured: boolean;

  /** group project — the UI credits the team rather than implying solo work */
  team?: string;
  /** built for someone else; gated behind their permission before publishing */
  clientWork?: boolean;
  /** shown as a caveat chip, e.g. hardware never fully exercised */
  caveat?: string;
}

export interface AppDef {
  id: string;
  title: string;
  icon: string;
  /** which workspace this app's icon sits on */
  workspace: number;
  /** preferred window size; ignored on mobile where windows are sheets */
  size: { w: number; h: number };
  /** opens an external URL instead of a window */
  externalUrl?: string;
  /** performs a shell action instead of opening a window */
  action?: "webview";
  resizable?: boolean;
}
