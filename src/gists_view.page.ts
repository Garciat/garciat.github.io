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
    content: string;
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
    gist_title: string;
    gist_url: string;
    displayables: Array<{ url: string; name: string }>;
  }

  interface GistFileData {
    type: "gist-file";
    url: string;
    content?: string;
  }
}

export default async function* (
  { config }: Lume.Data,
): AsyncGenerator<GistPageData | GistFileData> {
  const gists = await consume(getDisplayableGists(config));

  for (const gist of gists) {
    const displayables = [];

    for (const file of gist.files) {
      const fileUrl = `/gists/${gist.id}/${file.name}`;
      if (file.name.endsWith(".html")) {
        displayables.push({
          url: fileUrl,
          name: file.name,
        });
      }
      yield {
        type: "gist-file",
        url: fileUrl,
        content: file.content,
      };
    }

    yield {
      url: `/gists/${gist.id}/`,
      type: "gist",
      layout: "layouts/gist.page.tsx",
      title: `${gist.title}${config.titleSeparator}Gists`,
      description: gist.description,
      date: gist.created_at,
      dateUpdated: gist.updated_at,
      // specific
      gist_title: gist.title,
      gist_url: gist.github_url,
      displayables: displayables,
      // structured data
      structuredData: [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              item: "site-url:/gists/",
              name: "Gists", // TODO: refer to page title
            },
            {
              "@type": "ListItem",
              position: 2,
              name: gist.title,
            },
          ],
        } satisfies BreadcrumpListSD,
      ],
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
    yield {
      name: filename,
      language: file.language,
      content: await fetch(file.raw_url).then((res) => res.text()),
      size: file.size ?? 0,
    };
  }
}
