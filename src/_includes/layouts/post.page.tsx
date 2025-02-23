import { getConfigRepositoryPathURL } from "../github.ts";

export const layout: SiteLayout = "layouts/base.page.tsx";

export default (
  post: Lume.Data & Lume.Layout,
  h: Lume.Helpers,
) => {
  const { comp, search, config, i18n, children } = post;

  return (
    <>
      <nav class="post-navigation container content noprint">
        <a href={h.url("/")}>
          &#8676; Back
        </a>
        <a
          href={getConfigRepositoryPathURL(config, post.page.sourcePath)}
          class="github-source"
        >
          View post on GitHub
        </a>
      </nav>

      <main class="post container content">
        <header>
          <h1 class="post-title vt-post-title" id={post.basename}>
            {post.title}
          </h1>

          <section class="post-meta">
            <div class="post-date">
              <time datetime={post.date.toISOString()}>
                {h.date(post.date, "HUMAN_DATE")}
              </time>
            </div>
            <div class="post-time">{post.readingInfo.minutes} min read</div>
            <ul class="pills">
              {post.tags.toSorted().map((tag) => (
                <li>
                  <a
                    href={h.url(
                      search.page(`type=tag tag="${tag}"`)!.url,
                    )}
                  >
                    {tag}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {!post.no_toc && post.toc.length > 0 && (
            <nav class="toc" hidden={post.no_toc ?? false}>
              <h2>{i18n.nav.toc}</h2>
              <ol>
                {post.toc.map((item) => (
                  <>
                    <li>
                      <a href={`#${item.slug}`}>{item.text}</a>
                    </li>
                    {item.children.length > 0 && (
                      <ul>
                        {item.children.map((child) => (
                          <li>
                            <a href={`#${child.slug}`}>{child.text}</a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ))}
              </ol>
            </nav>
          )}
        </header>

        {children}

        <footer>
          <comp.Footnotes footnotes={post.footnotes} />
        </footer>
      </main>

      <comp.Footer />
    </>
  );
};
