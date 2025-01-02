export default (
  { comp, config, url, title, description, children }: Lume.Data,
  h: Lume.Helpers,
) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta
          http-equiv="Content-Security-Policy"
          content={formatCSP(config.csp)}
        />
        <meta
          http-equiv="X-Content-Type-Options"
          content="nosniff"
        />

        {description && <meta name="description" content={description} />}

        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>{`${title}${config.titleSeparator}${config.title}`}</title>

        <link rel="canonical" href={h.url(url, true)} />

        <link rel="stylesheet" href={h.url("/public/css/main.css")} />
        <link rel="stylesheet" href={h.url("/public/css/gists.css")} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=PT+Sans:400,400italic,700|Abril+Fatface"
          crossorigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css"
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
