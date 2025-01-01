import lume from "lume/mod.ts";
import date from "lume/plugins/date.ts";
import jsx from "lume/plugins/jsx_preact.ts";
import esbuild from "lume/plugins/esbuild.ts";
import code_highlight from "lume/plugins/code_highlight.ts";

import beautify from "npm:js-beautify@1.15.1";

import lang_javascript from "npm:highlight.js/lib/languages/javascript";
import lang_java from "npm:highlight.js/lib/languages/java";
import lang_python from "npm:highlight.js/lib/languages/python";
import lang_bash from "npm:highlight.js/lib/languages/bash";

const site = lume({
  src: "./src",
});

site.use(jsx({
  extensions: [".tsx"],
}));

site.use(esbuild({
  extensions: [".ts", ".js"],
  options: {
    plugins: [],
    bundle: false,
    format: "esm",
    minify: false,
    keepNames: true,
    platform: "browser",
    target: "esnext",
    treeShaking: false,
    outdir: "./",
    outbase: ".",
    jsxImportSource: "npm:preact@10.25.3", // avoid cache import
  },
}));

site.use(date());

site.copy([".wgsl", ".css", ".jpg", ".png", ".html"]);

site.process([".html"], (files) => {
  for (const file of files) {
    file.content = beautify.html(file.content, {
      indent_size: 2,
      wrap_line_length: 120,
    });
  }
});

site.use(
  code_highlight({
    extensions: [".html"],
    languages: {
      javascript: lang_javascript,
      java: lang_java,
      python: lang_python,
      bash: lang_bash,
    },
  }),
);

export default site;
