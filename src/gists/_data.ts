import { getPaginatedUserGists, GitHubGist } from "../_includes/github.ts";
import { consume, sortByUpdatedAt } from "../_includes/utils.ts";

function isDisplayableGist(
  gist: GitHubGist,
) {
  return Object.values(gist.files).some((file) =>
    file.filename?.endsWith(".html")
  );
}

async function* getDisplayableGists(): AsyncGenerator<Gist> {
  for await (const response of getPaginatedUserGists("Garciat")) {
    for (const gist of response.data) {
      if (isDisplayableGist(gist)) {
        yield {
          id: gist.id,
          github_url: gist.html_url,
          description: gist.description ?? undefined,
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
    };
  }
}

export const gists = sortByUpdatedAt(await consume(getDisplayableGists()));

declare global {
  interface Gist {
    id: string;
    github_url: string;
    description?: string;
    files: GistFile[];
    created_at: Date;
    updated_at: Date;
  }

  interface GistFile {
    name: string;
    language?: string;
    content?: string;
  }

  namespace Lume {
    interface Data {
      gists: Gist[];
    }
  }
}
