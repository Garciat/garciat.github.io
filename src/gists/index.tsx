import moment from "npm:moment";

export const layout = "layouts/page.tsx";

export const type = "page";

export const title = "Gists";

export default ({ search }: Lume.Data, { url, date }: Lume.Helpers) => {
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
        {search.pages<{ gist: Gist }>("type=gist", "date=desc").map((page) => (
          <li class="gist">
            <header>
              <a href={url(page.url)} class="gist-id" title={page.gist.id}>
                {page.title}
              </a>
              <a href={page.gist.github_url} class="source" target="_blank">
                view{"\u00A0"}source
              </a>
            </header>
            <aside>
              <span>
                <time datetime={page.gist.created_at.toISOString()}>
                  {date(page.gist.created_at)}
                </time>
              </span>
              {" / "}
              <span>
                Updated{"  "}
                <time datetime={page.gist.updated_at.toISOString()}>
                  {moment(page.gist.updated_at).fromNow()}
                </time>
              </span>
            </aside>
            <ul>
              {page.gist.files.map((file) => (
                <li>
                  <a href={url(`/gists/${page.gist.id}/${file.name}`)}>
                    <code>{file.name}</code>
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
};
