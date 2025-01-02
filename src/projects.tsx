import moment from "npm:moment";

import {
  getConfigPagesURL,
  getPaginatedUserRepos,
  GitHubRepository,
} from "./_includes/github.ts";
import { consume, sortedByDate } from "./_includes/utils.ts";

export const type = "page";

export const layout = "layouts/page.tsx";

export const title = "Projects";

export const description = "Projects I've worked on.";

interface Project {
  name: string;
  github_url: string;
  homepage: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  is_archived: boolean;
}

export default async ({ config }: Lume.Data, _helpers: Lume.Helpers) => {
  const allProjects = await consume(getGitHubProjects(config));

  const [projects, projectsArchived] = [
    allProjects.filter((project) => !project.is_archived),
    allProjects.filter((project) => project.is_archived),
  ];

  return (
    <>
      <ul>
        {sortedByDate("created_at", projects).map((project) => (
          <li>
            <ProjectView project={project} />
          </li>
        ))}
      </ul>
      <hr />
      <h3>Archived Projects</h3>
      <ul>
        {sortedByDate("created_at", projectsArchived).map((project) => (
          <li>
            <ProjectView project={project} />
          </li>
        ))}
      </ul>
    </>
  );
};

function isGitHubProject(repo: GitHubRepository) {
  return repo.has_pages && repo.topics?.includes("showcase-project");
}

async function* getGitHubProjects(config: SiteConfig): AsyncGenerator<Project> {
  for await (const response of getPaginatedUserRepos(config.github.username)) {
    for (const repo of response.data) {
      if (isGitHubProject(repo)) {
        yield {
          name: repo.name,
          github_url: repo.html_url,
          homepage: repo.homepage || getConfigPagesURL(config, repo.name),
          description: repo.description ?? undefined,
          created_at: new Date(repo.created_at ?? 0),
          updated_at: new Date(repo.updated_at ?? repo.created_at ?? 0),
          is_archived: repo.topics?.includes("archived") ?? false,
        };
      }
    }
  }
}

const ProjectView = ({ project }: { project: Project }) => (
  <>
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
    </p>
    <p>
      <span>
        {"Created on "}
        <time datetime={project.created_at.toISOString()}>
          {moment(project.created_at).format("MMMM D, YYYY")}
        </time>
      </span>
      {" — "}
      <span>
        {"Updated  "}
        <time datetime={project.updated_at.toISOString()} class="relative-time">
          {moment(project.updated_at).fromNow()}
        </time>
      </span>
    </p>
    <p class="message">
      {project.description}
    </p>
  </>
);
