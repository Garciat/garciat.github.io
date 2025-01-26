import { filesize } from "npm:filesize";

export const layout: SiteLayout = "layouts/default.page.tsx";

interface GistComponentProps {
  pageUrl: string;
  gist: Gist;
}

export default (
  { pageUrl, gist }: Lume.Data & GistComponentProps,
  { url, date }: Lume.Helpers,
) => {
  return (
    <article class="gist">
      <header class="gist-header">
        <h3>
          <a href={url(pageUrl)} class="gist-id" title={gist.id}>
            {gist.title}
          </a>
          <span class="weak separator">{" \u2014 "}</span>
          <time class="weak" datetime={gist.created_at.toISOString()}>
            {date(gist.created_at, "MMM dd, yyyy")}
          </time>
        </h3>
        <nav>
          <a href={gist.github_url} class="flat" target="_blank">
            view source
          </a>
        </nav>
      </header>
      {gist.description && <p>{gist.description}</p>}
      <ul>
        {gist.files.map((file) => (
          <li>
            <a href={url(`/gists/${gist.id}/${file.name}`)}>
              {file.name}
            </a>{" "}
            <small>{filesize(file.size)}</small>
          </li>
        ))}
      </ul>
    </article>
  );
};
