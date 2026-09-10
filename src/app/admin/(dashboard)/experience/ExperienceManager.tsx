"use client";

import { useState } from "react";
import { createExperience, deleteExperience, createEducation, deleteEducation } from "./actions";

interface ExpItem {
  id: string;
  organization: string;
  role: string;
  employmentType: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  order: number;
}

interface EduItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  achievements: string[];
  order: number;
}

export function ExperienceManager({
  experience,
  education,
}: {
  experience: ExpItem[];
  education: EduItem[];
}) {
  const [tab, setTab] = useState<"experience" | "education">("experience");
  const [showExpForm, setShowExpForm] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleAddExp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createExperience(formData);
      if (res.error) setMsg({ type: "err", text: res.error });
      else {
        setMsg({ type: "ok", text: "Experience added!" });
        setShowExpForm(false);
      }
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEdu(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createEducation(formData);
      if (res.error) setMsg({ type: "err", text: res.error });
      else {
        setMsg({ type: "ok", text: "Education added!" });
        setShowEduForm(false);
      }
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteExp(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    setLoading(true);
    try {
      await deleteExperience(id);
      setMsg({ type: "ok", text: `Deleted "${title}".` });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEdu(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    setLoading(true);
    try {
      await deleteEducation(id);
      setMsg({ type: "ok", text: `Deleted "${title}".` });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--os-line)] pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("experience")}
            className={`rounded-[var(--os-r-chip)] px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "experience"
                ? "bg-[var(--os-accent)] text-[var(--os-accent-fg)]"
                : "border border-[var(--os-line)] text-[var(--os-fg-muted)] hover:bg-[var(--os-surface-2)]"
            }`}
          >
            Work Experience ({experience.length})
          </button>
          <button
            onClick={() => setTab("education")}
            className={`rounded-[var(--os-r-chip)] px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "education"
                ? "bg-[var(--os-accent)] text-[var(--os-accent-fg)]"
                : "border border-[var(--os-line)] text-[var(--os-fg-muted)] hover:bg-[var(--os-surface-2)]"
            }`}
          >
            Education & Degrees ({education.length})
          </button>
        </div>

        {tab === "experience" ? (
          <button
            onClick={() => setShowExpForm(!showExpForm)}
            className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1.5 text-xs font-medium text-[var(--os-accent-fg)]"
          >
            {showExpForm ? "Cancel" : "+ Add Experience"}
          </button>
        ) : (
          <button
            onClick={() => setShowEduForm(!showEduForm)}
            className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1.5 text-xs font-medium text-[var(--os-accent-fg)]"
          >
            {showEduForm ? "Cancel" : "+ Add Education"}
          </button>
        )}
      </div>

      {msg && (
        <div
          className={`rounded-[var(--os-r-panel)] p-3 text-xs font-mono ${
            msg.type === "ok"
              ? "bg-[var(--os-ok-wash)] text-[var(--os-ok)] border border-[var(--os-ok)]/30"
              : "bg-[var(--os-crit-wash)] text-[var(--os-crit)] border border-[var(--os-crit)]/30"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Tab: Work Experience */}
      {tab === "experience" && (
        <div className="space-y-4">
          {showExpForm && (
            <form
              onSubmit={handleAddExp}
              className="rounded-[var(--os-r-panel)] border border-[var(--os-accent)] bg-[var(--os-surface-1)] p-4 space-y-3"
            >
              <h3 className="text-xs font-semibold text-[var(--os-fg)]">Add Work Experience</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label mb-1 block">Role / Title</label>
                  <input
                    name="role"
                    required
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">Organization / Company</label>
                  <input
                    name="organization"
                    required
                    placeholder="e.g. Telecel / Freelance"
                    className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">Start Date</label>
                  <input
                    name="startDate"
                    required
                    placeholder="Jan 2024"
                    className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">End Date (or check Current)</label>
                  <input
                    name="endDate"
                    placeholder="Present"
                    className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="isCurrentExp" name="isCurrent" />
                <label htmlFor="isCurrentExp" className="text-xs text-[var(--os-fg)]">
                  Current Role
                </label>
              </div>

              <div>
                <label className="label mb-1 block">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  required
                  placeholder="Overview of duties and team context"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>

              <div>
                <label className="label mb-1 block">Responsibilities (one per line)</label>
                <textarea
                  name="responsibilities"
                  rows={3}
                  placeholder="Designed REST APIs&#10;Reduced latency by 40%"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>

              <div>
                <label className="label mb-1 block">Technologies (comma-separated)</label>
                <input
                  name="technologies"
                  placeholder="TypeScript, PostgreSQL, Docker"
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpForm(false)}
                  className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-2.5 py-1 text-xs text-[var(--os-fg-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1 text-xs font-medium text-[var(--os-accent-fg)]"
                >
                  Save Role
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[var(--os-line)] rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)]">
            {experience.map((exp) => (
              <div key={exp.id} className="flex items-start justify-between gap-3 p-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-sm font-semibold text-[var(--os-fg)]">{exp.role}</h4>
                    <span className="text-xs text-[var(--os-fg-muted)]">at {exp.organization}</span>
                    <span className="font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
                      {exp.startDate} — {exp.isCurrent ? "Present" : exp.endDate}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--os-fg-muted)]">{exp.description}</p>
                  {exp.technologies.length > 0 && (
                    <p className="mt-1.5 font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
                      {exp.technologies.join(", ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteExp(exp.id, `${exp.role} at ${exp.organization}`)}
                  className="rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/30 px-2.5 py-1 text-xs text-[var(--os-crit)] hover:bg-[var(--os-crit-wash)]"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Education */}
      {tab === "education" && (
        <div className="space-y-4">
          {showEduForm && (
            <form
              onSubmit={handleAddEdu}
              className="rounded-[var(--os-r-panel)] border border-[var(--os-accent)] bg-[var(--os-surface-1)] p-4 space-y-3"
            >
              <h3 className="text-xs font-semibold text-[var(--os-fg)]">Add Education Record</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label mb-1 block">Institution</label>
                  <input
                    name="institution"
                    required
                    placeholder="e.g. Kwame Nkrumah University of Science and Technology"
                    className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">Degree</label>
                  <input
                    name="degree"
                    required
                    placeholder="e.g. BSc Computer Science"
                    className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">Start Date</label>
                  <input
                    name="startDate"
                    required
                    placeholder="2023"
                    className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">End Date</label>
                  <input
                    name="endDate"
                    placeholder="2026"
                    className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="label mb-1 block">Description & Coursework</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Coursework in operating systems, algorithms, networking..."
                  className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEduForm(false)}
                  className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-2.5 py-1 text-xs text-[var(--os-fg-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1 text-xs font-medium text-[var(--os-accent-fg)]"
                >
                  Save Record
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[var(--os-line)] rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)]">
            {education.map((edu) => (
              <div key={edu.id} className="flex items-start justify-between gap-3 p-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-sm font-semibold text-[var(--os-fg)]">{edu.degree}</h4>
                    <span className="text-xs text-[var(--os-fg-muted)]">— {edu.institution}</span>
                    <span className="font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
                      {edu.startDate} — {edu.isCurrent ? "Present" : edu.endDate}
                    </span>
                  </div>
                  {edu.description && (
                    <p className="mt-1 text-xs text-[var(--os-fg-muted)]">{edu.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteEdu(edu.id, `${edu.degree} from ${edu.institution}`)}
                  className="rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/30 px-2.5 py-1 text-xs text-[var(--os-crit)] hover:bg-[var(--os-crit-wash)]"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
