export const layout: SiteLayout = "layouts/base.page.tsx";

export default (
  page: Lume.Data & GistPageData,
  h: Lume.Helpers,
) => {
  const { search } = page;

  const displayables = search.pages<GistFileData>(
    `type=gist-file gist_id=${page.gist_id} is_displayable=true`,
  );

  return (
    <>
      <nav class="post-navigation container content">
        <a href={h.url("/gists/")}>
          &#8676; Back
        </a>
      </nav>
      <main class="container content gist-page">
        <header>
          <h1>{page.gist_title}</h1>
          <section class="hstack-left">
            <time class="weak" datetime={h.date(page.date)}>
              {h.date(page.date, "HUMAN_DATE")}
            </time>
            <a href={page.gist_url}>
              View gist on GitHub
            </a>
          </section>
        </header>

        {page.description && <p>{page.description}</p>}

        {displayables.map((file) => (
          <article>
            <header class="hstack-left">
              <h2>{file.name}</h2>
              <a href={h.url(file.url)}>
                Open in full screen
              </a>
            </header>
            <iframe
              src={h.url(file.url)}
            />
          </article>
        ))}
      </main>
    </>
  );
};
