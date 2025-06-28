export default ({ config }: Lume.Data, _helpers: Lume.Helpers) => {
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${config.google_analytics}`}
      >
      </script>
      <script
        dangerouslySetInnerHTML={{
          __html: config.inlineScripts.googleAnalytics.src,
        }}
        integrity={config.inlineScripts.googleAnalytics.hash}
      />
    </>
  );
};
