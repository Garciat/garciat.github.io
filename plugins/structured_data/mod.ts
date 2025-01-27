import { Page } from "lume/core/file.ts";
import Site from "lume/core/site.ts";

const prefixWebsiteURL = "site-url:" as const;

const prefixLumeDataRef = "lume-data:" as const;

const selfURL = `${prefixWebsiteURL}self` as const;

const defaultContext = "https://schema.org" as const;

type LumeDataRef = `${typeof prefixLumeDataRef}${string}`;

type SelfURL = typeof selfURL;

type SiteURL = `${typeof prefixWebsiteURL}${string}`;

declare global {
  namespace Lume {
    interface Data {
      structuredData?: StructuredData | StructuredData[];
    }

    interface Helpers {
      structuredData(data: StructuredData | StructuredData[]): string;
    }
  }

  type SomeURL = SiteURL | SelfURL;

  type Val<T> = T | LumeDataRef;

  type StructuredData =
    | WebSiteSD
    | BlogPostingSD
    | AnySD;

  interface WebSiteSD {
    "@type": "WebSite";
    url: SomeURL;
    name: Val<string>;
    description: Val<string>;
    author?: Val<PersonSD>;
  }

  interface BlogPostingSD {
    "@type": "BlogPosting";
    url: SomeURL;
    headline: Val<string>;
    author: Val<PersonSD>;
    datePublished?: Val<string>;
    dateModified?: Val<string>;
    description?: Val<string>;
    keywords?: Val<string[]>;
  }

  interface PersonSD {
    "@type": "Person";
    name: Val<string>;
    url: SomeURL;
    alternateName?: Val<string>;
  }

  interface BreadcrumpListSD {
    "@type": "BreadcrumbList";
    itemListElement: {
      "@type": "ListItem";
      position: number;
      item?: Val<string>;
      name?: Val<string>;
    }[];
  }

  interface AnySD {
    "@type": string;
    [key: string]: unknown;
  }
}

export function structured_data() {
  return (site: Site) => {
    // Renders structured data into a string
    site.filter("structuredData", renderStructuredData);

    site.preprocess("*", (pages) => {
      for (const page of pages) {
        if (page.data.structuredData) {
          page.data.structuredData = formatValue(
            page,
            page.data.structuredData,
          );
        }
      }
    });

    function formatValue(page: Page, value: unknown): unknown {
      switch (typeof value) {
        case "string":
          return formatString(page, value);
        case "object":
          return formatObject(page, value);
        default:
          return value;
      }
    }

    function formatString(page: Page, value: string): unknown {
      if (value === selfURL) {
        return formatSelfURL(page);
      } else if (isSiteURL(value)) {
        return formatSiteURL(value);
      } else if (isLumeDataRef(value)) {
        return formatLumeDataRef(page, value);
      } else {
        return value;
      }
    }

    function formatSelfURL(page: Page): string {
      return site.url(page.data.url, true);
    }

    function formatSiteURL(url: SiteURL): string {
      return site.url(url.slice(prefixWebsiteURL.length), true);
    }

    function formatLumeDataRef(page: Page, ref: LumeDataRef): unknown {
      const keys = ref.slice(prefixLumeDataRef.length).split(".");
      return formatValue(page, extract(page.data, keys)); // RECURSION
    }

    function formatObject(page: Page, value: object | null): unknown {
      if (value === null) {
        return null;
      }
      if (value instanceof Date) {
        return formatDate(value);
      } else if (Array.isArray(value)) {
        return walkArray(page, value);
      } else {
        return walkObject(page, value as Record<string, unknown>);
      }
    }

    function formatDate(value: Date): string {
      return value.toISOString();
    }

    function walkArray(
      page: Page,
      data: unknown[],
    ): unknown[] {
      return data.map((item) => {
        return formatValue(page, item); // RECURSION
      });
    }

    function walkObject<T extends Record<string, unknown>>(
      page: Page,
      data: T,
    ): T {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => {
          return [key, formatValue(page, value)]; // RECURSION
        }),
      ) as T;
    }
  };
}

function renderStructuredData(data: StructuredData | StructuredData[]): string {
  return JSON.stringify(appendContext(data));
}

function appendContext<T extends StructuredData | StructuredData[]>(
  data: T,
): T {
  if (Array.isArray(data)) {
    return data.map((item) => appendContext(item)) as T;
  } else {
    return { "@context": defaultContext, ...data } as T;
  }
}

function extract(
  data: Record<string, unknown>,
  keys: string[],
): unknown {
  let cur = data;
  for (const key of keys) {
    if (typeof cur !== "object" || cur === null) {
      throw new Error(
        `Cannot extract value from object: ${keys.join(".")}`,
      );
    }

    cur = Reflect.get(cur, key) as Record<string, unknown>;
  }
  return cur;
}

function isLumeDataRef(value: unknown): value is LumeDataRef {
  return typeof value === "string" && value.startsWith(prefixLumeDataRef);
}

function isSiteURL(value: unknown): value is SiteURL {
  return typeof value === "string" && value.startsWith(prefixWebsiteURL);
}

export default structured_data;
