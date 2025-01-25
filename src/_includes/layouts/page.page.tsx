export const layout: SiteLayout = "layouts/default.page.tsx";

export default (
  { comp, title, children, footnotes }: Lume.Data,
  _helpers: Lume.Helpers,
) => {
  return (
    <div class="page">
      <h1 class="page-title">{title}</h1>

      {children}

      <comp.Footnotes footnotes={footnotes} />
    </div>
  );
};
