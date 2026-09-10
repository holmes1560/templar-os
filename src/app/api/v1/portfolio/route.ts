import { getPortfolio } from "@/server/portfolio";
import { authenticateRequest, authorizeScope } from "@/server/api-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/portfolio
 *
 * Returns the complete aggregate portfolio payload (Profile, Skills, Timeline,
 * Projects, Experience, Education, Certifications, Achievements, Social Links,
 * Applications, and Settings).
 *
 * Publicly accessible or authenticated with 'portfolio:read'.
 */
export async function GET(req: Request) {
  // Optional auth: if an API key is supplied, verify it; otherwise permit public read
  const hasAuthHeader = req.headers.get("Authorization") || req.headers.get("X-API-Key");
  if (hasAuthHeader) {
    const auth = await authenticateRequest(req);
    const authError = authorizeScope(auth, "portfolio:read");
    if (authError) return authError;
  }

  try {
    const data = await getPortfolio();
    return Response.json({ ok: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load portfolio";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
