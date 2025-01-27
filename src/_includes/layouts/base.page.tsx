export default (
  page: Lume.Data,
  h: Lume.Helpers,
) => {
  const { comp, config, children } = page;

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta
          http-equiv="Content-Security-Policy"
          content={formatCSP(config.csp)}
        />
        <meta name="referrer" content="same-origin" />

        {page.description && (
          <meta name="description" content={page.description} />
        )}

        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>{page.title}</title>

        <link rel="canonical" href={h.url(page.url, true)} />

        <link rel="stylesheet" href={h.url("/public/css/main.css")} />
        <link
          rel="stylesheet"
          href={h.url("/public/css/highlight.js@11.11.1/github.css")}
          media="(prefers-color-scheme: light)"
          data-theme="light"
          crossorigin="anonymous"
        />
        <link
          rel="stylesheet"
          href={h.url("/public/css/highlight.js@11.11.1/github-dark.css")}
          media="(prefers-color-scheme: dark)"
          data-theme="dark"
          crossorigin="anonymous"
        />

        <link
          rel="icon"
          href={h.url("/favicon.png")}
          type="image/png"
        />

        <script
          type="module"
          src={h.url("/public/js/relative-time.js")}
          defer
        />
      </head>

      <body>
        {/* Load this as a render-blocking script to prevent screen flickering. */}
        <script src={h.url("/public/js/theme.js")} />

        {children}

        <comp.Analytics />
      </body>
    </html>
  );
};

function formatCSP(csp: Record<string, string[]>) {
  return Object.entries(csp)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}
