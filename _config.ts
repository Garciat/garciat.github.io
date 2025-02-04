import lume from "lume/mod.ts";
import slugifyUrls from "lume/plugins/slugify_urls.ts";
import readingInfo, { ReadingInfo } from "lume/plugins/reading_info.ts";
// TODO move to built-in plugin after release of https://github.com/lumeland/lume/pull/725
import feed from "./plugins/feed_custom/mod.ts";
import sitemap from "lume/plugins/sitemap.ts";
import date from "lume/plugins/date.ts";
import redirects from "lume/plugins/redirects.ts";
import jsx from "lume/plugins/jsx_preact.ts";
import esbuild from "lume/plugins/esbuild.ts";
import code_highlight from "lume/plugins/code_highlight.ts";
import toc, {
  linkInsideHeader,
} from "https://deno.land/x/lume_markdown_plugins@v0.8.0/toc.ts";
import { Node as NodeTOC } from "https://deno.land/x/lume_markdown_plugins@v0.8.0/toc/mod.ts";
import footnotes from "https://deno.land/x/lume_markdown_plugins@v0.8.0/footnotes.ts";

import lang_javascript from "npm:highlight.js/lib/languages/javascript";
import lang_java from "npm:highlight.js/lib/languages/java";
import lang_python from "npm:highlight.js/lib/languages/python";
import lang_bash from "npm:highlight.js/lib/languages/bash";
import lang_haskell from "npm:highlight.js/lib/languages/haskell";
import lang_x86asm from "npm:highlight.js/lib/languages/x86asm";

import { beautify } from "./plugins/beautify/mod.ts";
import { structured_data } from "./plugins/structured_data/mod.ts";
import {
  dateModifiedField,
  modified_date,
} from "./plugins/modified_date/mod.ts";

import { JSX } from "npm:preact@10.25.4";

const site = lume({
  src: "./src",
})
  .use(jsx({
    extensions: [".page.tsx"],
  }))
  .use(esbuild({
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
  }))
  .copy([".wgsl", ".css", ".jpg", ".jpeg", ".png", ".ico", ".html", ".js"])
  .use(feed({
    output: ["/posts.rss", "/posts.json"],
    query: "type=post",
    info: {
      title: "=config.site.name",
      description: "=config.site.description",
      published: new Date(),
      lang: "en",
      hubs: ["https://websubhub.com/hub"],
    },
    items: {
      title: "=title",
      description: "=description",
      published: "=date",
      updated: "=dateModified",
    },
  }))
  .use(date())
  .use(modified_date())
  .use(slugifyUrls())
  .use(sitemap({
    lastmod: dateModifiedField,
  }))
  .use(readingInfo({
    wordsPerMinute: 100, // there's usually a lot of code in my posts
  }))
  .use(structured_data())
  .use(toc({
    anchor: linkInsideHeader(),
  }))
  .use(footnotes())
  .use(
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
  )
  .use(beautify())
  .use(redirects());

export default site;

// Typing support for Layout components
declare global {
  namespace Lume {
    interface Layout {
      children?: JSX.Element;
    }
  }
}

// Typing support for reading_info plugin
declare global {
  namespace Lume {
    interface Data {
      readingInfo: ReadingInfo;
    }
  }
}

// Typing support for footnotes plugin
declare global {
  namespace Lume {
    interface Data {
      footnotes?: {
        id: string;
        label: string;
        refId: string;
        content: string;
      }[];
    }
  }
}

// Typing support for toc plugin
declare global {
  namespace Lume {
    interface Data {
      no_toc?: boolean;
      toc: NodeTOC[];
    }
  }
}
