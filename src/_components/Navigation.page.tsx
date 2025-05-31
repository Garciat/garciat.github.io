interface NavItemProps {
  url: string;
  title: string;
  currentUrl?: string;
  normalizedUrl?: string;
}

const NavItem = (
  { url, title, currentUrl, normalizedUrl }: NavItemProps,
) => (
  <li class={`sidebar-nav-item ${currentUrl === url ? "active" : ""}`}>
    <a href={normalizedUrl ?? url}>
      {title}
    </a>
  </li>
);

export default ({ search, url }: Lume.Data, h: Lume.Helpers) => {
  return (
    <nav class="sidebar container">
      <ul class="sidebar-nav">
        <NavItem
          url="/"
          title="Home"
          currentUrl={url}
          normalizedUrl={h.url("/")}
        />

        {search.pages("type=page top_nav=true", "title=asc").map((page) => (
          <NavItem
            url={page.url}
            title={page.nav_title ?? page.title!}
            currentUrl={url}
            normalizedUrl={h.url(page.url)}
          />
        ))}
      </ul>
    </nav>
  );
};
