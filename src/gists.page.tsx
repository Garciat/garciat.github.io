import { getConfigUserGistsURL } from "./_includes/github.ts";
import { pickAll, setDateModified } from "./_includes/utils.ts";

export const type = "page";

export const top_nav = true;

export const layout: SiteLayout = "layouts/default.page.tsx";

export const title = "Gists";

export const description =
  "A list of all of my GitHub gists that are viewable in the browser.";

export default (
  data: Lume.Data,
  h: Lume.Helpers,
) => {
  const { config, search, page } = data;

  const authorRef = `${h.url("/about/", true)}#Person`;

  const pages = search.pages<GistPageData>("type=gist", "created_at=desc");

  setDateModified(page, pickAll("dateModified", pages));

  return (
    <main
      itemscope
      itemtype="http://schema.org/CollectionPage"
      class="page container content"
    >
      <link itemprop="url" href={h.url("/gists/", true)} />
      <header>
        <h1 itemprop="name">{title}</h1>
      </header>
      <aside
        itemprop="author"
        itemscope
        itemtype="http://schema.org/Person"
        itemid={authorRef}
      >
        <link itemprop="url" href={h.url("/about/", true)} />
        <meta itemprop="name" content={config.me.name} />
      </aside>
      <p itemprop="description">
        These are some of{" "}
        <a itemprop="significantLink" href={getConfigUserGistsURL(config)}>
          my GitHub gists
        </a>{" "}
        that are viewable in the browser.
      </p>
      <section
        itemprop="mainEntity"
        itemscope
        itemtype="http://schema.org/ItemList"
        class="gists-grid"
      >
        {pages.map((page) => (
          <>
            <article
              itemprop="itemListElement"
              itemscope
              itemtype="http://schema.org/Article"
              class="gist"
            >
              <link
                itemprop="author"
                href={authorRef}
              />
              <meta itemprop="description" content={page.description} />
              <meta
                itemprop="datePublished"
                content={page.date.toISOString()}
              />
              {page.dateModified && (
                <meta
                  itemprop="dateModified"
                  content={page.dateModified.toISOString()}
                />
              )}

              <header>
                <h3>
                  <a itemprop="url" href={h.url(page.url)} class="flat">
                    <span itemprop="headline">{page.gist_title}</span>
                  </a>
                </h3>
              </header>
              {page.screenshots["1x1"] && (
                <a class="screenshot" href={h.url(page.url)}>
                  <img
                    itemprop="image"
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
