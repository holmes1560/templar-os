/**
 * Single source of identity for both shells (OS and web view).
 *
 * Anything here appears publicly. Values marked TODO are the ones
 * only Asenso can decide — they are deliberately not guessed.
 */

export const site = {
  name: "Asenso Owusu Ansah",
  shortName: "Asenso",
  system: "TEMPLAR OS",
  systemVersion: "3.0",
  role: "Computer Science · KNUST",

  tagline:
    "I build across the whole stack — React interfaces, typed backends, ESP32 firmware, and the 3D-printed case it all lives in.",

  location: "Kumasi, Ghana",

  // public already — safe to ship
  github: "https://github.com/holmes1560",
  githubUser: "holmes1560",

  // TODO(asenso): confirm before deploying. Publishing an address is your call.
  email: "",
  linkedin: "",

  // TODO(asenso): the real deployed URL, once we have one
  url: "https://example.invalid",

  // TODO(asenso): drop the chosen PDF into /public and point at it.
  // Candidates live in ~/Documents/CV — pick the ATS-optimised one.
  resumePath: "",
} as const;

export const os = {
  user: "guest",
  host: "templar",
  /** shown on the login screen; purely theatrical, never authenticates */
  hint: "guest session · no account needed",
} as const;
