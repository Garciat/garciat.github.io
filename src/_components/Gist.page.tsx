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
      <header>
        <section>
          <h3>
            <a href={url(pageUrl)}>
              {gist.title}
            </a>
          </h3>
          <time class="weak" datetime={gist.created_at.toISOString()}>
            {date(gist.created_at, "MMM dd, yyyy")}
          </time>
        </section>
        <nav>
          <a href={gist.github_url} class="flat" target="_blank">
            view source
          </a>
        </nav>
      </header>
      {gist.description && <p>{gist.description}</p>}
      <ul class="pills">
        {gist.files.filter(isDisplayable).map((file) => (
          <li>
            <a href={url(`/gists/${gist.id}/${file.name}`)}>
              {file.name}
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
};

function isDisplayable(file: GistFile) {
  return file.name.endsWith(".html");
}
