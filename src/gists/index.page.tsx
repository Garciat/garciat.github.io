import { getConfigUserGistsURL } from "../_includes/github.ts";

export const type = "page";

export const layout: SiteLayout = "layouts/page.page.tsx";

export const description =
  "A list of all of my GitHub gists that are viewable in the browser.";

export default (
  { comp, config, search }: Lume.Data,
  _helpers: Lume.Helpers,
) => {
  return (
    <>
      <p>
        This is a list of all of{" "}
        <a href={getConfigUserGistsURL(config)} target="_blank">
          my GitHub gists
        </a>{" "}
        that contain HTML files. Click on a file to open it.
      </p>
      <ul class="gists">
        {search.pages<GistPageData>("type=gist", "created_at=desc").map((
          page,
        ) => (
          <li class="item">
            <comp.Gist
              pageUrl={page.url}
              gist={page.gist}
            />
          </li>
        ))}
      </ul>
    </>
  );
};
