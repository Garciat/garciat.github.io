export const layout: SiteLayout = "layouts/default.page.tsx";

export default (
  data: Lume.Data & GistPageData,
  h: Lume.Helpers,
) => {
  return (
    <>
      <p>
        <a href={h.url("/gists/")} class="flat">
          &#8676; Back
        </a>
      </p>
      <data.comp.Gist
        pageUrl={data.url}
        gist={data.gist}
      />
    </>
  );
};
