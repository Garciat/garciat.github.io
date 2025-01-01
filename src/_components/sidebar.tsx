export default ({ search, config, url }: Lume.Data, h: Lume.Helpers) => {
  return (
    <div class="sidebar">
      <div class="container sidebar-sticky">
        <div class="sidebar-about">
          <h1>
            <a href={h.url("/")}>
              {config.title}
            </a>
          </h1>
          <p class="lead">{config.description}</p>
        </div>

        <nav class="sidebar-nav">
          <a
            class={`sidebar-nav-item ${url === "/" ? "active" : ""}`}
            href={h.url("/")}
          >
            Home
          </a>

          <a class="sidebar-nav-item" href="https://github.com/garciat">
            GitHub
          </a>

          {search.pages("type=page", "title=asc").map((page) => (
            <a
              class={`sidebar-nav-item ${url === page.url ? "active" : ""}`}
              href={h.url(page.url)}
            >
              {page.title}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};
