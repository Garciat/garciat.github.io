export const layout = "layouts/default.tsx";

export default (
  data: Lume.Data & GistPageData,
  _helpers: Lume.Helpers,
) => {
  return (
    <data.comp.Gist
      pageUrl={data.url}
      gist={data.gist}
    />
  );
};
