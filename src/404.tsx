export const title = "404: Page not found";

export const layout = "layouts/default.tsx";

export default (_helpers: Lume.Data, { url }: Lume.Helpers) => {
  return (
    <>
      <div class="page">
        <h1 class="page-title">404: Page not found</h1>
        <p class="lead">
          Sorry, we've misplaced that URL or it's pointing to something that
          doesn't exist. <a href={url("/")}>Head back home</a>{" "}
          to try finding it again.
        </p>
      </div>
    </>
  );
};
