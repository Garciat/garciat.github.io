export const layout = "layouts/base.tsx";

export default (
  { comp, config, i18n, page, title, date, toc, children }: Lume.Data,
  h: Lume.Helpers,
) => {
  return (
    <>
      <div class="blogpost container">
        <div class="navigation noprint">
          <h4>
            <a
              href={`https://github.com/${config.github.repo}/tree/${config.github.branch}/${config.sourceDir}${page.sourcePath}`}
              style="float:right;color:#999"
            >
              View post on GitHub
            </a>
            <a href={h.url("/")}>
              &#8676; Back
            </a>
          </h4>
        </div>

        <div class="post">
          <h1 class="post-title">{title}</h1>
          <span class="post-date">
            Posted on <strong>{h.date(date, "HUMAN_DATE")}</strong>
          </span>

          <nav class="toc">
            <h2>{i18n.nav.toc}</h2>
            <ol>
              {toc.map((item) => (
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
        </div>
      </div>

      <comp.Footer />
    </>
  );
};
