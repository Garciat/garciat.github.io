const isDev = Deno.env.get("DEV") === "true";

export const config = {
  titleSeparator: " · ",
  google_analytics: "UA-19283098-3",
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
    ],
    "script-src-elem": [
      "'self'",
      isDev ? "'unsafe-inline'" : "",
      "https://esm.sh",
    ],
    "connect-src": [
      "'self'",
    ],
    "frame-src": [
      "'self'",
    ],
  },
};

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
