"use client";

import { useState } from "react";
import { updateProfile } from "./actions";

interface ProfileData {
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
  howIWorkWithAi?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
}

export function ProfileForm({ initial }: { initial: ProfileData }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateProfile(formData);
      if (res.error) {
        setMsg({ type: "err", text: res.error });
      } else {
        setMsg({ type: "ok", text: "Profile updated successfully!" });
      }
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* ── Basic Info ── */}
      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
        <h2 className="label mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--os-fg)]">
          Basic Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5 block">Full Name</label>
            <input
              name="fullName"
              defaultValue={initial.fullName}
              required
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Short / Display Name</label>
            <input
              name="shortName"
              defaultValue={initial.shortName}
              required
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Professional Title / Role</label>
            <input
              name="title"
              defaultValue={initial.title}
              required
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Location</label>
            <input
              name="location"
              defaultValue={initial.location}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label mb-1.5 block">Tagline / Hero Hook</label>
            <input
              name="tagline"
              defaultValue={initial.tagline}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Availability Status</label>
            <input
              name="availabilityStatus"
              defaultValue={initial.availabilityStatus}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Avatar URL</label>
            <input
              name="avatarUrl"
              defaultValue={initial.avatarUrl || ""}
              placeholder="https://..."
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* ── Biography & Prose ── */}
      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
        <h2 className="label mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--os-fg)]">
          Bio & Narrative
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label mb-1.5 block">Short Bio (1-2 sentences)</label>
            <textarea
              name="bio"
              rows={2}
              defaultValue={initial.bio}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Full About Me</label>
            <textarea
              name="aboutMe"
              rows={4}
              defaultValue={initial.aboutMe}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">
              What I&apos;m Drawn To (one bullet per line)
            </label>
            <textarea
              name="whatImDrawnTo"
              rows={4}
              defaultValue={initial.whatImDrawnTo.join("\n")}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">How I Work With AI (Engineering Tooling Philosophy)</label>
            <textarea
              name="howIWorkWithAi"
              rows={3}
              defaultValue={initial.howIWorkWithAi || ""}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">
              Career Interests (one per line)
            </label>
            <textarea
              name="careerInterests"
              rows={3}
              defaultValue={initial.careerInterests.join("\n")}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* ── Contact & Socials ── */}
      <section className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-5">
        <h2 className="label mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--os-fg)]">
          Contact & Social Links
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5 block">Email</label>
            <input
              type="email"
              name="email"
              defaultValue={initial.email || ""}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">GitHub URL</label>
            <input
              name="githubUrl"
              defaultValue={initial.githubUrl || ""}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">LinkedIn URL</label>
            <input
              name="linkedinUrl"
              defaultValue={initial.linkedinUrl || ""}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Twitter / X URL</label>
            <input
              name="twitterUrl"
              defaultValue={initial.twitterUrl || ""}
              className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 text-xs text-[var(--os-fg)] focus:border-[var(--os-accent)] focus:outline-none"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-5 py-2 text-xs font-medium text-[var(--os-accent-fg)] disabled:opacity-50"
        >
          {loading ? "Saving Changes..." : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
