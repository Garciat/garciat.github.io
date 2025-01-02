import moment from "npm:moment";

import { getPaginatedUserRepos, GitHubRepository } from "./_includes/github.ts";
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
          created_at: new Date(project.created_at ?? 0),
          updated_at: new Date(project.updated_at ?? project.created_at ?? 0),
          is_archived: project.topics?.includes("archived") ?? false,
        };
      }
    }
  }
}

const [projects, projectsArchived] = await (async () => {
  const projects = await consume(getGitHubProjects());

  return [
    projects.filter((project) => !project.is_archived),
    projects.filter((project) => project.is_archived),
  ];
})();

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
        <time datetime={project.updated_at.toISOString()}>
          {moment(project.updated_at).fromNow()}
        </time>
      </span>
    </p>
    <p class="message">
      {project.description}
    </p>
  </>
);

export default (_data: Lume.Data, _helpers: Lume.Helpers) => {
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
