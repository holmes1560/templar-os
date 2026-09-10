/**
 * Migrates the previously-hardcoded portfolio into the database.
 *
 * This reads existing source-of-truth files (projects.ts, apps.ts, site.ts)
 * and seeds Postgres with Profile, Skills, Timeline, Education, Social Links,
 * Applications, Settings, and enhanced engineering project data.
 *
 * Idempotent: every write is an upsert keyed on unique identifiers.
 */
import {
  PrismaClient,
  Category,
  RepoVisibility,
  ProjectStatus,
  LaunchMode,
  TimelineType,
  ApiKeyRole,
} from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { projects } from "../src/lib/projects";
import { APPS } from "../src/lib/apps";
import { site } from "../src/lib/site";
import type { Project as SrcProject } from "../src/lib/types";

const db = new PrismaClient();

const CATEGORY: Record<SrcProject["category"], Category> = {
  web: Category.WEB,
  mobile: Category.MOBILE,
  cybersecurity: Category.CYBERSECURITY,
  ai: Category.AI,
  hardware: Category.HARDWARE,
  experiments: Category.EXPERIMENTS,
};

const VISIBILITY: Record<SrcProject["visibility"], RepoVisibility> = {
  public: RepoVisibility.PUBLIC,
  private: RepoVisibility.PRIVATE,
  local: RepoVisibility.LOCAL,
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[+]/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function parseRepo(url?: string) {
  if (!url) return { owner: null, repo: null };
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return { owner: null, repo: null };
    const [owner, repo] = u.pathname.replace(/^\/|\.git$/g, "").split("/");
    return { owner: owner ?? null, repo: repo ?? null };
  } catch {
    return { owner: null, repo: null };
  }
}

async function main() {
  console.log("→ migrating hardcoded portfolio into the database\n");

  /* ── 1. profile ────────────────────────────────────────────── */
  const existingProfile = await db.profile.findFirst();
  const profileData = {
    fullName: site.name,
    shortName: site.shortName,
    title: site.role,
    tagline: site.tagline,
    bio: "Computer science student and builder working across typed web backends, responsive user interfaces, embedded IoT firmware, and network forensics.",
    aboutMe:
      "I build software across an unusually wide range of layers, mostly because I kept refusing to pick one. In a single year I wrote ESP32 firmware for a door lock, an escrow ledger that never stores a balance, and a desktop app that spends most of its energy working around LibreOffice.\n\nThe through-line is that I learn by building the thing, breaking it, and then understanding why it broke. Most of what I know arrived that way rather than from a lecture.",
    location: site.location,
    availabilityStatus: "Open to opportunities",
    careerInterests: [
      "Full-Stack Engineering",
      "Distributed Systems",
      "Embedded Systems / IoT",
      "Cybersecurity & Network Forensics",
      "Agentic AI Architecture",
    ],
    whatImDrawnTo: [
      "Systems where the failure mode matters more than the happy path.",
      "Measuring things properly instead of guessing — and admitting it when the measurement was wrong.",
      "The seam between software and hardware, where the abstractions stop helping.",
      "Security as a design constraint rather than a feature bolted on later.",
    ],
    howIWorkWithAi:
      "I use AI tooling heavily — for research, for debugging, for getting a first implementation on screen fast, and for reviewing my own code. A review of one of my backends surfaced 21 real bugs I had missed. The decisions, the architecture and the final implementation are mine; the iteration speed is not something I'm going to pretend I did without help.",
    email: site.email || "owusuansahasenso1560@gmail.com",
    githubUrl: site.github,
    linkedinUrl: site.linkedin || "https://linkedin.com/in/asenso-owusu-ansah",
    websiteUrl: site.url,
  };

  if (existingProfile) {
    await db.profile.update({
      where: { id: existingProfile.id },
      data: profileData,
    });
  } else {
    await db.profile.create({ data: profileData });
  }
  console.log("  profile       migrated");

  /* ── 2. settings ───────────────────────────────────────────── */
  const settings: Record<string, string> = {
    "site.name": site.name,
    "site.shortName": site.shortName,
    "site.system": site.system,
    "site.systemVersion": site.systemVersion,
    "site.role": site.role,
    "site.tagline": site.tagline,
    "site.location": site.location,
    "site.github": site.github,
    "site.githubUser": site.githubUser,
    "site.email": site.email || "owusuansahasenso1560@gmail.com",
    "site.linkedin": site.linkedin || "https://linkedin.com/in/asenso-owusu-ansah",
    "site.resumePath": site.resumePath,
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log(`  settings      ${Object.keys(settings).length}`);

  /* ── 3. technologies ───────────────────────────────────────── */
  const techNames = [...new Set(projects.flatMap((p) => p.technologies))].sort();
  for (const name of techNames) {
    await db.technology.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }
  console.log(`  technologies  ${techNames.length}`);

  /* ── 4. skills & skill categories ──────────────────────────── */
  const SKILL_CATALOG = [
    {
      category: "Languages",
      skills: ["TypeScript", "JavaScript", "Python", "Java", "C / C++", "SQL"],
    },
    {
      category: "Frontend",
      skills: ["Next.js", "React", "Tailwind CSS", "Vite", "Recharts"],
    },
    {
      category: "Backend",
      skills: ["NestJS", "FastAPI", "Express", "Spring Boot", "Prisma", "SQLAlchemy"],
    },
    {
      category: "Mobile",
      skills: ["React Native", "Expo"],
    },
    {
      category: "Databases",
      skills: ["PostgreSQL", "MySQL", "Supabase", "Redis"],
    },
    {
      category: "DevOps & Cloud",
      skills: ["Docker", "Vercel", "Render", "Railway", "Firebase", "MinIO"],
    },
    {
      category: "Embedded & Hardware",
      skills: ["ESP32", "Arduino", "MFRC522 RFID", "I²C / SPI", "OpenSCAD", "3D printing"],
    },
    {
      category: "Security & Networking",
      skills: ["tcpdump", "Wireshark", "mtr", "Kali Linux", "WebAuthn", "Row Level Security"],
    },
    {
      category: "AI & Agents",
      skills: ["Gemini API", "Anthropic SDK", "A2A / JSON-RPC 2.0", "Model Context Protocol (MCP)"],
    },
  ];

  let totalSkills = 0;
  for (const [cIdx, cat] of SKILL_CATALOG.entries()) {
    const slug = slugify(cat.category);
    const categoryRecord = await db.skillCategory.upsert({
      where: { slug },
      update: { name: cat.category, order: cIdx },
      create: { name: cat.category, slug, order: cIdx },
    });

    for (const [sIdx, sName] of cat.skills.entries()) {
      const existing = await db.skill.findFirst({
        where: { categoryId: categoryRecord.id, name: sName },
      });
      if (existing) {
        await db.skill.update({
          where: { id: existing.id },
          data: { order: sIdx, visible: true },
        });
      } else {
        await db.skill.create({
          data: {
            categoryId: categoryRecord.id,
            name: sName,
            order: sIdx,
            visible: true,
            featured: sIdx < 3,
            technologies: [sName],
          },
        });
      }
      totalSkills++;
    }
  }
  console.log(`  skills        ${totalSkills} across ${SKILL_CATALOG.length} categories`);

  /* ── 5. projects ───────────────────────────────────────────── */
  const engineeringExtras: Record<
    string,
    {
      role: string;
      architecture: string;
      failedApproaches: string[];
      problemSolutions: string[];
      outcome: string;
    }
  > = {
    "olympus-gate": {
      role: "Hardware & Enclosure Lead, Cloud Backend",
      architecture: "ESP32 microcontroller with SPI RFID reader, relay-isolated 12V solenoid loop, and Firebase RTDB offline sync",
      failedApproaches: [
        "Blynk cloud integration was too rigid for the multi-user access-control model",
        "Common ground with the solenoid coil caused inductive flyback voltage spikes that reset the ESP32",
      ],
      problemSolutions: [
        "Isolated the 12V lock loop and 5V MCU logic with an optocoupled relay and flyback diode",
        "Stored the authorized RFID card list in local ESP32 flash so the door lock operates even when network connectivity drops",
      ],
      outcome: "A functional, physically installed RFID access system with custom snap-fit 3D-printed enclosure and companion PWA.",
    },
    taas: {
      role: "Monorepo Architect & Escrow State Machine Designer",
      architecture: "pnpm monorepo with Next.js 15 frontend, NestJS API, PostgreSQL, Redis, MinIO, and a shared Zod schema package",
      failedApproaches: [
        "Direct status column updates allowed concurrent race conditions during simultaneous payment webhook delivery",
      ],
      problemSolutions: [
        "Implemented strict finite state machine where every status change flows through a single transition handler with row-level locks",
        "Derived account balances dynamically from append-only ledger entries rather than mutable totals",
      ],
      outcome: "Zero-drift escrow ledger engine with idempotent webhook processing and atomic transaction retries.",
    },
    "cwa-planner": {
      role: "Full-Stack Developer & OCR Pipeline Integrator",
      architecture: "Next.js UI with FastAPI microservice running pdfplumber and Tesseract OCR over Supabase PostgreSQL",
      failedApproaches: [
        "Computing CWA from the uploaded slip alone ignored previous semesters if the student uploaded only their latest semester slip",
      ],
      problemSolutions: [
        "Created a temporary LEGACY semester anchor that computes correct cumulative average and automatically cleans itself up once historical slips are uploaded",
      ],
      outcome: "Used by real KNUST students; handled degraded OCR on free-tier hosting gracefully.",
    },
    "codm-latency": {
      role: "Sole Investigator & Forensics Analyst",
      architecture: "Hotspot traffic routing via Kali Linux with tcpdump packet capture and custom Python RTT parsing",
      failedApproaches: [
        "Initially mispaired TCP ACK numbers with cold-start SYN handshakes, reporting false 94ms latency",
      ],
      problemSolutions: [
        "Reran packet capture with strict session pairing, isolating steady-state UDP/TCP traffic to reveal true 61ms server RTT",
        "Documented the methodological error and published the correction transparently beside the original data",
      ],
      outcome: "Ground truth validated against game telemetry; diagnosed upstream ISP ICMP throttling.",
    },
    quickpos: {
      role: "Sole Full-Stack Developer",
      architecture: "Express backend with PostgreSQL, Paystack payment webhooks, and multi-display WebSocket sync",
      failedApproaches: [
        "Naive refund logic altered stock counts without recording an immutable return transaction",
      ],
      problemSolutions: [
        "Implemented atomic refund transactions that simultaneously restore inventory, balance registers, and generate return receipts",
      ],
      outcome: "Reliable POS software managing live transactions, receipt generation, and customer-facing second screens.",
    },
    agriconnect: {
      role: "Lead Backend Developer",
      architecture: "NestJS 11 with Prisma ORM, MySQL, and Socket.IO real-time chat",
      failedApproaches: [
        "Loose schema drift between early handwritten frontend forms and evolving SQL tables",
      ],
      problemSolutions: [
        "Comprehensive code audit fixing 21 runtime bugs and introducing strict Prisma schema synchronization",
      ],
      outcome: "Modular agricultural marketplace with secure JWT auth and real-time farmer-buyer messaging.",
    },
    voxsynq: {
      role: "Full-Stack Mobile Engineer",
      architecture: "React Native front end with Spring Boot 3.5 JVM backend and STOMP over WebSocket",
      failedApproaches: [
        "Stateless HTTP polling was sluggish and drained mobile device battery rapidly",
      ],
      problemSolutions: [
        "Engineered persistent WebSocket connection lifecycles with reconnection backoff and message ordering queues",
      ],
      outcome: "Production-grade chat and calling app with presence tracking and push notification dispatch.",
    },
    hng13: {
      role: "Backend & Agent Protocol Engineer",
      architecture: "FastAPI service with Pydantic validation implementing the A2A JSON-RPC 2.0 protocol",
      failedApproaches: [
        "Single-pass LLM generation resulted in hallucinations when synthesizing breaking news",
      ],
      problemSolutions: [
        "Built two-stage pipeline: conversational query parsing followed by real GNews verification before generation",
      ],
      outcome: "A2A-compliant interoperable AI agent deployed on Railway, passing automated protocol test suites.",
    },
  };

  for (const [pIdx, p] of projects.entries()) {
    const { owner, repo } = parseRepo(p.githubUrl);
    const extra = engineeringExtras[p.slug] || {
      role: "Creator & Developer",
      architecture: "Modular application architecture",
      failedApproaches: [],
      problemSolutions: [],
      outcome: "Delivered functional project conforming to design goals.",
    };

    const data = {
      name: p.title,
      shortDescription: p.summary,
      longDescription: p.description,
      category: CATEGORY[p.category],
      period: p.period,
      team: p.team ?? null,
      githubUrl: p.githubUrl ?? null,
      repositoryOwner: owner,
      repositoryName: repo,
      repoVisibility: VISIBILITY[p.visibility],
      hosted: Boolean(p.demoUrl),
      liveUrl: p.demoUrl ?? null,
      docsUrl: p.docsUrl ?? null,
      featured: p.featured,
      status: ProjectStatus.PUBLISHED,
      clientWork: p.clientWork ?? false,
      caveat: p.caveat ?? null,
      features: p.features,
      challenges: p.challenges,
      learned: p.learned,
      skills: p.skills,
      role: extra.role,
      architecture: extra.architecture,
      failedApproaches: extra.failedApproaches,
      problemSolutions: extra.problemSolutions,
      outcome: extra.outcome,
      order: pIdx,
      visible: true,
    };

    const saved = await db.project.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });

    await db.projectTechnology.deleteMany({ where: { projectId: saved.id } });
    for (const [order, techName] of p.technologies.entries()) {
      const tech = await db.technology.findUnique({ where: { name: techName } });
      if (!tech) continue;
      await db.projectTechnology.create({
        data: { projectId: saved.id, technologyId: tech.id, order },
      });
    }

    if (p.demoUrl) {
      const appKey = `live-${p.slug}`;
      const appData = {
        projectId: saved.id,
        name: p.title,
        icon: "globe",
        launchMode: p.embeddable ? LaunchMode.IFRAME : LaunchMode.EXTERNAL,
        url: p.demoUrl,
        enabled: true,
        desktopVisible: false,
        workspace: 1,
        windowWidth: 1024,
        windowHeight: 680,
      };
      await db.application.upsert({
        where: { appKey },
        update: appData,
        create: { appKey, ...appData },
      });
    }
  }
  console.log(`  projects      ${projects.length}`);

  /* ── 6. timeline ───────────────────────────────────────────── */
  const TIMELINE_ENTRIES = [
    {
      title: "Started BSc Computer Science",
      type: TimelineType.UNIVERSITY,
      organization: "Kwame Nkrumah University of Science & Technology",
      startDate: "2023",
      endDate: "Present",
      isCurrent: true,
      shortDescription: "BSc Computer Science program covering low-level architecture, algorithms, and system design.",
      detailedDescription: "Foundational and advanced coursework in embedded systems, computer graphics, operating systems, AI, and network administration.",
      technologies: ["C++", "Java", "Python", "Data Structures", "Linux"],
      skills: ["Algorithm Analysis", "Systems Programming", "Computer Architecture"],
      icon: "academic",
      order: 10,
    },
    {
      title: "Built VoxSynq Communication Suite",
      type: TimelineType.PROJECT,
      organization: "Personal Project",
      startDate: "Jun 2025",
      endDate: "Sep 2025",
      isCurrent: false,
      shortDescription: "Full-stack mobile messaging and VoIP platform with Spring Boot and React Native.",
      detailedDescription: "Implemented real-time bidirectional messaging, WebSocket STOMP protocol, and Docker containerization.",
      technologies: ["React Native", "Spring Boot", "PostgreSQL", "WebSocket", "STOMP", "Docker"],
      skills: ["Mobile Development", "JVM Architecture", "Real-Time Protocols"],
      icon: "mobile",
      order: 20,
    },
    {
      title: "HNG13 AI Backend Track",
      type: TimelineType.INTERNSHIP,
      organization: "HNG Tech",
      startDate: "Oct 2025",
      endDate: "Nov 2025",
      isCurrent: false,
      shortDescription: "Built an A2A-compliant interoperable agent service speaking JSON-RPC 2.0 under strict stage deadlines.",
      detailedDescription: "Engineered two-stage news verification and conversational topic extraction using Gemini API and FastAPI.",
      technologies: ["Python", "FastAPI", "Gemini API", "JSON-RPC 2.0", "Railway"],
      skills: ["Agent Protocol Compliance", "API Design", "Strict Deadlines"],
      icon: "briefcase",
      order: 30,
    },
    {
      title: "Architectural Evolution: AgriConnect",
      type: TimelineType.PROJECT,
      organization: "Coursework / Project",
      startDate: "Nov 2025",
      endDate: "Jan 2026",
      isCurrent: false,
      shortDescription: "Complete transition from handwritten HTML to React frontend and typed NestJS + Prisma backend.",
      detailedDescription: "Conducted rigorous self-audit that surfaced 21 runtime bugs and schema drifts, establishing strong testing principles.",
      technologies: ["NestJS", "Prisma", "MySQL", "React", "Socket.IO", "TypeScript"],
      skills: ["Architecture Progression", "ORM Modeling", "Self-Review Discipline"],
      icon: "code",
      order: 40,
    },
    {
      title: "CWA Academic Calculator & Planner",
      type: TimelineType.PROJECT,
      organization: "Group 2, KNUST",
      startDate: "Feb 2026",
      endDate: "Jun 2026",
      isCurrent: false,
      shortDescription: "OCR slip parser and academic weighted-average planner deployed for active KNUST students.",
      detailedDescription: "Designed the legacy semester anchor pattern to prevent historical data loss and handled OCR degradation gracefully.",
      technologies: ["Next.js", "FastAPI", "PostgreSQL", "Tesseract OCR", "Supabase RLS"],
      skills: ["OCR Data Pipelines", "Row Level Security", "Fault-Tolerant UX"],
      icon: "calculator",
      order: 50,
    },
    {
      title: "Commercial Retail POS: QuickPOS",
      type: TimelineType.PROJECT,
      organization: "Commercial Client",
      startDate: "Apr 2026",
      endDate: "May 2026",
      isCurrent: false,
      shortDescription: "Full-scale POS system handling live Paystack payments, stock reconciliation, and second-screen mirroring.",
      detailedDescription: "Addressed complex multi-entity refund transactions where financial ledgers, inventory tables, and receipts must remain atomic.",
      technologies: ["Node.js", "Express", "PostgreSQL", "Paystack", "jsPDF", "Gemini"],
      skills: ["Financial Integrity", "Transactional Systems", "Hardware Mirroring"],
      icon: "shop",
      order: 60,
    },
    {
      title: "Olympus Gate: Embedded Access Control",
      type: TimelineType.PROJECT,
      organization: "Group 16, KNUST",
      startDate: "May 2026",
      endDate: "Aug 2026",
      isCurrent: false,
      shortDescription: "ESP32 RFID door lock with fail-secure solenoid, offline flash list, and custom 3D-printed snap-fit case.",
      detailedDescription: "Integrated hardware and software from ground up: OpenSCAD parametric enclosure, flyback diode isolation, and PWA companion app.",
      technologies: ["ESP32", "C++", "MFRC522 RFID", "Firebase RTDB", "OpenSCAD", "3D Printing"],
      skills: ["Embedded Hardware", "Parametric CAD", "Circuit Isolation", "Offline-First Design"],
      icon: "lock",
      order: 70,
    },
    {
      title: "TaaS: Trust as a Service Escrow Engine",
      type: TimelineType.PROJECT,
      organization: "Group 2, KNUST",
      startDate: "Jul 2026",
      endDate: "Aug 2026",
      isCurrent: false,
      shortDescription: "P2P marketplace powered by a standalone escrow state machine and append-only ledger.",
      detailedDescription: "Designed pnpm monorepo with strict shared schema package, row locking, and idempotent transaction retries.",
      technologies: ["Next.js 15", "NestJS", "PostgreSQL", "Redis", "Docker", "Zod", "TRON"],
      skills: ["Fintech State Machines", "Monorepo Engineering", "Append-Only Ledgers"],
      icon: "shield",
      order: 80,
    },
    {
      title: "Telecel Network Latency Forensics",
      type: TimelineType.MILESTONE,
      organization: "Network Research",
      startDate: "Aug 2026",
      endDate: "Aug 2026",
      isCurrent: false,
      shortDescription: "Two-week passive packet capture analysis of ISP routing with published methodology correction.",
      detailedDescription: "Diagnosed ICMP filtering, caught initial session pairing miscalculation, and transparently published retraction and ground truth.",
      technologies: ["Kali Linux", "tcpdump", "Python", "mtr", "Wireshark", "BGP/AS"],
      skills: ["Network Forensics", "Empirical Measurement", "Engineering Integrity"],
      icon: "pulse",
      order: 90,
    },
    {
      title: "TEMPLAR OS Portfolio & Agent Platform",
      type: TimelineType.MILESTONE,
      organization: "Personal Platform",
      startDate: "Sep 2026",
      endDate: "Present",
      isCurrent: true,
      shortDescription: "Interactive retro-modern OS portfolio, MCP agent server, and API-driven CMS.",
      detailedDescription: "Transformed static portfolio into an agent-agnostic platform exposing fine-grained REST APIs, MCP tools, and SKILL.md.",
      technologies: ["Next.js 16", "TypeScript", "Prisma", "PostgreSQL", "Tailwind CSS", "MCP Protocol"],
      skills: ["Platform Architecture", "MCP Server Engineering", "Agentic Systems"],
      icon: "terminal",
      order: 100,
    },
  ];

  await db.timelineEntry.deleteMany({});
  for (const entry of TIMELINE_ENTRIES) {
    await db.timelineEntry.create({
      data: {
        ...entry,
        visible: true,
      },
    });
  }
  console.log(`  timeline      ${TIMELINE_ENTRIES.length} milestones`);

  /* ── 7. education ──────────────────────────────────────────── */
  await db.education.deleteMany({});
  await db.education.create({
    data: {
      institution: "Kwame Nkrumah University of Science and Technology (KNUST)",
      degree: "BSc Computer Science",
      fieldOfStudy: "Computer Science",
      startDate: "2023",
      endDate: "2026",
      isCurrent: true,
      description:
        "Undergraduate curriculum spanning embedded systems, computer architecture, data structures, algorithm design, operating systems, AI, and computer networking.",
      achievements: [
        "Lead architect for TaaS monorepo escrow system",
        "Hardware and enclosure engineer for Olympus Gate RFID lock",
        "Developer of the crowdsourced CWA Calculator used across KNUST",
      ],
      order: 0,
      visible: true,
    },
  });
  console.log("  education     migrated");

  /* ── 8. social links ───────────────────────────────────────── */
  const SOCIAL_LINKS = [
    { platform: "GitHub", label: "GitHub", url: site.github, username: site.githubUser, icon: "github", order: 0 },
    { platform: "LinkedIn", label: "LinkedIn", url: site.linkedin || "https://linkedin.com/in/asenso-owusu-ansah", icon: "globe", order: 1 },
    { platform: "Email", label: "Email", url: `mailto:${site.email || "owusuansahasenso1560@gmail.com"}`, icon: "mail", order: 2 },
  ];
  await db.socialLink.deleteMany({});
  for (const link of SOCIAL_LINKS) {
    await db.socialLink.create({
      data: { ...link, visible: true },
    });
  }
  console.log(`  social links  ${SOCIAL_LINKS.length}`);

  /* ── 9. applications (the OS's own apps) ───────────────────── */
  const appsWithTimeline = [
    ...APPS,
    {
      id: "timeline",
      title: "Career Timeline",
      icon: "pulse",
      workspace: 1,
      size: { w: 900, h: 580 },
    },
  ];

  for (const [i, a] of appsWithTimeline.entries()) {
    const launchMode = (a as any).externalUrl
      ? LaunchMode.EXTERNAL
      : LaunchMode.INTERNAL;

    const appData = {
      name: a.title,
      icon: a.icon,
      launchMode,
      url: (a as any).externalUrl ?? null,
      enabled: true,
      desktopVisible: true,
      workspace: a.workspace,
      cell: appsWithTimeline.filter((x) => x.workspace === a.workspace).findIndex((x) => x.id === a.id),
      windowWidth: a.size.w || 760,
      windowHeight: a.size.h || 520,
    };

    await db.application.upsert({
      where: { appKey: a.id },
      update: appData,
      create: { appKey: a.id, ...appData },
    });
    void i;
  }
  console.log(`  applications  ${appsWithTimeline.length} (including Timeline)`);

  /* ── 10. dev api key ───────────────────────────────────────── */
  const existingKey = await db.apiKey.findFirst();
  if (!existingKey) {
    const rawDevSecret = `tpl_live_${randomBytes(24).toString("base64url")}`;
    const keyHash = createHash("sha256").update(rawDevSecret).digest("hex");
    const keyPrefix = rawDevSecret.slice(0, 12);

    await db.apiKey.create({
      data: {
        name: "Development Portfolio Agent Key",
        keyPrefix,
        keyHash,
        role: ApiKeyRole.FULL_AGENT,
        scopes: ["*"],
        rateLimitPerMin: 120,
      },
    });
    console.log("\n  ────────────────────────────────────────────────────────");
    console.log("  Default Admin API Key Created for Local AI Agents:");
    console.log(`  Key:    ${rawDevSecret}`);
    console.log("  Scopes: * (Full Access)");
    console.log("  Save this key — it will never be displayed again.");
    console.log("  ────────────────────────────────────────────────────────\n");
  } else {
    console.log("  api keys      already configured");
  }

  console.log("\n✓ migration and seeding complete");
}

main()
  .catch((e) => {
    console.error("✗ seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
