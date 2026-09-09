import type { Project } from "./types";

/**
 * Every entry here was verified against the actual source on disk or the
 * real repository under github.com/holmes1560. No invented repos, no
 * invented features, no invented failures.
 *
 * `visibility` decides whether a link renders at all.
 */
export const projects: Project[] = [
  /* ───────────────────────────── hardware ───────────────────────────── */
  {
    slug: "olympus-gate",
    title: "Olympus Gate",
    summary: "RFID door lock that keeps working when the internet doesn't.",
    description:
      "An ESP32 access-control system with a custom installable web app. Tap a registered card and the door unlocks; an unknown card raises a doorbell alert with a short code the visitor can read out, and access can be granted remotely from the app. Built for the Embedded Systems course — it is the only project here that spans every layer, from firmware to a 3D-printed enclosure we designed ourselves.",
    category: "hardware",
    period: "2026 · Year 3 Sem 2",
    team: "Group 16, KNUST",
    technologies: [
      "ESP32", "Arduino / C++", "MFRC522 RFID", "16×2 I²C LCD", "5V relay",
      "12V solenoid", "Firebase RTDB", "Cloud Functions", "FCM", "PWA",
      "WebAuthn", "OpenSCAD", "3D printing",
    ],
    skills: ["Embedded systems", "Hardware/software integration", "Offline-first design", "Parametric CAD", "Security design"],
    features: [
      "Card list stored in ESP32 flash — the lock keeps granting access with no internet, then re-syncs",
      "Fail-secure solenoid: it needs power to retract, so a flat battery leaves the door locked",
      "12V loop isolated by the relay, sharing no ground with the microcontroller",
      "Installable PWA with live status, activity log, card management and lockdown mode",
      "PIN-verified remote unlock; commands carry a timestamp and are rejected after 10 seconds",
      "Parametric snap-fit enclosure, printed supportless from OpenSCAD source",
    ],
    challenges: [
      "The ESP32's GPIO map is full of traps — internal flash on 6–11, boot straps on 0/2/15, USB serial on 1/3, input-only above 33. A wrong pin means a board that refuses to boot.",
      "An earlier build ran on Blynk. It couldn't express the access-control model we wanted, so the whole cloud side was rewritten against Firebase.",
      "A collapsing solenoid coil will find your microcontroller if you let it — the flyback diode is not optional.",
    ],
    learned: [
      "Design the failure mode first. 'No power means locked' decided most of the rest of the project.",
      "Anything that depends on a network needs an answer for when the network is gone.",
    ],
    visibility: "public",
    githubUrl: "https://github.com/holmes1560/RFID_Door_lock",
    images: [],
    featured: true,
  },
  {
    slug: "enclosures",
    title: "Parametric Enclosures",
    summary: "Two printed cases designed from datasheets rather than guesses.",
    description:
      "Enclosure and firmware work for two embedded builds — an automated cocoa seed dryer and an RFID attendance system. Every dimension came from a manufacturer datasheet. Both enclosures share one architecture: flat box, snap-fit lid, 0.3mm fit clearance, and both parts print with no supports.",
    category: "hardware",
    period: "Aug 2026",
    technologies: ["OpenSCAD", "3D printing", "ESP32", "arduino-cli", "Firebase", "Vite", "TypeScript"],
    skills: ["Parametric CAD", "Design for manufacture", "Tolerancing", "Verification"],
    features: [
      "Every dimension is a named variable at the top of the .scad source",
      "Each STL verified as a single closed manifold body",
      "Base + lid intersection test returns empty — no interference when assembled",
      "Lid pre-rotated in the STL so it lands top-face-down on the bed",
    ],
    challenges: [
      "A 16×2 LCD is a completely different size from a 20×4 (80×36 against 98×60), so the attendance case had to be rebuilt from scratch rather than patched.",
    ],
    learned: [
      "Looking up the datasheet takes ten minutes. Reprinting a case that is 2mm wrong takes four hours.",
    ],
    visibility: "public",
    githubUrl: "https://github.com/holmes1560/smart-rfid-attendance-system",
    images: [],
    featured: false,
    clientWork: true,
    caveat: "Firmware compiles clean and the self-test passes, but neither build has been through a full hardware cycle.",
  },

  /* ─────────────────────────────── web ─────────────────────────────── */
  {
    slug: "taas",
    title: "TaaS — Trust as a Service",
    summary: "P2P marketplace with a standalone escrow engine.",
    description:
      "An escrow engine and marketplace for goods, services, online accounts and crypto. A pnpm monorepo: Next.js web app, NestJS API, and a shared package holding the enums, Zod schemas and money helpers that both sides agree on.",
    category: "web",
    period: "Jul 2026",
    team: "Group 2, KNUST",
    technologies: [
      "Next.js 15", "NestJS", "PostgreSQL", "Redis", "MinIO", "Docker Compose",
      "pnpm workspaces", "Zod", "TypeScript", "TRON testnet",
    ],
    skills: ["Monorepo architecture", "State machines", "Fintech correctness", "API design", "Auth & roles"],
    features: [
      "Money is always BIGINT minor units — pesewas, SUN — never a float",
      "Ledger entries are append-only; balances are derived, never stored",
      "Every escrow state change goes through one transition function",
      "Database-level locking and transaction retry around contended writes",
      "Local mail, object storage and Postgres all containerised for one-command setup",
    ],
    challenges: [
      "Escrow state is the whole product. Letting any code path write a status directly would eventually produce a state the machine doesn't allow, so there is exactly one door in and out.",
    ],
    learned: [
      "You cannot corrupt a balance you never wrote down.",
      "Shared schema packages stop the frontend and backend quietly disagreeing about what a thing is.",
    ],
    visibility: "public",
    githubUrl: "https://github.com/holmes1560/TaaS",
    images: [],
    featured: true,
  },
  {
    slug: "cwa-planner",
    title: "CWA Calculator & Planner",
    summary: "Upload your result slips, get an average that's actually correct.",
    description:
      "A weighted-average calculator and academic planner for KNUST students. Upload result slips, it parses them with OCR, computes your CWA, and lets you plan what you need next semester. Deployed and used by real students — which is how its most interesting bug was found.",
    category: "web",
    period: "Feb–Jun 2026",
    team: "Group 2, KNUST",
    technologies: [
      "Next.js 16", "Tailwind", "Recharts", "Python", "FastAPI", "SQLAlchemy",
      "PostgreSQL", "Supabase", "pdfplumber", "Tesseract OCR", "Vercel", "Render",
    ],
    skills: ["Full-stack", "OCR pipelines", "Data integrity", "Graceful degradation", "RLS security"],
    features: [
      "A ghost 'LEGACY' semester anchors missing history so the average is right from incomplete data — and deletes itself once the real slips arrive",
      "Course catalogue crowdsourced from every upload, with student difficulty ratings",
      "Extract → review → confirm flow, so OCR mistakes get corrected before anything is saved",
      "Row Level Security on, anon key blocked by default",
    ],
    challenges: [
      "Students upload the slip they have in front of them, usually the most recent. A cumulative average computed from one slip silently ignores a year of history — a people problem wearing a maths problem's clothes.",
      "Render's free Python tier has no Tesseract binary. The OCR call degrades to a 'partial data' warning instead of returning a 500.",
    ],
    learned: [
      "The hardest bugs in a data app are in what you assumed about the data before it arrived.",
    ],
    visibility: "private",
    // TODO(asenso): the deployed Vercel URL. Set `embeddable: true` once that
    // deployment sends `frame-ancestors` permitting this origin — see README.
    images: [],
    featured: true,
  },
  {
    slug: "quickpos",
    title: "QuickPOS",
    summary: "Point-of-sale system where real money actually moves.",
    description:
      "A web-based point of sale for small and medium retail: multi-role access, live payments, inventory, loyalty, and a second-screen customer display. The first project where a bug would have cost somebody money.",
    category: "web",
    period: "Apr 2026",
    technologies: [
      "Node.js", "Express", "PostgreSQL", "JavaScript", "Paystack",
      "Brevo", "Google Gemini", "bwip-js", "jsPDF",
    ],
    skills: ["Payment integration", "Transactional logic", "Role-based access", "Inventory modelling"],
    features: [
      "Cash, mobile money, card, split and store-credit payment paths",
      "Paystack inline checkout with a live/test toggle in admin settings",
      "Returns and refunds with per-item selection and stock re-injection",
      "Customer display on a second screen, mirroring the cart in real time",
      "Barcode generation and printable / PDF receipts",
    ],
    challenges: [
      "Refunds are where a POS gets genuinely hard: the money, the stock and the receipt history all have to move together or not at all.",
    ],
    learned: [
      "Once real payments are involved, 'mostly works' stops being a category.",
    ],
    visibility: "public",
    githubUrl: "https://github.com/holmes1560/quickPOS",
    images: [],
    featured: false,
  },
  {
    slug: "agriconnect",
    title: "AgriConnect",
    summary: "Started as hand-written HTML. Ended as a typed NestJS backend.",
    description:
      "A farmer-to-trader marketplace that began as a set of static pages for a web development course and turned into the project where architecture started to matter. The rewrite from plain HTML to React, and then to a typed backend with a real ORM, is the clearest before-and-after in my work.",
    category: "web",
    period: "Late 2025 → 2026",
    technologies: [
      "NestJS 11", "Prisma 6", "MySQL", "React", "Vite", "TypeScript",
      "Tailwind", "Socket.IO", "JWT", "Passport", "bcrypt", "Jest",
    ],
    skills: ["Architecture progression", "ORM modelling", "WebSockets", "Code review"],
    features: [
      "Marketplace, harvest listings, orders, chat and an admin surface",
      "Real-time chat over Socket.IO",
      "JWT auth with hashed credentials and guarded routes",
    ],
    challenges: [
      "A full review of my own code turned up 21 bugs — 7 that would crash at runtime, 8 security or data-integrity issues. Most were the Prisma schema having quietly drifted from the fields the services referenced.",
    ],
    learned: [
      "A schema and the code that uses it drift apart silently. Nothing tells you until it crashes.",
      "Reviewing your own work properly is uncomfortable and worth doing.",
    ],
    visibility: "local",
    images: [],
    featured: false,
  },

  /* ────────────────────────────── mobile ───────────────────────────── */
  {
    slug: "voxsynq",
    title: "VoxSynq",
    summary: "The first serious thing I built. A real-time comms app.",
    description:
      "A messaging application with private and group chats, voice and video calls, file sharing and read receipts. React Native on the front, Spring Boot on the back. In hindsight the choices are heavy for a student project — which is exactly why it taught me so much.",
    category: "mobile",
    period: "Jun–Sep 2025",
    technologies: [
      "React Native", "Expo", "TypeScript", "Spring Boot 3.5", "Java 17",
      "PostgreSQL", "WebSocket", "STOMP", "JWT", "Docker",
    ],
    skills: ["Mobile development", "Real-time systems", "JVM backend", "Auth"],
    features: [
      "Private and group messaging over WebSocket/STOMP",
      "Voice and video calling",
      "Read receipts and push notifications",
      "Image and audio message support",
    ],
    challenges: [
      "A REST endpoint either responds or it doesn't. A WebSocket connection has state — it drops, reconnects, and delivers out of order.",
    ],
    learned: [
      "Spring Boot doesn't let you avoid learning dependency injection and connection lifecycles properly.",
      "Everything I've built since sits on what this forced me to understand.",
    ],
    visibility: "public",
    githubUrl: "https://github.com/holmes1560/Voxsynq_Templar0x",
    images: [],
    featured: false,
  },

  /* ─────────────────────────── cybersecurity ───────────────────────── */
  {
    slug: "codm-latency",
    title: "Telecel Latency Investigation",
    summary: "I published a number, then retracted it. The retraction is the point.",
    description:
      "A two-week measurement of my ISP's route to a game server, done with packet captures and custom Python rather than a speed-test website. It produced a confident, well-documented, wrong answer — and then a corrected one, with the methodological reason for the error written up beside it.",
    category: "cybersecurity",
    period: "Aug 2026",
    technologies: ["Kali Linux", "tcpdump", "Python", "mtr", "Wireshark", "BGP/AS lookup"],
    skills: ["Network forensics", "Measurement methodology", "Hypothesis testing", "Technical writing"],
    features: [
      "Tablet routed through a laptop hotspot so game traffic could be captured",
      "Custom passive RTT extraction from a 40MB capture",
      "Percentile analysis of server inter-arrival gaps",
      "Diagnosed upstream ICMP filtering — plain ping and mtr die, TCP and UDP probes work",
    ],
    challenges: [
      "Passive RTT is genuinely hard in a busy flow. I mispaired a reply with the wrong request and sampled a cold start inflated by ~33ms of session setup, producing 86–94ms.",
      "The corrected figure is 61ms — which the in-game counter had been reporting all along.",
      "The 'server is in Lagos' conclusion went with it. It was never measured; it only ever matched the wrong number.",
    ],
    learned: [
      "Write down that you were wrong, in the same document, with the reason. It is uncomfortable and it is the only way the notes stay trustworthy.",
      "A ground truth sitting in plain sight beats a clever derivation.",
    ],
    visibility: "local",
    images: [],
    featured: true,
  },

  /* ─────────────────────────────── ai ──────────────────────────────── */
  {
    slug: "hng13",
    title: "HNG13 — Stages 0 to 3",
    summary: "Four stages, four deadlines, an agent protocol at the end of it.",
    description:
      "An internship track where each stage was a fresh brief with a hard deadline. The final stage was an A2A-compliant agent — an interoperable service speaking JSON-RPC 2.0 — built before every second post on the internet was about AI agents.",
    category: "ai",
    period: "Oct 2025",
    technologies: [
      "Python", "FastAPI", "Pydantic", "Uvicorn", "Google Gemini 2.5 Flash",
      "GNews API", "JSON-RPC 2.0", "A2A protocol", "Railway",
    ],
    skills: ["API design", "Spec compliance", "Shipping to deadlines", "AI pipelines"],
    features: [
      "Two-stage AI pipeline: extract a clean topic from conversational input, then generate against a real news headline",
      "Strict Pydantic validation modelling the A2A envelope",
      "Graceful, spec-compliant error responses when an upstream API fails",
    ],
    challenges: [
      "Protocol compliance is unforgiving — the agent either matches the spec exactly or the platform rejects it.",
    ],
    learned: [
      "A deadline is a design constraint. It decides what you don't build.",
    ],
    visibility: "public",
    githubUrl: "https://github.com/holmes1560/HNG13_Stage-3",
    images: [],
    featured: false,
  },

  /* ────────────────────────── experiments ──────────────────────────── */
  {
    slug: "convertor",
    title: "DOC → PDF Converter",
    summary: "A boring problem hiding genuinely hard engineering.",
    description:
      "A desktop app that batch-converts documents to PDF and merges them, entirely offline. It doesn't parse the legacy Word format — it drives a local LibreOffice in headless mode, which is where all the difficulty turned out to live.",
    category: "experiments",
    period: "Aug 2026",
    technologies: [
      "Electron", "electron-vite", "React 18", "TypeScript", "Zustand",
      "pdf-lib", "Vitest", "Testing Library", "electron-builder",
    ],
    skills: ["Desktop architecture", "Process orchestration", "IPC security", "Atomic file operations"],
    features: [
      "Convert, merge, and extract-as-text workflows that accept documents and PDFs together",
      "Worker pool with per-worker LibreOffice profiles",
      "Merging copies pages structurally with pdf-lib — source PDFs are never rasterised",
      "Everything runs locally; documents are never uploaded",
    ],
    challenges: [
      "LibreOffice single-instances itself: a second invocation hands its work to the first process and exits successfully having written nothing. Each worker needs its own -env:UserInstallation profile.",
      "Its exit code cannot be trusted — it returns 0 after failing to load a document. Success is defined as a non-empty PDF actually appearing on disk.",
      "A whole 'convert then merge' mode was deleted late, once it became clear merging already accepted both inputs and a second entry point would be the same code path under a different name.",
    ],
    learned: [
      "When you orchestrate a process you don't control, define success by observable output, not by what it claims.",
      "Two ways to do one thing is how they drift apart.",
    ],
    visibility: "local",
    images: [],
    featured: false,
  },
  {
    slug: "course-registration",
    title: "Course Registration System",
    summary: "Normalized PostgreSQL with live SQL execution in the UI.",
    description:
      "A full-stack student course registration system built around a properly normalized relational schema, with role-separated dashboards for administrators and students, aggregate reporting, and a panel that executes SQL against the live database.",
    category: "web",
    period: "Mar 2026",
    technologies: ["React", "Node.js", "Express", "PostgreSQL", "JWT"],
    skills: ["Schema normalization", "SQL", "Aggregate reporting", "Role-based access"],
    features: [
      "Normalized schema built from an init.sql migration",
      "Separate admin and student dashboards",
      "Live SQL query execution with dynamic aggregate reports",
    ],
    challenges: [
      "Normalization is easy to describe and fiddly to actually get right once registration, prerequisites and reporting all pull on the same tables.",
    ],
    learned: [
      "Getting the schema right early makes every query afterwards shorter.",
    ],
    visibility: "private",
    images: [],
    featured: false,
    clientWork: true,
  },
];

export const featured = projects.filter((p) => p.featured);

export function byCategory(c: Project["category"]) {
  return projects.filter((p) => p.category === c);
}

export function bySlug(slug: string) {
  return projects.find((p) => p.slug === slug);
}
