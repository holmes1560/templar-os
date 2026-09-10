import { CATEGORY_LABEL, type CategoryKey as Category, type PortfolioData } from "@/lib/portfolio-types";
import { site } from "@/lib/site";

/**
 * The real portfolio. A server component — no "use client", no hooks, no
 * store. It is fully rendered in the HTML response, which is what makes
 * §24 (SEO) and §20 (works without JS) true rather than aspirational.
 *
 * The OS mounts on top of this. "Web View" doesn't navigate anywhere;
 * it just dismisses the overlay and reveals what was always underneath.
 */

const CATS = Object.keys(CATEGORY_LABEL) as Category[];

export function Portfolio({ data }: { data: PortfolioData }) {
  const {
    profile,
    projects,
    skills,
    timeline,
    experience,
    education,
    resume,
    socialLinks,
  } = data;

  const name = profile.fullName || site.name;
  const role = profile.title || site.role;
  const location = profile.location || site.location;
  const tagline = profile.tagline || site.tagline;
  const github = profile.githubUrl || site.github;
  const email = profile.email || site.email;
  const resumeUrl = resume?.downloadUrl || site.resumePath;

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      {/* ── hero ── */}
      <header>
        <p className="label mb-4">{site.system} · web view</p>
        <h1 className="text-[clamp(2rem,6vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-[var(--os-fg)]">
          {name}
        </h1>
        <p className="mt-3 text-sm text-[var(--os-fg-faint)]">
          {role} · {location}
        </p>
        <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-[var(--os-fg-muted)]">
          {tagline}
        </p>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Primary">
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] px-3.5 py-2 text-sm text-[var(--os-fg)] transition-colors hover:bg-[var(--os-surface-2)]"
            >
              GitHub
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] px-3.5 py-2 text-sm text-[var(--os-fg)] transition-colors hover:bg-[var(--os-surface-2)]"
            >
              Email
            </a>
          )}
          {resumeUrl && (
            <a
              href={resumeUrl}
              download
              className="rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3.5 py-2 text-sm font-medium text-[var(--os-accent-fg)]"
            >
              Download CV
            </a>
          )}
        </nav>
      </header>

      {/* ── about ── */}
      <Section id="about" title="About">
        {profile.bio && (
          <p className="mb-3 max-w-[58ch] text-sm leading-relaxed text-[var(--os-fg-muted)]">
            {profile.bio}
          </p>
        )}
        {profile.aboutMe && (
          <p className="mb-3 max-w-[58ch] text-sm leading-relaxed text-[var(--os-fg-muted)]">
            {profile.aboutMe}
          </p>
        )}
        {profile.whatImDrawnTo && profile.whatImDrawnTo.length > 0 && (
          <div className="mt-4">
            <h3 className="label mb-2 text-xs uppercase tracking-wider text-[var(--os-fg-faint)]">
              What I&apos;m drawn to
            </h3>
            <ul className="space-y-1.5">
              {profile.whatImDrawnTo.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-relaxed text-[var(--os-fg-muted)]"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--os-accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {profile.howIWorkWithAi && (
          <div className="mt-5 border-t border-[var(--os-line)] pt-3">
            <h3 className="label mb-1.5 text-xs uppercase tracking-wider text-[var(--os-fg-faint)]">
              How I work with AI
            </h3>
            <p className="max-w-[58ch] text-sm leading-relaxed text-[var(--os-fg-muted)]">
              {profile.howIWorkWithAi}
            </p>
          </div>
        )}
      </Section>

      {/* ── timeline ── */}
      {timeline.length > 0 && (
        <Section id="timeline" title="Career Timeline">
          <ol className="relative ml-2 space-y-6 border-l border-[var(--os-line-strong)] pl-5">
            {timeline.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full border border-[var(--os-accent)] bg-[var(--os-ground)]" />
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium text-[var(--os-fg)]">
                    {entry.title}
                  </span>
                  <span className="font-mono text-[0.68rem] text-[var(--os-fg-faint)]">
                    {entry.startDate}
                    {entry.endDate ? ` — ${entry.endDate}` : entry.isCurrent ? " — Present" : ""}
                  </span>
                  {entry.organization && (
                    <span className="text-xs text-[var(--os-fg-muted)]">
                      · {entry.organization}
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-[58ch] text-xs leading-relaxed text-[var(--os-fg-muted)]">
                  {entry.shortDescription}
                </p>
                {entry.technologies.length > 0 && (
                  <p className="mt-1.5 font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
                    {entry.technologies.join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* ── skills ── */}
      <Section id="skills" title="Skills">
        <dl className="space-y-4">
          {skills.map((cat) => (
            <div key={cat.id} className="grid gap-1.5 sm:grid-cols-[10rem_1fr]">
              <dt className="label pt-0.5">{cat.name}</dt>
              <dd className="text-sm leading-relaxed text-[var(--os-fg-muted)]">
                {cat.skills.map((s) => s.name).join(" · ")}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── projects ── */}
      <Section id="projects" title="Projects">
        {CATS.map((c) => {
          const list = projects.filter((p) => p.category === c);
          if (!list.length) return null;
          return (
            <div key={c} className="mb-8 last:mb-0">
              <h3 className="label mb-3">{CATEGORY_LABEL[c]}</h3>
              <ul className="space-y-5">
                {list.map((p) => (
                  <li key={p.slug}>
                    <article>
                      <h4 className="flex flex-wrap items-baseline gap-x-2.5">
                        <span className="text-base font-medium text-[var(--os-fg)]">{p.title}</span>
                        <span className="font-mono text-[0.68rem] text-[var(--os-fg-faint)]">{p.period}</span>
                      </h4>
                      <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-[var(--os-fg-muted)]">
                        {p.description}
                      </p>
                      <p className="mt-2 font-mono text-[0.68rem] leading-relaxed text-[var(--os-fg-faint)]">
                        {p.technologies.join(" · ")}
                      </p>
                      {p.visibility === "public" && p.githubUrl && (
                        <p className="mt-2">
                          <a
                            href={p.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[var(--os-accent)] underline underline-offset-4"
                          >
                            Repository
                          </a>
                        </p>
                      )}
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </Section>

      {/* ── experience ── */}
      {experience.length > 0 && (
        <Section id="experience" title="Experience">
          <ul className="space-y-6">
            {experience.map((exp) => (
              <li key={exp.id}>
                <article>
                  <h4 className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-medium text-[var(--os-fg)]">{exp.role}</span>
                    <span className="text-xs text-[var(--os-fg-muted)]">at {exp.organization}</span>
                    <span className="font-mono text-[0.68rem] text-[var(--os-fg-faint)]">
                      {exp.startDate} — {exp.isCurrent ? "Present" : exp.endDate}
                    </span>
                  </h4>
                  <p className="mt-1 max-w-[58ch] text-xs leading-relaxed text-[var(--os-fg-muted)]">
                    {exp.description}
                  </p>
                  {exp.responsibilities.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.responsibilities.map((r, i) => (
                        <li key={i} className="flex gap-2 text-xs text-[var(--os-fg-muted)]">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--os-line-strong)]" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {exp.technologies.length > 0 && (
                    <p className="mt-2 font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
                      {exp.technologies.join(" · ")}
                    </p>
                  )}
                </article>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── education ── */}
      {education.length > 0 && (
        <Section id="education" title="Education">
          <ul className="space-y-4">
            {education.map((edu) => (
              <li key={edu.id}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium text-[var(--os-fg)]">{edu.degree}</span>
                  <span className="text-xs text-[var(--os-fg-muted)]">— {edu.institution}</span>
                  <span className="font-mono text-[0.68rem] text-[var(--os-fg-faint)]">
                    {edu.startDate} — {edu.isCurrent ? "Present" : edu.endDate}
                  </span>
                </div>
                {edu.description && (
                  <p className="mt-1 text-xs leading-relaxed text-[var(--os-fg-muted)]">
                    {edu.description}
                  </p>
                )}
                {edu.achievements.length > 0 && (
                  <p className="mt-1 text-xs text-[var(--os-fg-faint)]">
                    {edu.achievements.join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── contact ── */}
      <Section id="contact" title="Contact">
        <p className="text-sm leading-relaxed text-[var(--os-fg-muted)]">
          The fastest way to reach me is{" "}
          {github && (
            <>
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--os-accent)] underline underline-offset-4"
              >
                GitHub
              </a>
              {email ? " or by " : "."}
            </>
          )}
          {email && (
            <>
              <a
                href={`mailto:${email}`}
                className="text-[var(--os-accent)] underline underline-offset-4"
              >
                email
              </a>
              .
            </>
          )}
        </p>

        {socialLinks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {socialLinks.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--os-accent)] underline underline-offset-4"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
      </Section>

      <footer className="mt-16 border-t border-[var(--os-line)] pt-6">
        <p className="font-mono text-[0.65rem] leading-relaxed text-[var(--os-fg-faint)]">
          This page is the plain view. The same content is also a small operating
          system — it loads by default with JavaScript enabled.
        </p>
      </footer>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-14 border-t border-[var(--os-line)] pt-8">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--os-fg)]">
        {title}
      </h2>
      {children}
    </section>
  );
}
