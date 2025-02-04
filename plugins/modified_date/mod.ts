import Site from "lume/core/site.ts";
import { getGitDate } from "lume/core/utils/date.ts";

export const dateModifiedField = "dateModified";

declare global {
  namespace Lume {
    interface Data {
      [dateModifiedField]?: Date;
    }
  }
}

export function modified_date() {
  return (site: Site) => {
    site.preprocess("*", (pages) => {
      for (const page of pages) {
        if (!page.data[dateModifiedField] && page.src.entry) {
          const modified = getGitDate("modified", page.src.entry.src);
          if (modified) {
            page.data[dateModifiedField] = modified;
          } else {
            page.data[dateModifiedField] = page.data.date;
          }
        }
      }
    });
  };
}

export default modified_date;
