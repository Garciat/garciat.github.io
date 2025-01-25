import { getConfigRepositoryPathURL } from "../github.ts";

export const layout: SiteLayout = "layouts/base.page.tsx";

export default (
  post: Lume.Data & Lume.Layout,
  h: Lume.Helpers,
) => {
  const { comp, config, i18n, children } = post;

  return (
    <>
      <div class="blogpost container">
        <div class="navigation noprint">
          <h4>
            <a
              href={getConfigRepositoryPathURL(config, post.page.sourcePath)}
              class="github-source"
            >
              View post on GitHub
            </a>
            <a href={h.url("/")}>
              &#8676; Back
            </a>
          </h4>
        </div>

        <div class="post">
          <h1 class="post-title">{post.title}</h1>

          <div class="post-meta">
            <div class="post-date">{h.date(post.date, "HUMAN_DATE")}</div>
            <div class="post-time">{post.readingInfo.minutes} min read</div>
            <comp.TagsList tags={post.tags} />
          </div>

          <nav class="toc" hidden={post.no_toc ?? false}>
            <h2>{i18n.nav.toc}</h2>
            <ol>
              {post.toc.map((item) => (
                <>
                  <li>
                    <a href={`#${item.slug}`}>{item.text}</a>
                  </li>
                  <ul hidden={!item.children.length}>
                    {item.children.map((child) => (
                      <li>
                        <a href={`#${child.slug}`}>{child.text}</a>
                      </li>
                    ))}
                  </ul>
                </>
              ))}
            </ol>
          </nav>

          {children}

          <comp.Footnotes footnotes={post.footnotes} />
        </div>
      </div>

      <comp.Footer />
    </>
  );
};
