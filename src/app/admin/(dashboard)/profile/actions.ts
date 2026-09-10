"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { logRevision } from "@/server/revisions";

export async function updateProfile(formData: FormData) {
  const user = await requireAdmin();

  const fullName = String(formData.get("fullName") || "").trim();
  const shortName = String(formData.get("shortName") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const aboutMe = String(formData.get("aboutMe") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const availabilityStatus = String(formData.get("availabilityStatus") || "Open to opportunities").trim();

  const careerInterestsRaw = String(formData.get("careerInterests") || "");
  const careerInterests = careerInterestsRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const whatImDrawnToRaw = String(formData.get("whatImDrawnTo") || "");
  const whatImDrawnTo = whatImDrawnToRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const howIWorkWithAi = String(formData.get("howIWorkWithAi") || "").trim() || null;
  const avatarUrl = String(formData.get("avatarUrl") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const websiteUrl = String(formData.get("websiteUrl") || "").trim() || null;
  const githubUrl = String(formData.get("githubUrl") || "").trim() || null;
  const linkedinUrl = String(formData.get("linkedinUrl") || "").trim() || null;
  const twitterUrl = String(formData.get("twitterUrl") || "").trim() || null;

  if (!fullName || !shortName || !title) {
    return { error: "Full Name, Short Name, and Title are required." };
  }

  const existing = await db.profile.findFirst();

  let updated;
  if (existing) {
    updated = await db.profile.update({
      where: { id: existing.id },
      data: {
        fullName,
        shortName,
        title,
        tagline,
        bio,
        aboutMe,
        location,
        availabilityStatus,
        careerInterests,
        whatImDrawnTo,
        howIWorkWithAi,
        avatarUrl,
        email,
        phone,
        websiteUrl,
        githubUrl,
        linkedinUrl,
        twitterUrl,
      },
    });

    await logRevision({
      entityType: "Profile",
      entityId: existing.id,
      action: "UPDATE",
      before: existing,
      after: updated,
      author: user.email,
      changeSummary: "Updated Profile details via Admin Panel",
    });
  } else {
    updated = await db.profile.create({
      data: {
        fullName,
        shortName,
        title,
        tagline,
        bio,
        aboutMe,
        location,
        availabilityStatus,
        careerInterests,
        whatImDrawnTo,
        howIWorkWithAi,
        avatarUrl,
        email,
        phone,
        websiteUrl,
        githubUrl,
        linkedinUrl,
        twitterUrl,
      },
    });

    await logRevision({
      entityType: "Profile",
      entityId: updated.id,
      action: "CREATE",
      before: null,
      after: updated,
      author: user.email,
      changeSummary: "Created Profile via Admin Panel",
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/profile");
  return { success: true };
}
