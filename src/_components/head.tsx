export default ({ config, title }: Lume.Data, { url }: Lume.Helpers) => {
  return (
    <head>
      <link href="https://gmpg.org/xfn/11" rel="profile" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta http-equiv="content-type" content="text/html; charset=utf-8" />

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1"
      />

      <title>{`${title} · ${config.title}`}</title>

      <link rel="stylesheet" href={url("/public/css/poole.css")} />
      <link rel="stylesheet" href={url("/public/css/syntax.css")} />
      <link rel="stylesheet" href={url("/public/css/hyde.css")} />
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
        href={url("/public/icon/apple-touch-icon.png")}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={url("/public/icon/favicon-32x32.png")}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={url("/public/icon/favicon-16x16.png")}
      />
      <link
        rel="shortcut icon"
        href={url("/public/icon/favicon.ico")}
      />
    </head>
  );
};
