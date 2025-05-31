export default ({ config }: Lume.Data, _helpers: Lume.Helpers) => {
  const hash = "sha256-iwcQOKygKUaLqCG8x8iaG9V5wGQ5BqyIpthMl+VGE4g=";

  const src = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', '${config.google_analytics}');
  `.trim();

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${config.google_analytics}`}
      >
      </script>
      <script
        dangerouslySetInnerHTML={{ __html: src }}
        integrity={hash}
        nonce={config.nonce}
      />
    </>
  );
};
