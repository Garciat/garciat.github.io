import { getConfigUserGistsURL } from "./_includes/github.ts";

export const type = "page";

export const top_nav = true;

export const layout: SiteLayout = "layouts/default.page.tsx";

export const title = "Gists";

export const description =
  "A list of all of my GitHub gists that are viewable in the browser.";

export default (
  { comp, config, search }: Lume.Data,
  _helpers: Lume.Helpers,
) => {
  return (
    <main class="page container content">
      <header>
        <h1>{title}</h1>
      </header>
      <p>
        This is a list of all of{" "}
        <a href={getConfigUserGistsURL(config)} target="_blank">
          my GitHub gists
        </a>{" "}
        that contain HTML files. Click on a file to open it.
      </p>
      {search.pages<GistPageData>("type=gist", "created_at=desc").map((
        page,
      ) => (
        <>
          <hr />
          <comp.Gist
            pageUrl={page.url}
            gist={page.gist}
          />
        </>
      ))}
    </main>
  );
};
