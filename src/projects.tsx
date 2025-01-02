import moment from "npm:moment";

import { getPaginatedUserRepos, GitHubRepository } from "./_includes/github.ts";
import { consume, sortByUpdatedAt } from "./_includes/utils.ts";

export const layout = "layouts/page.tsx";

export const type = "page";

export const title = "Projects";

interface Project {
  name: string;
  github_url: string;
  homepage: string;
  description?: string;
  updated_at: Date;
}

function isGitHubProject(repo: GitHubRepository) {
  return repo.has_pages && repo.topics?.includes("showcase-project");
}

async function* getGitHubProjects(): AsyncGenerator<Project> {
  for await (const response of getPaginatedUserRepos("Garciat")) {
    for (const project of response.data) {
      if (isGitHubProject(project)) {
        yield {
          name: project.name,
          github_url: project.html_url,
          homepage: project.homepage || `https://garciat.com/${project.name}`,
          description: project.description ?? undefined,
          updated_at: new Date(project.updated_at ?? project.created_at ?? 0),
        };
      }
    }
  }
}

const projects = sortByUpdatedAt(await consume(getGitHubProjects()));

export default (_data: Lume.Data, _helpers: Lume.Helpers) => {
  return (
    <>
      <ul>
        {projects.map((project) => (
          <li>
            <p>
              <a href={project.homepage}>{project.name}</a>
              {" — "}
              <a href={project.github_url}>
                <img
                  alt="GitHub Repository"
                  src="https://img.shields.io/badge/GitHub-source-blue?logo=GitHub
                  "
                />
              </a>
              <br />
              Updated {moment(project.updated_at).fromNow()}
            </p>
            <p class="message">
              {project.description}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
};
