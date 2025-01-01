import moment from "npm:moment";

export const layout = "layouts/default.tsx";

export default (
  page: Lume.Data & { gist: Gist },
  { url, date }: Lume.Helpers,
) => {
  return (
    <div class="gist">
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
    </div>
  );
};
