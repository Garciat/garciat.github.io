export const config = {
  title: "garciat",
  description: "",
  google_analytics: "UA-19283098-3",
  sourceDir: "src",
  github: {
    repo: "Garciat/garciat.github.io",
    branch: "main",
    buildWorkflow: "build.yml",
  },
};

export const i18n = {
  nav: {
    toc: "Table of Contents",
  },
};

declare global {
  namespace Lume {
    interface Data {
      config: typeof config;
      i18n: typeof i18n;
    }
  }
}
