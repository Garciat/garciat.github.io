export const layout: SiteLayout = "layouts/default.page.tsx";

export default (
  page: Lume.Data,
  h: Lume.Helpers,
) => {
  const { comp, children } = page;

  return (
    <main class="page container content">
      <header>
        <h1>{page.title}</h1>

        {page.last_update && (
          <div class="post-meta">
            <div class="post-date">
              Updated on: {h.date(page.last_update, "HUMAN_DATE")}
            </div>
          </div>
        )}
      </header>

      <section>
        {children}
      </section>

      <footer>
        <comp.Footnotes footnotes={page.footnotes} />
      </footer>
    </main>
  );
};
