import { getPaginatedUserGists, GitHubGist } from "./_includes/github.ts";
import { consume } from "./_includes/utils.ts";

declare global {
  interface Gist {
    id: string;
    github_url: string;
    title?: string;
    description?: string;
    files: GistFile[];
    created_at: Date;
    updated_at: Date;
  }

  interface GistFile {
    name: string;
    language?: string;
    content?: string;
    size: number;
  }

  interface GistPageData {
    type: "gist";
    url: string;
    created_at: Date;
    updated_at: Date;
    gist: Gist;
    layout?: SiteLayout;
    title?: string;
    content?: string;
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
    const indexFile = gist.files.find((file) => file.name === "index.html");

    if (!gist.files.some((file) => file.name.endsWith(".html"))) {
      continue;
    }

    const common = {
      type: "gist" as const,
      url: `/gists/${gist.id}/`,
      title: `${gist.title}${config.titleSeparator}Gists`,
      description: gist.description,
      created_at: gist.created_at,
      updated_at: gist.updated_at,
      gist: gist,
    };

    if (indexFile) {
      yield {
        ...common,
        content: indexFile.content,
      };
    } else {
      yield {
        ...common,
        layout: "layouts/gist.page.tsx",
      };
    }

    for (const file of gist.files) {
      if (file === indexFile) {
        continue;
      }
      yield {
        type: "gist-file",
        url: `/gists/${gist.id}/${file.name}`,
        content: file.content,
      };
    }
  }
}

function isDisplayableGist(
  gist: GitHubGist,
) {
  return containsHtmlFile(gist) && !hasHideTag(gist);
}

function containsHtmlFile(
  gist: GitHubGist,
) {
  return Object.values(gist.files).some((file) =>
    file.filename?.endsWith(".html")
  );
}

function hasHideTag(
  gist: GitHubGist,
) {
  return gist.description?.startsWith("[hide]") ?? false;
}

async function* getDisplayableGists(config: SiteConfig): AsyncGenerator<Gist> {
  for await (const response of getPaginatedUserGists(config.github.username)) {
    for (const gist of response.data) {
      if (isDisplayableGist(gist)) {
        const [title, description] = gist.description?.split(" // ", 2) ?? [];

        yield {
          id: gist.id,
          github_url: gist.html_url,
          title: title || gist.id,
          description: description || undefined,
          files: await consume(loadGistFiles(gist)),
          created_at: new Date(gist.created_at),
          updated_at: new Date(gist.updated_at),
        };
      }
    }
  }
}

async function* loadGistFiles(gist: GitHubGist): AsyncGenerator<GistFile> {
  for (const [filename, file] of Object.entries(gist.files)) {
    yield {
      name: filename,
      language: file.language,
      content: file.raw_url &&
        await fetch(file.raw_url).then((res) => res.text()),
      size: file.size ?? 0,
    };
  }
}
