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
    <div class="gist">
      <p class="gist-header">
        <a href={url(pageUrl)} class="gist-id" title={gist.id}>
          {gist.title}
        </a>
        <a href={gist.github_url} class="flat" target="_blank">
          view source
        </a>
      </p>
      <p>
        <span>
          {"Created on "}
          <time datetime={gist.created_at.toISOString()}>
            {date(gist.created_at, "HUMAN_DATE")}
          </time>
        </span>
      </p>
      <p class="message" hidden={!gist.description}>{gist.description}</p>
      <ul>
        {gist.files.map((file) => (
          <li>
            <a href={url(`/gists/${gist.id}/${file.name}`)}>
              <code>{file.name}</code>
            </a>{" "}
            <small>{filesize(file.size)}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};
