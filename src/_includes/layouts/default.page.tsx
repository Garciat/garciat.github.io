export const layout: SiteLayout = "layouts/base.page.tsx";

export default (
  { comp, url, children }: Lume.Data,
  _helpers: Lume.Helpers,
) => {
  return (
    <>
      <comp.Navigation url={url} />

      <div class="content container">
        {children}
      </div>

      <comp.Footer />
    </>
  );
};
