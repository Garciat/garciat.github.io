export const config = {
  title: "garciat",
  titleSeparator: " · ",
  description: "",
  google_analytics: "UA-19283098-3",
  sourceDir: "src",
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
    "upgrade-insecure-requests": [],
    "base-uri": [
      "'none'",
    ],
    "default-src": [
      "'none'",
    ],
    "form-action": [
      "'self'",
    ],
    "style-src-elem": [
      "'self'",
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com",
    ],
    "font-src": [
      "'self'",
      "https://fonts.gstatic.com",
    ],
    "img-src": [
      "'self'",
      "https://img.shields.io",
    ],
    "script-src-elem": [
      "'self'",
      "https://esm.sh",
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

  namespace Lume {
    interface Data {
      config: SiteConfig;
      i18n: typeof i18n;
    }
  }
}
