export const type = "page";

export const layout = "layouts/page.tsx";

export const description =
  "A list of all of my GitHub gists that are viewable in the browser.";

export default ({ comp, search }: Lume.Data, _helpers: Lume.Helpers) => {
  return (
    <>
      <p>
        This is a list of all of{" "}
        <a href="https://gist.github.com/Garciat" target="_blank">
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
