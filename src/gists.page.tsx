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
  return (
    <main class="page container content">
      <header>
        <h1>{title}</h1>
      </header>
      <p>
        This is a list of all of{" "}
        <a href={getConfigUserGistsURL(config)}>
          my GitHub gists
        </a>{" "}
        that contain HTML files.
      </p>
      {search.pages<GistPageData>("type=gist", "created_at=desc").map((
        page,
      ) => (
        <>
          <hr />
          <article class="gist">
            <header>
              <h3>
                <a href={h.url(page.url)}>
                  {page.gist_title}
                </a>
              </h3>
              <time datetime={page.date.toISOString()}>
                {h.date(page.date, "MMM dd, yyyy")}
              </time>
            </header>
            {page.description && <p>{page.description}</p>}
            <ul class="pills">
              {page.displayables.map((file) => (
                <li>
                  <a href={h.url(file.url)}>
                    {file.name}
                  </a>
                </li>
              ))}
            </ul>
          </article>
        </>
      ))}
    </main>
  );
};
