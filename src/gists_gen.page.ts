import { getPaginatedUserGists, GitHubGist } from "./_includes/github.ts";
import { consume } from "./_includes/utils.ts";

declare global {
  interface Gist {
    id: string;
    github_url: string;
    title: string;
    description?: string;
    files: GistFile[];
    created_at: Date;
    updated_at: Date;
  }

  interface GistFile {
    name: string;
    language?: string;
    content: Uint8Array | string;
    size: number;
  }

  interface GistPageData extends Partial<Lume.Data> {
    type: "gist";
    url: string;
    layout: SiteLayout;
    title: string;
    description?: string;
    date: Date;
    dateUpdated: Date;
    // specific
    gist_id: string;
    gist_title: string;
    gist_url: string;
    screenshots: GistScreenshots;
  }

  interface GistFileData {
    type: "gist-file";
    url: string;
    name: string;
    gist_id: string;
    is_displayable: boolean;
    content: Uint8Array | string;
  }

  interface GistScreenshots {
    "1x1"?: string;
  }
}

export default async function* (
  { config }: Lume.Data,
  h: Lume.Helpers,
): AsyncGenerator<GistPageData | GistFileData> {
  const gists = await consume(getDisplayableGists(config));

  for (const gist of gists) {
    const gistUrl = `/gists/${gist.id}/`;

    const screenshots: GistScreenshots = {};

    for (const file of gist.files) {
      const fileUrl = `${gistUrl}/${file.name}`;

      switch (file.name) {
        case "screenshot-1x1.png":
          screenshots["1x1"] = fileUrl;
          break;
      }

      yield {
        type: "gist-file",
        url: `/gists/${gist.id}/${file.name}`,
        name: file.name,
        gist_id: gist.id,
        is_displayable: file.name.endsWith(".html"),
        content: file.content,
      };
    }

    yield {
      url: gistUrl,
      type: "gist",
      layout: "layouts/gist.page.tsx",
      title: `${gist.title}${config.titleSeparator}Gists`,
      description: gist.description,
      date: gist.created_at,
      dateUpdated: gist.updated_at,
      // specific
      gist_id: gist.id,
      gist_title: gist.title,
      gist_url: gist.github_url,
      screenshots: screenshots,
      // structured data
      structuredData: {
        "@type": "Article",
        mainEntityOfPage: "site-url:self",
        url: "site-url:self",
        headline: gist.title,
        author: "lume-data:config.data.author",
        datePublished: gist.created_at.toISOString(),
        dateModified: gist.updated_at.toISOString(),
        image: screenshots["1x1"] && h.url(screenshots["1x1"]),
      } satisfies ArticleSD,
    };
  }
}

async function* getDisplayableGists(config: SiteConfig): AsyncGenerator<Gist> {
  for await (const response of getPaginatedUserGists(config.github.username)) {
    for (const gist of response.data) {
      if (hasHideTag(gist)) {
        continue;
      }

      if (!containsDisplayableFiles(gist)) {
        continue;
      }

      const [title, description] = gist.description?.split(" // ", 2) ?? [];

      const files = await consume(loadGistFiles(gist));

      yield {
        id: gist.id,
        github_url: gist.html_url,
        title: title || gist.id,
        description: description || undefined,
        files: files,
        created_at: new Date(gist.created_at),
        updated_at: new Date(gist.updated_at),
      };
    }
  }
}

function hasHideTag(
  gist: GitHubGist,
) {
  return gist.description?.startsWith("[hide]") ?? false;
}

function containsDisplayableFiles(
  gist: GitHubGist,
) {
  return Object.values(gist.files).some((file) =>
    file.filename?.endsWith(".html")
  );
}

async function* loadGistFiles(gist: GitHubGist): AsyncGenerator<GistFile> {
  for (const [filename, file] of Object.entries(gist.files)) {
    if (file.raw_url === undefined) {
      continue;
    }

    const response = await fetch(file.raw_url);

    let content;

    if (isBinaryFile(filename)) {
      content = new Uint8Array(await response.arrayBuffer());
    } else {
      content = await response.text();
    }

    yield {
      name: filename,
      language: file.language,
      content: content,
      size: file.size ?? 0,
    };
  }
}

function isBinaryFile(filename: string) {
  return filename.endsWith(".png");
}
