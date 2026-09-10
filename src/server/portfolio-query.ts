/**
 * Raw database read for portfolio content. Deliberately free of the `server-only`
 * guard so the snapshot script can run it under plain Node.
 *
 * Single source of truth for the public website, OS window manager, and snapshot fallback.
 */
import { db } from "@/lib/db";
import type {
  PortfolioData,
  PublicProject,
  PublicApp,
  PublicProfile,
  PublicSkillCategory,
  PublicTimelineEntry,
  PublicExperience,
  PublicEducation,
  PublicCertification,
  PublicAchievement,
  PublicSocialLink,
  PublicResume,
  CategoryKey,
  RepoVisibilityKey,
  LaunchModeKey,
  TimelineTypeKey,
} from "@/lib/portfolio-types";

const toCategory = (c: string) => c.toLowerCase() as CategoryKey;
const toVisibility = (v: string) => v.toLowerCase() as RepoVisibilityKey;
const toLaunchMode = (m: string) => m.toLowerCase() as LaunchModeKey;
const toTimelineType = (t: string) => t.toLowerCase() as TimelineTypeKey;

export async function queryDatabase(): Promise<PortfolioData> {
  const [
    projectRows,
    appRows,
    settingRows,
    profileRow,
    skillCategoryRows,
    timelineRows,
    experienceRows,
    educationRows,
    certificationRows,
    achievementRows,
    socialLinkRows,
    resumeRow,
  ] = await Promise.all([
    db.project.findMany({
      where: { status: "PUBLISHED", visible: true },
      include: {
        technologies: { include: { technology: true }, orderBy: { order: "asc" } },
        applications: { where: { enabled: true } },
      },
      orderBy: [{ order: "asc" }, { featured: "desc" }, { createdAt: "asc" }],
    }),
    db.application.findMany({
      where: { enabled: true },
      orderBy: [{ workspace: "asc" }, { cell: "asc" }],
    }),
    db.setting.findMany(),
    db.profile.findFirst(),
    db.skillCategory.findMany({
      include: {
        skills: {
          where: { visible: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    }),
    db.timelineEntry.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
    }),
    db.experience.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
    }),
    db.education.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
    }),
    db.certification.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
    }),
    db.achievement.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
    }),
    db.socialLink.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
    }),
    db.resumeRecord.findFirst({
      where: { isActive: true },
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  const settings = Object.fromEntries(settingRows.map((s) => [s.key, s.value]));

  // Build Profile with fallback to settings
  const profile: PublicProfile = profileRow
    ? {
        fullName: profileRow.fullName,
        shortName: profileRow.shortName,
        title: profileRow.title,
        tagline: profileRow.tagline,
        bio: profileRow.bio,
        aboutMe: profileRow.aboutMe,
        location: profileRow.location,
        availabilityStatus: profileRow.availabilityStatus,
        careerInterests: profileRow.careerInterests,
        whatImDrawnTo: profileRow.whatImDrawnTo,
        howIWorkWithAi: profileRow.howIWorkWithAi ?? undefined,
        avatarUrl: profileRow.avatarUrl ?? undefined,
        email: profileRow.email ?? settings["site.email"] ?? undefined,
        phone: profileRow.phone ?? undefined,
        websiteUrl: profileRow.websiteUrl ?? undefined,
        githubUrl: profileRow.githubUrl ?? settings["site.github"] ?? undefined,
        linkedinUrl: profileRow.linkedinUrl ?? settings["site.linkedin"] ?? undefined,
        twitterUrl: profileRow.twitterUrl ?? undefined,
      }
    : {
        fullName: settings["site.name"] || "Asenso Owusu Ansah",
        shortName: settings["site.shortName"] || "Asenso",
        title: settings["site.role"] || "Computer Science · KNUST",
        tagline:
          settings["site.tagline"] ||
          "I build across the whole stack — React interfaces, typed backends, ESP32 firmware, and the 3D-printed case it all lives in.",
        bio: "Computer science student and builder working across typed web backends, responsive user interfaces, embedded IoT firmware, and network forensics.",
        aboutMe:
          "I build software across an unusually wide range of layers, mostly because I kept refusing to pick one. In a single year I wrote ESP32 firmware for a door lock, an escrow ledger that never stores a balance, and a desktop app that spends most of its energy working around LibreOffice.",
        location: settings["site.location"] || "Kumasi, Ghana",
        availabilityStatus: "Open to opportunities",
        careerInterests: [
          "Full-Stack Engineering",
          "Distributed Systems",
          "Embedded Systems / IoT",
          "Cybersecurity & Network Forensics",
        ],
        whatImDrawnTo: [
          "Systems where the failure mode matters more than the happy path.",
          "Measuring things properly instead of guessing — and admitting it when the measurement was wrong.",
          "The seam between software and hardware, where the abstractions stop helping.",
          "Security as a design constraint rather than a feature bolted on later.",
        ],
        githubUrl: settings["site.github"] || "https://github.com/holmes1560",
        email: settings["site.email"] || undefined,
        linkedinUrl: settings["site.linkedin"] || undefined,
      };

  const projects: PublicProject[] = projectRows.map((p) => ({
    slug: p.slug,
    title: p.name,
    summary: p.shortDescription,
    description: p.longDescription,
    category: toCategory(p.category),
    period: p.period ?? "",
    team: p.team ?? undefined,
    technologies: p.technologies.map((t) => t.technology.name),
    skills: p.skills,
    features: p.features,
    challenges: p.challenges,
    learned: p.learned,
    role: p.role ?? undefined,
    architecture: p.architecture ?? undefined,
    failedApproaches: p.failedApproaches,
    problemSolutions: p.problemSolutions,
    outcome: p.outcome ?? undefined,
    order: p.order,
    visibility: toVisibility(p.repoVisibility),
    githubUrl: p.githubUrl ?? undefined,
    demoUrl: p.hosted && p.liveUrl ? p.liveUrl : undefined,
    docsUrl: p.docsUrl ?? undefined,
    embeddable: p.applications.some((a) => a.launchMode === "IFRAME"),
    featured: p.featured,
    clientWork: p.clientWork,
    caveat: p.caveat ?? undefined,
  }));

  const bySlug = new Map(projectRows.map((p) => [p.id, p.slug]));

  const apps: PublicApp[] = appRows.map((a) => ({
    appKey: a.appKey,
    name: a.name,
    icon: a.icon,
    launchMode: toLaunchMode(a.launchMode),
    url: a.url ?? undefined,
    workspace: a.workspace,
    cell: a.cell,
    width: a.windowWidth,
    height: a.windowHeight,
    resizable: a.resizable,
    maximizable: a.maximizable,
    minimizable: a.minimizable,
    projectSlug: a.projectId ? bySlug.get(a.projectId) : undefined,
  }));

  // Calculate project usage counts per skill
  const techUsage = new Map<string, number>();
  for (const p of projectRows) {
    for (const t of p.technologies) {
      const lower = t.technology.name.toLowerCase();
      techUsage.set(lower, (techUsage.get(lower) ?? 0) + 1);
    }
  }

  const skills: PublicSkillCategory[] = skillCategoryRows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    order: c.order,
    skills: c.skills.map((s) => {
      const uses = techUsage.get(s.name.toLowerCase()) ?? 0;
      return {
        id: s.id,
        name: s.name,
        description: s.description ?? undefined,
        proficiency: s.proficiency ?? undefined,
        technologies: s.technologies,
        order: s.order,
        featured: s.featured,
        projectCount: uses > 0 ? uses : undefined,
      };
    }),
  }));

  const timeline: PublicTimelineEntry[] = timelineRows.map((t) => ({
    id: t.id,
    title: t.title,
    type: toTimelineType(t.type),
    organization: t.organization ?? undefined,
    startDate: t.startDate,
    endDate: t.endDate ?? undefined,
    isCurrent: t.isCurrent,
    shortDescription: t.shortDescription,
    detailedDescription: t.detailedDescription ?? undefined,
    technologies: t.technologies,
    skills: t.skills,
    relatedProjectIds: t.relatedProjectIds,
    icon: t.icon,
    color: t.color ?? undefined,
    order: t.order,
  }));

  const experience: PublicExperience[] = experienceRows.map((e) => ({
    id: e.id,
    organization: e.organization,
    role: e.role,
    employmentType: e.employmentType ?? undefined,
    location: e.location ?? undefined,
    startDate: e.startDate,
    endDate: e.endDate ?? undefined,
    isCurrent: e.isCurrent,
    description: e.description,
    responsibilities: e.responsibilities,
    achievements: e.achievements,
    technologies: e.technologies,
    order: e.order,
  }));

  const education: PublicEducation[] = educationRows.map((e) => ({
    id: e.id,
    institution: e.institution,
    degree: e.degree,
    fieldOfStudy: e.fieldOfStudy ?? undefined,
    startDate: e.startDate,
    endDate: e.endDate ?? undefined,
    isCurrent: e.isCurrent,
    description: e.description ?? undefined,
    achievements: e.achievements,
    order: e.order,
  }));

  const certifications: PublicCertification[] = certificationRows.map((c) => ({
    id: c.id,
    name: c.name,
    issuer: c.issuer,
    issueDate: c.issueDate ?? undefined,
    expiryDate: c.expiryDate ?? undefined,
    credentialUrl: c.credentialUrl ?? undefined,
    credentialId: c.credentialId ?? undefined,
    description: c.description ?? undefined,
    order: c.order,
  }));

  const achievements: PublicAchievement[] = achievementRows.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    date: a.date ?? undefined,
    organization: a.organization ?? undefined,
    linkUrl: a.linkUrl ?? undefined,
    order: a.order,
  }));

  const socialLinks: PublicSocialLink[] = socialLinkRows.map((s) => ({
    id: s.id,
    platform: s.platform,
    label: s.label,
    url: s.url,
    username: s.username ?? undefined,
    icon: s.icon,
    order: s.order,
  }));

  const resume: PublicResume | undefined = resumeRow
    ? {
        version: resumeRow.version,
        fileName: resumeRow.fileName,
        downloadUrl: resumeRow.filePath,
        fileSize: resumeRow.fileSize ?? undefined,
        uploadedAt: resumeRow.uploadedAt.toISOString(),
      }
    : undefined;

  return {
    profile,
    projects,
    skills,
    timeline,
    experience,
    education,
    certifications,
    achievements,
    socialLinks,
    resume,
    apps,
    settings,
    generatedAt: new Date().toISOString(),
  };
}
