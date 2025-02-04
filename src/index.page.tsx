import { pickAll, setDateModified } from "./_includes/utils.ts";

export const layout: SiteLayout = "layouts/default.page.tsx";

export const title = "Gabriel Garcia Torrico";

export const description = "I'm a software developer based in Amsterdam.";

export const structuredData: WebSiteSD = {
  "@type": "WebSite",
  name: "lume-data:config.site.name",
  url: "site-url:self",
  description: "lume-data:config.site.description",
  author: "lume-data:config.data.author",
};

export default (data: Lume.Data, h: Lume.Helpers) => {
  const { search, config, page } = data;

  const authorRef = `${h.url("/about/", true)}#Person`;

  const posts = search.pages<Lume.Data>("type=post", "date=desc");

  setDateModified(page, pickAll("dateModified", posts));

  return (
    <>
      <main
        itemscope
        itemtype="http://schema.org/Person"
        itemid={authorRef}
        class="container content"
      >
        <link itemprop="url" href={h.url("/about/", true)} />
        <header>
          <h1 itemprop="name">{config.me.name}</h1>
        </header>
        <section itemprop="description" class="bio">
          <img
            itemprop="image"
            class="avatar"
            alt={config.me.name}
            src={h.url("/public/resources/me-2018.jpeg")}
            width="150"
            height="150"
          />
          <p>
            I'm a software developer based in Amsterdam who's been writing code
            for nearly 20 years. I am primarily a backend developer, but I have
            my roots in web development. Most recently, I have worked as a
            software engineer at <a href="https://www.uber.com/">Uber</a>{" "}
            for about 6 years. For more details, refer to{" "}
            <a itemprop="sameAs" href="https://www.linkedin.com/in/ggarciat/">
              my LinkedIn profile
            </a>.
          </p>
          <p>
            You can find me on{" "}
            <a itemprop="sameAs" href="https://github.com/garciat">
              GitHub
            </a>,{" "}
            <a
              itemprop="sameAs"
              href="https://www.instagram.com/garciat.climbs/"
            >
              Instagram
            </a>{" "}
            (rock climbing), and{" "}
            <a itemprop="sameAs" href="https://www.reddit.com/user/garciat/">
              Reddit
            </a>{" "}
            (inactive). If you wish to contact me directly via email, my email
            address is <code>gabriel</code> at this domain name.
          </p>
        </section>
      </main>
      <section
        itemscope
        itemtype="http://schema.org/Blog"
        class="container content"
      >
        <header>
          <h2>Posts</h2>
        </header>
        <ul class="post-index">
          {posts.map((post) => (
            <li
              itemprop="blogPost"
              itemscope
              itemtype="http://schema.org/BlogPosting"
              itemid={`${h.url(post.url, true)}#BlogPosting`}
              class="post-index-item"
            >
              <link
                itemprop="author"
                href={authorRef}
              />
              <meta itemprop="description" content={post.description} />
              {post.tags && (
                post.tags.map((tag) => (
                  <meta itemprop="keywords" content={tag} />
                ))
              )}
              {post.dateModified && (
                <meta
                  itemprop="dateModified"
                  content={post.dateModified.toISOString()}
                />
              )}

              <time
                itemprop="datePublished"
                class="col1 weak"
                datetime={post.date.toISOString()}
              >
                {h.date(post.date, "MMM dd, yyyy")}
              </time>

              <span class="separator">{" \u2014 "}</span>

              {/* TODO(grids): had to wrap this so that the anchor does not span the whole column */}
              <span>
                <a itemprop="url" class="col2" href={h.url(post.url)}>
                  <span itemprop="headline">{post.title}</span>
                </a>
              </span>
            </li>
          ))}
        </ul>
        <p>
          <a href={h.url("/archive/")}>View all posts</a>
        </p>
      </section>
    </>
  );
};
