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
  <li class={`sidebar-nav-item ${currentUrl === url ? "active" : ""}`}>
    <a
      target={target}
      href={normalizedUrl ?? url}
    >
      {title}
    </a>
  </li>
);

export default ({ search, url }: Lume.Data, h: Lume.Helpers) => {
  const isHome = false;

  return (
    <header class={["sidebar", isHome ? "home" : ""].join(" ")}>
      <div class="container sidebar-sticky">
        <section class="sidebar-about">
          <h1>
            <img
              src={h.url("/public/resources/avatar.jpeg")}
              alt="Me"
              width="50"
              height="50"
            />
            <span class="name">Gabriel Garcia</span>
          </h1>
          <p class="lead">
            Recreational programmer turned Software Engineer.
          </p>
        </section>

        <nav>
          <ul class="sidebar-nav">
            <NavItem
              url="/"
              title="Home"
              currentUrl={url}
              normalizedUrl={h.url("/")}
            />

            {search.pages("type=page", "title=asc").map((page) => (
              <NavItem
                url={page.url}
                title={page.nav_title ?? page.title!}
                currentUrl={url}
                normalizedUrl={h.url(page.url)}
              />
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};
