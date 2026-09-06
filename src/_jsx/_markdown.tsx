import Markdown from "npm:react-markdown@10";
import remarkGfm from "npm:remark-gfm@4.0.1";
import remarkToc, { Options as TocOptions } from "npm:remark-toc@9";
import rehypeSlug from "npm:rehype-slug@6";
import rehypeHighlight, {
  Options as HighlightOptions,
} from "npm:rehype-highlight@7";
import rehypeAutolinkHeadings, {
  Options as AutolinkOptions,
} from "npm:rehype-autolink-headings@7";

import { common } from "npm:lowlight@3.3.0";
import langHaskell from "npm:highlight.js@11.12.0/lib/languages/haskell";

export const CustomizedMarkdown = ({ children }: { children: string }) => (
  <Markdown
    remarkPlugins={[
      remarkGfm,
      [
        remarkToc,
        { ordered: true, maxDepth: 3 } satisfies TocOptions,
      ],
    ]}
    rehypePlugins={[
      rehypeSlug,
      [
        rehypeHighlight,
        {
          languages: {
            ...common,
            haskell: langHaskell,
          },
        } satisfies HighlightOptions,
      ],
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          content: { type: "text", value: "#" },
        } satisfies AutolinkOptions,
      ],
    ]}
  >
    {children}
  </Markdown>
);
