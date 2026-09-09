"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveProject, deleteProject, type FormState } from "./actions";
import { CATEGORIES, STATUSES, VISIBILITIES } from "@/server/validation";

export interface ProjectFormValues {
  id: string | null;
  name: string; slug: string;
  shortDescription: string; longDescription: string;
  category: string; period: string; team: string;
  githubUrl: string; liveUrl: string; docsUrl: string;
  repoVisibility: string;
  hosted: boolean; featured: boolean; clientWork: boolean;
  status: string; caveat: string;
  technologies: string; features: string; challenges: string;
  learned: string; skills: string;
  aiShortDescription?: string | null;
  aiLongDescription?: string | null;
}

export function ProjectForm({ values }: { values: ProjectFormValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveProject.bind(null, values.id),
    {}
  );

  return (
    <form action={action} className="space-y-7">
      {/* §20 — the importer's suggestion is shown beside your text, never
          written over it. Adopting it is an explicit copy-paste decision. */}
      {values.aiShortDescription && values.aiShortDescription !== values.shortDescription && (
        <div className="rounded-[var(--os-r-panel)] border border-[var(--os-accent)]/30 bg-[var(--os-accent-wash)] p-3">
          <p className="label mb-1.5">AI suggestion — not applied</p>
          <p className="text-sm text-[var(--os-fg-muted)]">{values.aiShortDescription}</p>
        </div>
      )}

      <Fieldset legend="Identity">
        <Row>
          <Field label="Name" name="name" defaultValue={values.name} required />
          <Field label="Slug" name="slug" defaultValue={values.slug} required mono
                 hint="Used in URLs and the terminal's open command." />
        </Row>
        <Field label="Short description" name="shortDescription" defaultValue={values.shortDescription}
               required hint="One line. Shown in list rows." />
        <Field label="Long description" name="longDescription" defaultValue={values.longDescription}
               required textarea rows={5} />
      </Fieldset>

      <Fieldset legend="Classification">
        <Row>
          <Select label="Category" name="category" defaultValue={values.category} options={CATEGORIES} />
          <Select label="Status" name="status" defaultValue={values.status} options={STATUSES}
                  hint="Only PUBLISHED appears on the portfolio." />
        </Row>
        <Row>
          <Field label="Period" name="period" defaultValue={values.period} hint="e.g. Aug 2026" />
          <Field label="Team" name="team" defaultValue={values.team}
                 hint="Credit the group if it wasn't solo." />
        </Row>
      </Fieldset>

      <Fieldset legend="Links">
        <Row>
          <Field label="GitHub URL" name="githubUrl" defaultValue={values.githubUrl} mono />
          <Select label="Repo visibility" name="repoVisibility" defaultValue={values.repoVisibility}
                  options={VISIBILITIES} hint="Only PUBLIC renders a repository link." />
        </Row>
        <Row>
          <Field label="Live URL" name="liveUrl" defaultValue={values.liveUrl} mono />
          <Field label="Docs URL" name="docsUrl" defaultValue={values.docsUrl} mono />
        </Row>
        <Check name="hosted" label="Hosted" defaultChecked={values.hosted}
               hint="Off keeps the URL stored but stops the portfolio using it (§6)." />
      </Fieldset>

      <Fieldset legend="Content">
        <Field label="Technologies" name="technologies" defaultValue={values.technologies}
               hint="Comma separated." />
        <Field label="Skills" name="skills" defaultValue={values.skills} hint="Comma separated." />
        <Field label="Features" name="features" defaultValue={values.features} textarea rows={5}
               hint="One per line." />
        <Field label="What fought back" name="challenges" defaultValue={values.challenges} textarea rows={5}
               hint="One per line." />
        <Field label="What I learned" name="learned" defaultValue={values.learned} textarea rows={4}
               hint="One per line." />
      </Fieldset>

      <Fieldset legend="Honesty flags">
        <Check name="featured" label="Featured" defaultChecked={values.featured} />
        <Check name="clientWork" label="Client work" defaultChecked={values.clientWork}
               hint="Shown to the reader so group or paid work is never implied as solo." />
        <Field label="Caveat" name="caveat" defaultValue={values.caveat}
               hint="Any limitation worth stating up front. Rendered as a warning." />
      </Fieldset>

      {state.error && (
        <p role="alert" className="rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/30 bg-[var(--os-crit)]/[0.08] px-3 py-2 text-sm">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-[var(--os-r-chip)] border border-[var(--os-ok)]/30 bg-[var(--os-ok)]/[0.08] px-3 py-2 text-sm">
          {state.ok}
        </p>
      )}

      <div className="flex items-center gap-2 border-t border-[var(--os-line)] pt-5">
        <button
          type="submit"
          disabled={pending}
          className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-4 py-2 text-sm font-medium text-[var(--os-accent-fg)] disabled:opacity-60"
        >
          {pending ? "Saving…" : values.id ? "Save changes" : "Create project"}
        </button>
        <Link href="/admin/projects" className="px-3 py-2 text-sm text-[var(--os-fg-muted)] hover:text-[var(--os-fg)]">
          Cancel
        </Link>

        {values.id && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this project and its applications? This cannot be undone.")) {
                deleteProject(values.id!);
              }
            }}
            className="pressable ml-auto rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/40 px-3 py-2 text-sm text-[var(--os-crit)] hover:bg-[var(--os-crit)]/10"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

/* ───────────────────────────── controls ───────────────────────────── */

const inputCls =
  "w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-sm text-[var(--os-fg)] outline-none transition-colors focus:border-[var(--os-accent)]";

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="label mb-3">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label, name, defaultValue, hint, textarea, rows = 3, required, mono,
}: {
  label: string; name: string; defaultValue?: string; hint?: string;
  textarea?: boolean; rows?: number; required?: boolean; mono?: boolean;
}) {
  const cls = `${inputCls} ${mono ? "font-mono text-xs" : ""}`;
  return (
    <div>
      <label htmlFor={name} className="label mb-1.5 block">
        {label}{required && <span className="text-[var(--os-crit)]"> *</span>}
      </label>
      {textarea ? (
        <textarea id={name} name={name} rows={rows} defaultValue={defaultValue} required={required} className={cls} />
      ) : (
        <input id={name} name={name} defaultValue={defaultValue} required={required} className={cls} />
      )}
      {hint && <p className="mt-1 text-[0.68rem] text-[var(--os-fg-faint)]">{hint}</p>}
    </div>
  );
}

function Select({
  label, name, defaultValue, options, hint,
}: {
  label: string; name: string; defaultValue?: string; options: readonly string[]; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="label mb-1.5 block">{label}</label>
      <select id={name} name={name} defaultValue={defaultValue} className={inputCls}>
        {options.map((o) => <option key={o} value={o}>{o.toLowerCase()}</option>)}
      </select>
      {hint && <p className="mt-1 text-[0.68rem] text-[var(--os-fg-faint)]">{hint}</p>}
    </div>
  );
}

function Check({
  name, label, defaultChecked, hint,
}: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <div className="flex gap-2.5">
      <input
        id={name} name={name} type="checkbox" defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 accent-[var(--os-accent)]"
      />
      <div>
        <label htmlFor={name} className="text-sm text-[var(--os-fg)]">{label}</label>
        {hint && <p className="text-[0.68rem] leading-relaxed text-[var(--os-fg-faint)]">{hint}</p>}
      </div>
    </div>
  );
}
