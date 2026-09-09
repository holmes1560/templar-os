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
  const { projects } = data;
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      {/* ── hero ── */}
      <header>
        <p className="label mb-4">{site.system} · web view</p>
        <h1 className="text-[clamp(2rem,6vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-[var(--os-fg)]">
          {site.name}
        </h1>
        <p className="mt-3 text-sm text-[var(--os-fg-faint)]">
          {site.role} · {site.location}
        </p>
        <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-[var(--os-fg-muted)]">
          {site.tagline}
        </p>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Primary">
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] px-3.5 py-2 text-sm text-[var(--os-fg)] transition-colors hover:bg-[var(--os-surface-2)]"
          >
            GitHub
          </a>
          {site.email && (
            <a
              href={`mailto:${site.email}`}
              className="rounded-[var(--os-r-chip)] border border-[var(--os-line-strong)] px-3.5 py-2 text-sm text-[var(--os-fg)] transition-colors hover:bg-[var(--os-surface-2)]"
            >
              Email
            </a>
          )}
          {site.resumePath && (
            <a
              href={site.resumePath}
              className="rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3.5 py-2 text-sm font-medium text-[var(--os-accent-fg)]"
            >
              Download CV
            </a>
          )}
        </nav>
      </header>

      {/* ── about ── */}
      <Section id="about" title="About">
        <p className="mb-3 max-w-[58ch] text-sm leading-relaxed text-[var(--os-fg-muted)]">
          I build software across an unusually wide range of layers, mostly because I
          kept refusing to pick one. In a single year I wrote ESP32 firmware for a door
          lock, an escrow ledger that never stores a balance, and a desktop app that
          spends most of its energy working around LibreOffice.
        </p>
        <p className="max-w-[58ch] text-sm leading-relaxed text-[var(--os-fg-muted)]">
          The through-line is that I learn by building the thing, breaking it, and then
          understanding why it broke. I use AI tooling heavily for research, debugging
          and review — the decisions and the architecture are mine, the iteration speed
          isn&apos;t something I&apos;ll pretend I managed alone.
        </p>
      </Section>

      {/* ── skills ── */}
      <Section id="skills" title="Skills">
        <dl className="space-y-4">
          {SKILLS.map(([group, items]) => (
            <div key={group} className="grid gap-1.5 sm:grid-cols-[10rem_1fr]">
              <dt className="label pt-0.5">{group}</dt>
              <dd className="text-sm leading-relaxed text-[var(--os-fg-muted)]">
                {items.join(" · ")}
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

      {/* ── education ── */}
      <Section id="education" title="Education">
        <p className="text-sm leading-relaxed text-[var(--os-fg-muted)]">
          BSc Computer Science — Kwame Nkrumah University of Science and Technology,
          Kumasi. Coursework spanning embedded systems, data structures, AI, computer
          architecture, computer graphics, HCI, operations research and e-commerce.
        </p>
      </Section>

      {/* ── contact ── */}
      <Section id="contact" title="Contact">
        <p className="text-sm leading-relaxed text-[var(--os-fg-muted)]">
          The fastest way to reach me is{" "}
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--os-accent)] underline underline-offset-4"
          >
            GitHub
          </a>
          {site.email ? (
            <>
              {" "}or by{" "}
              <a href={`mailto:${site.email}`} className="text-[var(--os-accent)] underline underline-offset-4">
                email
              </a>
              .
            </>
          ) : (
            "."
          )}
        </p>
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

const SKILLS: [string, string[]][] = [
  ["Languages", ["TypeScript", "JavaScript", "Python", "Java", "C/C++", "SQL"]],
  ["Frontend", ["Next.js", "React", "Tailwind", "Vite"]],
  ["Backend", ["NestJS", "FastAPI", "Express", "Spring Boot", "Prisma", "SQLAlchemy"]],
  ["Mobile", ["React Native", "Expo"]],
  ["Databases", ["PostgreSQL", "MySQL", "Supabase", "Redis"]],
  ["DevOps", ["Docker", "Vercel", "Render", "Railway", "Firebase", "MinIO"]],
  ["Embedded", ["ESP32", "Arduino", "RFID", "I²C/SPI", "OpenSCAD", "3D printing"]],
  ["Security", ["tcpdump", "Wireshark", "mtr", "Kali", "WebAuthn", "RLS"]],
];

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
