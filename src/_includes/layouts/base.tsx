export default (
  { comp, config, title, description, children }: Lume.Data,
  h: Lume.Helpers,
) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />

        {description && <meta name="description" content={description} />}

        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>{`${title}${config.titleSeparator}${config.title}`}</title>

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
      </head>

      <body>
        {children}

        <comp.Analytics />
      </body>
    </html>
  );
};
