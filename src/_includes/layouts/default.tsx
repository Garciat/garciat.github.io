export const layout = "layouts/base.tsx";

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
