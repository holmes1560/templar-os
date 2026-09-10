import { db } from "@/lib/db";
import { requireAdmin } from "@/server/auth";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  await requireAdmin();

  let profile = await db.profile.findFirst();

  const initial = profile || {
    fullName: "Asenso Owusu Ansah",
    shortName: "Asenso",
    title: "Computer Science · KNUST",
    tagline: "I build across the whole stack — React interfaces, typed backends, ESP32 firmware, and the 3D-printed case it all lives in.",
    bio: "Computer science student and builder working across typed web backends, responsive user interfaces, embedded IoT firmware, and network forensics.",
    aboutMe: "I build software across an unusually wide range of layers, mostly because I kept refusing to pick one. In a single year I wrote ESP32 firmware for a door lock, an escrow ledger that never stores a balance, and a desktop app that spends most of its energy working around LibreOffice.",
    location: "Kumasi, Ghana",
    availabilityStatus: "Open to opportunities",
    careerInterests: ["Full-Stack Engineering", "Distributed Systems", "Embedded Systems / IoT", "Cybersecurity & Network Forensics"],
    whatImDrawnTo: [
      "Systems where the failure mode matters more than the happy path.",
      "Measuring things properly instead of guessing — and admitting it when the measurement was wrong.",
      "The seam between software and hardware, where the abstractions stop helping.",
      "Security as a design constraint rather than a feature bolted on later.",
    ],
    howIWorkWithAi: "I use AI tooling heavily — for research, for debugging, for getting a first implementation on screen fast, and for reviewing my own code. A review of one of my backends surfaced 21 real bugs I had missed. The decisions, the architecture and the final implementation are mine; the iteration speed is not something I'm going to pretend I did without help.",
    avatarUrl: null,
    email: null,
    phone: null,
    websiteUrl: null,
    githubUrl: "https://github.com/holmes1560",
    linkedinUrl: null,
    twitterUrl: null,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--os-fg)]">
          Profile Management
        </h1>
        <p className="text-sm text-[var(--os-fg-muted)]">
          Manage your personal information, narrative bio, career interests, and contact coordinates.
        </p>
      </div>

      <ProfileForm initial={initial} />
    </div>
  );
}
