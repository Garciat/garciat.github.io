export const layout: SiteLayout = "layouts/default.page.tsx";

export const title = "Gabriel Garcia Torrico";

export const description = "I'm a software developer based in Amsterdam.";

export const structuredData: WebSiteSD = {
  "@type": "WebSite",
  name: title,
  url: "site-url:self",
  description: description,
  author: "lume-data:config.data.author",
};

export default ({ search }: Lume.Data, h: Lume.Helpers) => {
  return (
    <>
      <main
        itemscope
        itemtype="http://schema.org/Person"
        itemid="#garciat"
        class="container content"
      >
        <link itemprop="url" href={h.url("/about/")} />
        <header>
          <h1 itemprop="name">{title}</h1>
        </header>
        <section itemprop="description">
          <p>
            I'm a software developer based in Amsterdam who's been writing code
            for nearly 20 years. I am primarily a backend developer, but I have
            my roots in web development. Most recently, I have worked as a
            software engineer at <a href="https://www.uber.com/">Uber</a>{" "}
            for about 6 years. For more details, check out{" "}
            <a itemprop="sameAs" href="https://www.linkedin.com/in/ggarciat/">
              my LinkedIn profile
            </a>.
          </p>
        </section>
      </main>
      <section class="container content">
        <header>
          <h2>Posts</h2>
        </header>
        <ul class="post-index">
          {search.pages("type=post", "date=desc").map((post) => (
            <li
              itemscope
              itemtype="http://schema.org/BlogPosting"
              class="post-index-item"
            >
              <link itemprop="author" href="#garciat" />
              <time
                itemprop="datePublished"
                class="col1 weak"
                datetime={post.date.toISOString()}
              >
                {h.date(post.date, "MMM dd, yyyy")}
              </time>
              <span class="separator">{" \u2014 "}</span>
              <a itemprop="url" class="col2" href={h.url(post.url)}>
                <span itemprop="headline">{post.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};
