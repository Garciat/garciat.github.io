import lume from "lume/mod.ts";
import slugifyUrls from "lume/plugins/slugify_urls.ts";
import readingInfo, { ReadingInfo } from "lume/plugins/reading_info.ts";
import sitemap from "lume/plugins/sitemap.ts";
import date from "lume/plugins/date.ts";
import jsx from "lume/plugins/jsx_preact.ts";
import esbuild from "lume/plugins/esbuild.ts";
// import esbuild from "lume/plugins/esbuild.ts";
import code_highlight from "lume/plugins/code_highlight.ts";
import toc, {
  linkInsideHeader,
} from "https://deno.land/x/lume_markdown_plugins@v0.8.0/toc.ts";
import { Node as NodeTOC } from "https://deno.land/x/lume_markdown_plugins@v0.8.0/toc/mod.ts";
import footnotes from "https://deno.land/x/lume_markdown_plugins@v0.8.0/footnotes.ts";
import beautify from "npm:js-beautify@1.15.1";

import lang_javascript from "npm:highlight.js/lib/languages/javascript";
import lang_java from "npm:highlight.js/lib/languages/java";
import lang_python from "npm:highlight.js/lib/languages/python";
import lang_bash from "npm:highlight.js/lib/languages/bash";
import lang_haskell from "npm:highlight.js/lib/languages/haskell";
import lang_x86asm from "npm:highlight.js/lib/languages/x86asm";

import { JSX } from "npm:preact@10.25.4";

const site = lume({
  src: "./src",
});

site.use(slugifyUrls());

site.use(readingInfo({
  wordsPerMinute: 100, // there's usually a lot of code in my posts
}));

site.use(footnotes());

site.use(jsx({
  extensions: [".page.tsx"],
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
  },
}));

site.use(date());

site.use(sitemap(/* Options */));

site.use(toc({
  anchor: linkInsideHeader(),
}));

declare global {
  namespace Lume {
    interface Data {
      no_toc?: boolean;
      toc: NodeTOC[];
      footnotes?: {
        id: string;
        label: string;
        refId: string;
        content: string;
      }[];
      readingInfo: ReadingInfo;
    }

    interface Layout {
      children?: JSX.Element;
    }
  }
}

site.copy([".wgsl", ".css", ".jpg", ".jpeg", ".png", ".ico", ".html", ".js"]);

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
      haskell: lang_haskell,
      x86asm: lang_x86asm,
    },
  }),
);

export default site;
