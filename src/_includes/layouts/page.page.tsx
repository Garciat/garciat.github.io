export const layout: SiteLayout = "layouts/default.page.tsx";

export default (
  page: Lume.Data,
  h: Lume.Helpers,
) => {
  const { comp, children } = page;

  return (
    <div class="page">
      <h1 class="page-title">{page.title}</h1>

      {page.last_update && (
        <div class="post-meta">
          <div class="post-date">
            Updated on: {h.date(page.last_update, "HUMAN_DATE")}
          </div>
        </div>
      )}

      {children}

      <comp.Footnotes footnotes={page.footnotes} />
    </div>
  );
};
