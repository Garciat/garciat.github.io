import { Page } from "lume/core/file.ts";
import Site from "lume/core/site.ts";

const selfURL = "website-url:self" as const;

declare global {
  namespace Lume {
    interface Data {
      structuredData?: StructuredData;
    }
  }

  type SelfURL = typeof selfURL;

  type StructuredDataContext = "https://schema.org/";

  type StructuredData =
    | WebSiteSD
    | AnySD;

  type WebSiteSD = {
    "@context": StructuredDataContext;
    "@type": "WebSite";
    url: SelfURL;
    name: string;
    description: string;
  };

  type AnySD = {
    "@context": StructuredDataContext;
    "@type": string;
    [key: string]: unknown;
  };
}

export function structured_data() {
  return (site: Site) => {
    site.preprocess("*", (pages) => {
      for (const page of pages) {
        if (page.data.structuredData) {
          validateStructuredData(page.data.structuredData);
          page.data.structuredData = resolveURLs(
            page,
            page.data.structuredData,
          );
        }
      }
    });

    function resolveURLs<T extends Record<string, unknown>>(
      page: Page,
      data: T,
    ): T {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => {
          if (value === selfURL) {
            return [key, site.url(page.data.url, true)];
          }

          if (typeof value === "object" && value !== null) {
            return [key, resolveURLs(page, value as Record<string, unknown>)];
          }

          return [key, value];
        }),
      ) as T;
    }
  };
}

function validateStructuredData(
  data: Record<string, unknown>,
): asserts data is AnySD {
  if (!data["@context"]) {
    throw new Error("Structured data must have a @context.");
  }

  if (!data["@type"]) {
    throw new Error("Structured data must have a @type.");
  }
}

export default structured_data;
