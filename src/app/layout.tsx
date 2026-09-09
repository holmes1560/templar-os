import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { site } from "@/lib/site";
import "./globals.css";

/* IBM Plex: drawn for technical systems, distinctive without being
   fashionable, and the mono is genuinely excellent for terminal chrome. */
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/* §24 — the OS is a client-side shell, so all of this describes the
   server-rendered portfolio that sits underneath it. */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Software Engineer`,
    template: `%s — ${site.name}`,
  },
  description: site.tagline,
  keywords: [
    "Asenso Owusu Ansah",
    "software engineer",
    "Ghana",
    "KNUST",
    "full-stack developer",
    "embedded systems",
    "cybersecurity",
    "Next.js",
    "TypeScript",
    "ESP32",
  ],
  authors: [{ name: site.name, url: site.github }],
  creator: site.name,
  openGraph: {
    type: "profile",
    locale: "en_GB",
    url: site.url,
    title: `${site.name} — Software Engineer`,
    description: site.tagline,
    siteName: site.system,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Software Engineer`,
    description: site.tagline,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090b" },
    { media: "(prefers-color-scheme: light)", color: "#eceef1" },
  ],
  width: "device-width",
  initialScale: 1,
  // an OS shell must not be zoomed into oblivion, but blocking zoom
  // outright fails accessibility — allow it, just don't start there.
  maximumScale: 5,
};

/**
 * The theme is read from a cookie on the server, so the correct value is in
 * the very first byte of HTML — no flash, no hydration mismatch, and no
 * inline script. Next 16 does not execute script tags rendered inside a React
 * component, so the usual "blocking inline script" trick is not available;
 * this is better anyway, because it works with JavaScript disabled.
 *
 * The Settings app writes the cookie alongside its localStorage state.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get("templar_theme")?.value === "light" ? "light" : "dark";

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
