import { getConfigUserGistsURL } from "./_includes/github.ts";

export const type = "page";

export const top_nav = true;

export const layout: SiteLayout = "layouts/default.page.tsx";

export const title = "Gists";

export const description =
  "A list of all of my GitHub gists that are viewable in the browser.";

export default (
  { config, search }: Lume.Data,
  h: Lume.Helpers,
) => {
  const pages = search.pages<GistPageData>("type=gist", "created_at=desc");

  return (
    <main class="page container content">
      <header>
        <h1>{title}</h1>
      </header>
      <p>
        These are some of{" "}
        <a href={getConfigUserGistsURL(config)}>
          my GitHub gists
        </a>{" "}
        that are viewable in the browser.
      </p>
      <section class="gists-grid">
        {pages.map((page) => (
          <>
            <article class="gist">
              <header>
                <h3>
                  <a href={h.url(page.url)} class="flat">
                    {page.gist_title}
                  </a>
                </h3>
              </header>
              {page.screenshots["1x1"] && (
                <a class="screenshot" href={h.url(page.url)}>
                  <img
                    src={h.url(page.screenshots["1x1"])}
                    width={200}
                    height={200}
                  />
                </a>
              )}
            </article>
          </>
        ))}
      </section>
    </main>
  );
};
