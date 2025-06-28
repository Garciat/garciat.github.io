const isDev = Deno.env.get("DEV") === "true";

const googleAnalyticsMeasurementId = "G-YBDSYZM13J";

export const inlineScripts = {
  googleAnalytics: {
    src: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', '${googleAnalyticsMeasurementId}');
  `.trim(),
    hash: "sha256-iwcQOKygKUaLqCG8x8iaG9V5wGQ5BqyIpthMl+VGE4g=",
  },
} as const;

export const config = {
  titleSeparator: " · ",
  google_analytics: googleAnalyticsMeasurementId,
  sourceDir: "src",

  site: {
    name: "Gabriel Garcia Torrico",
    description: "I'm a software developer based in Amsterdam.",
  },

  me: {
    firstName: "Gabriel",
    lastName: "Garcia Torrico",
    get name() {
      return `${this.firstName} ${this.lastName}`;
    },
    alternateName: "garciat",
    description: "I'm a software developer based in Amsterdam.",
  },

  data: {
    get author(): PersonSD {
      return {
        "@id": "site-url:/about/#Person",
        "@type": "Person",
        name: "lume-data:config.me.name",
        url: "site-url:/about/",
      };
    },
  },

  github: {
    username: "Garciat",
    base_project_url: "https://garciat.com",
    profile_url: "https://github.com/garciat",
    site: {
      repo: "garciat.github.io",
      branch: "main",
      buildWorkflow: "build.yml",
    },
  },

  // Content Security Policy
  csp: {
    ...(isDev ? {} : { "upgrade-insecure-requests": [] }),
    "base-uri": [
      "'none'",
    ],
    "default-src": [
      "'none'",
    ],
    "form-action": [
      "'self'",
    ],
    "style-src": [
      "'self'",
    ],
    "font-src": [
      "'self'",
    ],
    "img-src": [
      "'self'",
      "https://img.shields.io",
      "https://*.google-analytics.com https://*.googletagmanager.com",
    ],
    "script-src": [
      "'self'",
      isDev ? "'unsafe-inline'" : "",
      `'${inlineScripts.googleAnalytics.hash}'`,
      "https://esm.sh",
      "https://*.googletagmanager.com",
    ],
    "connect-src": [
      "'self'",
      "https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
    ],
    "frame-src": [
      "'self'",
    ],
  },

  inlineScripts,
} as const;

export const i18n = {
  nav: {
    toc: "Table of Contents",
  },
};

declare global {
  type SiteConfig = typeof config;

  type SiteLayout =
    | "layouts/base.page.tsx"
    | "layouts/default.page.tsx"
    | "layouts/gist.page.tsx"
    | "layouts/page.page.tsx"
    | "layouts/post.page.tsx"
    | "layouts/archive_result.page.tsx";

  namespace Lume {
    interface Data {
      config: SiteConfig;
      i18n: typeof i18n;
    }
  }
}
