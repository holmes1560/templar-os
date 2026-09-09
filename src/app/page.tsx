import { Portfolio } from "@/components/web/Portfolio";
import { Shell } from "@/components/os/Shell";
import { PortfolioProvider } from "@/components/os/PortfolioProvider";
import { getPortfolio } from "@/server/portfolio";

/**
 * ISR. The database is read when the page is (re)generated, not on every
 * request, so visitors are always served static output and a sleeping
 * free-tier Postgres can never sit in the critical path of a page view.
 *
 * Combined with the snapshot fallback in getPortfolio(), the worst case for
 * a visitor is slightly stale content — never an error page (§16).
 */
export const revalidate = 300;

export default async function Home() {
  const data = await getPortfolio();

  return (
    <>
      {/* Opaque from the server response: the portfolio is in the HTML from the
          first byte, so without this it paints for a frame before the OS
          hydrates over it, and shows through during entry crossfades.
          <noscript> removes it — with JS off the OS never mounts, and the
          curtain must not be allowed to hide the real page. */}
      <div id="os-curtain" aria-hidden="true" />
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: "#os-curtain{display:none}" }} />
      </noscript>

      <Portfolio data={data} />

      <PortfolioProvider data={data}>
        <Shell />
      </PortfolioProvider>
    </>
  );
}
