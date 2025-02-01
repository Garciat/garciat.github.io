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

  interface BaseSD {
    "@type": string;
    "@id"?: string;
  }

  interface WebSiteSD extends BaseSD {
    "@type": "WebSite";
    url: SomeURL;
    name: Val<string>;
    description: Val<string>;
    author?: Val<PersonSD>;
  }

  interface ArticleSD extends BaseSD {
    "@type": "Article";
    mainEntityOfPage: SomeURL;
    url: SomeURL;
    headline: Val<string>;
    author: Val<PersonSD>;
    datePublished?: Val<string>;
    dateModified?: Val<string>;
    image?: Val<string> | Val<string[]>;
  }

  interface BlogPostingSD extends BaseSD {
    "@type": "BlogPosting";
    mainEntityOfPage: SomeURL;
    url: SomeURL;
    headline: Val<string>;
    author: Val<PersonSD>;
    datePublished?: Val<string>;
    dateModified?: Val<string>;
    image?: Val<string> | Val<string[]>;
    description?: Val<string>;
    timeRequired?: Val<string>; // ISO 8601 duration
    wordCount?: Val<number>;
    keywords?: Val<string[]>;
  }

  interface PersonSD extends BaseSD {
    "@type": "Person";
    name: Val<string>;
    url: SomeURL;
    alternateName?: Val<string>;
  }

  interface BreadcrumpListSD extends BaseSD {
    "@type": "BreadcrumbList";
    itemListElement: {
      "@type": "ListItem";
      position: number;
      item?: Val<string>;
      name?: Val<string>;
    }[];
  }

  interface AnySD extends BaseSD {
    "@type": string;
    [key: string]: unknown;
  }
}

export function structured_data() {
  return (site: Site) => {
    // Resolve custom references in structured data
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

    // Insert structured data into the HTML document
    site.process([".html"], (pages) => {
      for (const page of pages) {
        if (!page.document || !page.data.structuredData) {
          continue;
        }
        const s = page.document.createElement("script");
        s.setAttribute("type", "application/ld+json");
        s.innerHTML = renderStructuredData(page.data.structuredData);

        const title = page.document.head.querySelector("title");
        if (title) {
          title.after(s);
        } else {
          page.document.head.append(s);
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
      const parts = ref.split("|").map((s) => s.trim());
      const input = parts.shift() as LumeDataRef;
      const keys = input.slice(prefixLumeDataRef.length).split(".");
      const value = extract(page.data, keys);
      return formatValue(page, applyFilters(value, parts)); // RECURSION
    }

    function applyFilters(value: unknown, filters: string[]): unknown {
      let result = value;
      for (const filter of filters) {
        result = applyFilter(result, filter);
      }
      return result;
    }

    function applyFilter(value: unknown, filter: string): unknown {
      switch (filter) {
        case "iso8601minutes":
          return formatISO8601Minutes(value);
        default:
          throw new Error(`Unknown filter: ${filter}`);
      }
    }

    function formatISO8601Minutes(value: unknown): string {
      if (typeof value !== "number") {
        throw new Error(
          `Expected a number to format as ISO 8601 minutes, but got: ${value}`,
        );
      }
      return `PT${value}M`;
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

    if (cur === undefined || cur === null) {
      throw new Error(`Value not found: ${keys.join(".")}`);
    }
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
