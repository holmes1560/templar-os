"use client";

import { useState } from "react";
import { createCategory, createSkill, deleteSkill, deleteCategory } from "./actions";

interface SkillItem {
  id: string;
  name: string;
  description: string | null;
  proficiency: number | null;
  technologies: string[];
  featured: boolean;
  order: number;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  order: number;
  skills: SkillItem[];
}

export function SkillsManager({ categories }: { categories: CategoryItem[] }) {
  const [showCatForm, setShowCatForm] = useState(false);
  const [showSkillCatId, setShowSkillCatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleAddCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createCategory(formData);
      if (res.error) setMsg({ type: "err", text: res.error });
      else {
        setMsg({ type: "ok", text: "Category added!" });
        setShowCatForm(false);
      }
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSkill(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createSkill(formData);
      if (res.error) setMsg({ type: "err", text: res.error });
      else {
        setMsg({ type: "ok", text: "Skill added!" });
        setShowSkillCatId(null);
      }
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSkill(id: string, name: string) {
    if (!confirm(`Delete skill "${name}"?`)) return;
    setLoading(true);
    try {
      await deleteSkill(id);
      setMsg({ type: "ok", text: `Deleted skill "${name}".` });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    setLoading(true);
    try {
      const res = await deleteCategory(id);
      if (res?.error) setMsg({ type: "err", text: res.error });
      else setMsg({ type: "ok", text: `Deleted category "${name}".` });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--os-fg-muted)]">
          {categories.reduce((acc, c) => acc + c.skills.length, 0)} skills across {categories.length} categories.
        </p>
        <button
          onClick={() => setShowCatForm(!showCatForm)}
          className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1.5 text-xs font-medium text-[var(--os-accent-fg)]"
        >
          {showCatForm ? "Cancel" : "+ Add Category"}
        </button>
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

      {/* Add Category Form */}
      {showCatForm && (
        <form
          onSubmit={handleAddCategory}
          className="rounded-[var(--os-r-panel)] border border-[var(--os-accent)] bg-[var(--os-surface-1)] p-4 space-y-3"
        >
          <h3 className="text-xs font-semibold text-[var(--os-fg)]">Create New Skill Category</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label mb-1 block">Category Name</label>
              <input
                name="name"
                required
                placeholder="e.g. Distributed Systems"
                className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
              />
            </div>
            <div>
              <label className="label mb-1 block">Slug</label>
              <input
                name="slug"
                required
                placeholder="distributed-systems"
                className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
              />
            </div>
            <div>
              <label className="label mb-1 block">Order</label>
              <input
                type="number"
                name="order"
                defaultValue={categories.length * 10 + 10}
                className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs text-[var(--os-fg)] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCatForm(false)}
              className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-3 py-1 text-xs text-[var(--os-fg-muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1 text-xs font-medium text-[var(--os-accent-fg)]"
            >
              Save Category
            </button>
          </div>
        </form>
      )}

      {/* Category List */}
      <div className="space-y-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--os-line)] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--os-fg)]">{cat.name}</h3>
                <span className="font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
                  slug: {cat.slug} · order: {cat.order}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSkillCatId(showSkillCatId === cat.id ? null : cat.id)}
                  className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-2.5 py-1 text-xs text-[var(--os-accent)] hover:bg-[var(--os-surface-2)]"
                >
                  + Add Skill
                </button>
                {cat.skills.length === 0 && (
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="rounded-[var(--os-r-chip)] border border-[var(--os-crit)]/30 px-2 py-1 text-xs text-[var(--os-crit)] hover:bg-[var(--os-crit-wash)]"
                  >
                    Delete Category
                  </button>
                )}
              </div>
            </div>

            {/* Add Skill Form for this Category */}
            {showSkillCatId === cat.id && (
              <form
                onSubmit={handleAddSkill}
                className="my-3 rounded-[var(--os-r-chip)] border border-[var(--os-accent)]/50 bg-[var(--os-surface-2)] p-3 space-y-3"
              >
                <input type="hidden" name="categoryId" value={cat.id} />
                <h4 className="text-xs font-medium text-[var(--os-fg)]">Add Skill to {cat.name}</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="label mb-1 block">Skill Name</label>
                    <input
                      name="name"
                      required
                      placeholder="e.g. Next.js"
                      className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-1)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="label mb-1 block">Sub-technologies (comma-separated)</label>
                    <input
                      name="technologies"
                      placeholder="App Router, Server Actions, SSR"
                      className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-1)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="label mb-1 block">Proficiency (1 to 5)</label>
                    <input
                      type="number"
                      name="proficiency"
                      min={1}
                      max={5}
                      defaultValue={4}
                      className="w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-1)] px-2.5 py-1 text-xs text-[var(--os-fg)] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSkillCatId(null)}
                    className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-2.5 py-1 text-xs text-[var(--os-fg-muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="pressable rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-1 text-xs font-medium text-[var(--os-accent-fg)]"
                  >
                    Save Skill
                  </button>
                </div>
              </form>
            )}

            {/* Skills chips in Category */}
            <div className="mt-3 flex flex-wrap gap-2">
              {cat.skills.length === 0 ? (
                <p className="text-xs text-[var(--os-fg-faint)] italic">No skills in this category.</p>
              ) : (
                cat.skills.map((s) => (
                  <div
                    key={s.id}
                    className="group flex items-center gap-1.5 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-fg)]"
                  >
                    <span className="font-medium">{s.name}</span>
                    {s.technologies.length > 0 && (
                      <span className="font-mono text-[0.6rem] text-[var(--os-fg-faint)]">
                        ({s.technologies.slice(0, 2).join(", ")})
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteSkill(s.id, s.name)}
                      className="ml-1 text-[var(--os-fg-faint)] hover:text-[var(--os-crit)]"
                      title="Delete skill"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
