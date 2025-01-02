interface NavItemProps {
  url: string;
  title: string;
  currentUrl?: string;
  normalizedUrl?: string;
  target?: string;
}

const NavItem = (
  { url, title, currentUrl, normalizedUrl, target }: NavItemProps,
) => (
  <a
    class={`sidebar-nav-item ${currentUrl === url ? "active" : ""}`}
    target={target}
    href={normalizedUrl || url}
  >
    {title}
  </a>
);

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
          <NavItem
            url="/"
            title="Home"
            currentUrl={url}
            normalizedUrl={h.url("/")}
          />

          {search.pages("type=page", "title=asc").map((page) => (
            <NavItem
              url={page.url}
              title={page.title!}
              currentUrl={url}
              normalizedUrl={h.url(page.url)}
            />
          ))}

          <NavItem
            url="https://github.com/garciat"
            title="GitHub"
            target="_blank"
          />
        </nav>
      </div>
    </div>
  );
};
