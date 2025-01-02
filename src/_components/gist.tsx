import moment from "npm:moment";

export const layout = "layouts/default.tsx";

interface GistComponentProps {
  pageUrl: string;
  gist: Gist;
}

export default (
  { pageUrl, gist }: GistComponentProps,
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
            {date(gist.created_at)}
          </time>
        </span>
        {" — "}
        <span>
          {"Updated  "}
          <time datetime={gist.updated_at.toISOString()}>
            {moment(gist.updated_at).fromNow()}
          </time>
        </span>
      </p>
      <p class="message" hidden={!gist.description}>{gist.description}</p>
      <ul>
        {gist.files.map((file) => (
          <li>
            <a href={url(`/gists/${gist.id}/${file.name}`)}>
              <code>{file.name}</code>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
