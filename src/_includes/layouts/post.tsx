export default (
  { comp, config, page, title, date, children }: Lume.Data,
  h: Lume.Helpers,
) => {
  return (
    <html lang="en-us">
      <comp.Head />

      <body>
        <div class="blogpost container">
          <div class="navigation noprint">
            <h4>
              <a
                href={`https://github.com/Garciat/garciat.github.io/tree/master/${config.sourceDir}${page.sourcePath}`}
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
            {children}
          </div>
        </div>

        <comp.Analytics />
      </body>
    </html>
  );
};
