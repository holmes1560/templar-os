"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveApplication, deleteApplication, type FormState } from "./actions";
import { LAUNCH_MODES } from "@/server/validation";

export interface AppFormValues {
  id: string | null;
  appKey: string; name: string; icon: string;
  launchMode: string; url: string; projectId: string;
  enabled: boolean; desktopVisible: boolean;
  workspace: number; cell: number;
  windowWidth: number; windowHeight: number;
  resizable: boolean; maximizable: boolean; minimizable: boolean;
}

const ICONS = [
  "folder", "globe", "terminal", "user", "chart", "doc",
  "mail", "files", "github", "pulse", "cog", "note",
];

const MODE_HELP: Record<string, string> = {
  IFRAME: "Runs the live site in a window. Only works if that deployment sends frame-ancestors permitting this origin — if it refuses, the window falls back to the project overview.",
  EXTERNAL: "Opens the real site in a new tab.",
  INTERNAL: "A screen built into the OS, routed by the application key.",
  DEMO: "Opens the linked project's overview — description, technologies, challenges and real links. Needs no live backend, so it is the safe choice when nothing is hosted.",
};

export function ApplicationForm({
  values, projects,
}: {
  values: AppFormValues;
  projects: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveApplication.bind(null, values.id),
    {}
  );
  const [mode, setMode] = useState(values.launchMode);
  const needsUrl = mode === "IFRAME" || mode === "EXTERNAL";

  return (
    <form action={action} className="space-y-7">
      <Fieldset legend="Identity">
        <Row>
          <Field label="Name" name="name" defaultValue={values.name} required
                 hint="Shown under the desktop icon." />
          <Field label="Application key" name="appKey" defaultValue={values.appKey} required mono
                 hint="Stable id the OS routes on. Changing it on a built-in app breaks it." />
        </Row>
        <Row>
          <div>
            <label htmlFor="icon" className="label mb-1.5 block">Icon</label>
            <select id="icon" name="icon" defaultValue={values.icon} className={inputCls}>
              {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="projectId" className="label mb-1.5 block">Project</label>
            <select id="projectId" name="projectId" defaultValue={values.projectId} className={inputCls}>
              <option value="">— none (system app) —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </Row>
      </Fieldset>

      <Fieldset legend="Launch behaviour">
        <div>
          <label htmlFor="launchMode" className="label mb-1.5 block">Launch mode</label>
          <select
            id="launchMode" name="launchMode" value={mode}
            onChange={(e) => setMode(e.target.value)}
            className={inputCls}
          >
            {LAUNCH_MODES.map((m) => <option key={m} value={m}>{m.toLowerCase()}</option>)}
          </select>
          <p className="mt-1 text-[0.68rem] text-[var(--os-fg-faint)]">{MODE_HELP[mode]}</p>
        </div>

        <Field
          label={`URL${needsUrl ? "" : " (unused in this mode)"}`}
          name="url" defaultValue={values.url} mono
          hint={needsUrl
            ? "Required. Changing it here changes where the app launches — no deploy."
            : "Stored but not used unless the mode is iframe or external."}
        />
      </Fieldset>

      <Fieldset legend="Desktop placement">
        <Row>
          <Field label="Workspace" name="workspace" type="number" defaultValue={String(values.workspace)}
                 hint="0 Home · 1 Projects · 2 Cyber Lab · 3 Experiments" />
          <Field label="Grid cell" name="cell" type="number" defaultValue={String(values.cell)}
                 hint="Fills top-to-bottom, then left-to-right." />
        </Row>
        <Check name="enabled" label="Enabled" defaultChecked={values.enabled}
               hint="Off hides it everywhere, including the launcher." />
        <Check name="desktopVisible" label="Show on desktop" defaultChecked={values.desktopVisible}
               hint="Off keeps it in the launcher but off the desktop grid." />
      </Fieldset>

      <Fieldset legend="Window">
        <Row>
          <Field label="Width" name="windowWidth" type="number" defaultValue={String(values.windowWidth)} />
          <Field label="Height" name="windowHeight" type="number" defaultValue={String(values.windowHeight)} />
        </Row>
        <div className="flex flex-wrap gap-5">
          <Check name="resizable" label="Resizable" defaultChecked={values.resizable} />
          <Check name="maximizable" label="Maximizable" defaultChecked={values.maximizable} />
          <Check name="minimizable" label="Minimizable" defaultChecked={values.minimizable} />
        </div>
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
          type="submit" disabled={pending}
          className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-4 py-2 text-sm font-medium text-[var(--os-accent-fg)] disabled:opacity-60"
        >
          {pending ? "Saving…" : values.id ? "Save changes" : "Create application"}
        </button>
        <Link href="/admin/applications" className="px-3 py-2 text-sm text-[var(--os-fg-muted)] hover:text-[var(--os-fg)]">
          Cancel
        </Link>

        {values.id && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this application? The project itself is untouched.")) {
                deleteApplication(values.id!);
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

const inputCls =
  "w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-sm text-[var(--os-fg)] outline-none transition-colors focus:border-[var(--os-accent)]";

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return <fieldset className="space-y-4"><legend className="label mb-3">{legend}</legend>{children}</fieldset>;
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
function Field({
  label, name, defaultValue, hint, required, mono, type = "text",
}: {
  label: string; name: string; defaultValue?: string; hint?: string;
  required?: boolean; mono?: boolean; type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="label mb-1.5 block">
        {label}{required && <span className="text-[var(--os-crit)]"> *</span>}
      </label>
      <input
        id={name} name={name} type={type} defaultValue={defaultValue} required={required}
        className={`${inputCls} ${mono ? "font-mono text-xs" : ""}`}
      />
      {hint && <p className="mt-1 text-[0.68rem] text-[var(--os-fg-faint)]">{hint}</p>}
    </div>
  );
}
function Check({
  name, label, defaultChecked, hint,
}: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <div className="flex gap-2.5">
      <input id={name} name={name} type="checkbox" defaultChecked={defaultChecked}
             className="mt-0.5 h-4 w-4 accent-[var(--os-accent)]" />
      <div>
        <label htmlFor={name} className="text-sm text-[var(--os-fg)]">{label}</label>
        {hint && <p className="text-[0.68rem] leading-relaxed text-[var(--os-fg-faint)]">{hint}</p>}
      </div>
    </div>
  );
}
