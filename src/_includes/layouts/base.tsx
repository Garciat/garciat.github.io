export default (
  { comp, config, title, children }: Lume.Data,
  h: Lume.Helpers,
) => {
  return (
    <html>
      <head>
        <link href="https://gmpg.org/xfn/11" rel="profile" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1"
        />

        <title>{`${title}${config.titleSeparator}${config.title}`}</title>

        <link rel="stylesheet" href={h.url("/public/css/main.css")} />
        <link rel="stylesheet" href={h.url("/public/css/gists.css")} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=PT+Sans:400,400italic,700|Abril+Fatface"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css"
        />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={h.url("/public/icon/apple-touch-icon.png")}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={h.url("/public/icon/favicon-32x32.png")}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={h.url("/public/icon/favicon-16x16.png")}
        />
        <link
          rel="shortcut icon"
          href={h.url("/public/icon/favicon.ico")}
        />
      </head>

      <body>
        {children}

        <comp.Analytics />
      </body>
    </html>
  );
};
