export const layout: SiteLayout = "layouts/default.page.tsx";

export const title = "404: Page not found";

export default (_helpers: Lume.Data, { url }: Lume.Helpers) => {
  return (
    <main class="container content">
      <h1>404: Page not found</h1>
      <p>
        Sorry, we've misplaced that URL or it's pointing to something that
        doesn't exist. <a href={url("/")}>Head back home</a>{" "}
        to try finding it again.
      </p>
    </main>
  );
};
