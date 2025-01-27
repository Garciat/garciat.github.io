import Site from "lume/core/site.ts";

import libbeautify from "npm:js-beautify@1.15.1";

export function beautify() {
  return (site: Site) => {
    site.process([".html"], (files) => {
      for (const file of files) {
        file.content = libbeautify.html(file.content, {
          indent_size: 2,
          wrap_line_length: 120,
        });
      }
    });
  };
}

export default beautify;
