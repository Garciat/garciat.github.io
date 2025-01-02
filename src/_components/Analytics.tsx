import { encodeBase64 } from "jsr:@std/encoding@1.0.5/base64";

export default async ({ config }: Lume.Data, { _url }: Lume.Helpers) => {
  const src = `
(function (i, s, o, g, r, a, m) {
  i["GoogleAnalyticsObject"] = r;
  i[r] = i[r] || function () {
    (i[r].q = i[r].q || []).push(arguments);
  }, i[r].l = 1 * new Date();
  a = s.createElement(o), m = s.getElementsByTagName(o)[0];
  a.async = 1;
  a.src = g;
  m.parentNode.insertBefore(a, m);
})(
  window,
  document,
  "script",
  "//www.google-analytics.com/analytics.js",
  "ga",
);

ga("create", "${config.google_analytics}", "auto");
ga("send", "pageview");
  `.trim();

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: src }}
        integrity={await computeSourceIntegrity(src)}
      />
    </>
  );
};

async function computeSourceIntegrity(src: string) {
  const bytes = new TextEncoder().encode(src);
  const hash = await crypto.subtle.digest("SHA-384", bytes);
  return `sha384-${encodeBase64(hash)}`;
}
