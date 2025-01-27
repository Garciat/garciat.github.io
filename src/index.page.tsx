export const layout: SiteLayout = "layouts/default.page.tsx";

export const title = "Gabriel Garcia Torrico";

export const description = "I'm a software developer based in Amsterdam.";

export const structuredData: StructuredData = {
  "@context": "https://schema.org/",
  "@type": "WebSite",
  "name": title,
  "url": "website-url:self",
  "description": description,
};

export default ({ search }: Lume.Data, h: Lume.Helpers) => {
  return (
    <>
      <main class="container content">
        <header>
          <h1>{title}</h1>
        </header>
        <section class="bio">
          <p>
            I'm a software developer based in Amsterdam who's been writing code
            for nearly 20 years. I am primarily a backend developer, but I have
            my roots in web development. Most recently, I have worked as a
            software engineer at <a href="https://www.uber.com/">Uber</a>{" "}
            for about 6 years. For more details, check out{" "}
            <a href="https://www.linkedin.com/in/ggarciat/">
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
            <li class="post-index-item">
              <time class="col1 weak" datetime={post.date.toISOString()}>
                {h.date(post.date, "MMM dd, yyyy")}
              </time>
              <span class="separator">{" \u2014 "}</span>
              <a class="col2" href={h.url(post.url)}>{post.title}</a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};
