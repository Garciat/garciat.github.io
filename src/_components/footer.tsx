export default ({ config }: Lume.Data, _helpers: Lume.Helpers) => {
  return (
    <footer class="content container">
      <p>
        Built with <a href="https://www.typescriptlang.org/">TypeScript</a>,
        {" "}
        <a href="https://lume.land">Lume</a>, and{" "}
        <a href="https://preactjs.com">Preact</a>.
      </p>
      <p>
        Hosted by GitHub Pages &mdash;{" "}
        <a
          href={`https://github.com/${config.github.repo}/tree/${config.github.branch}`}
        >
          source
        </a>.
      </p>
      <p>
        {shieldGitHubWorkflowLastRun(
          config.github.repo,
          config.github.branch,
          config.github.buildWorkflow,
        )}
      </p>
    </footer>
  );
};

function shieldGitHubWorkflowLastRun(
  repo: string,
  branch: string,
  workflow: string,
  status: string = "completed",
) {
  const apiUrl =
    `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/runs?status=${status}&per_page=1&branch=${branch}`;
  const query = `$.workflow_runs[0].run_started_at`;
  return shieldDynamicJSON(apiUrl, query, "Last Build");
}

function shieldDynamicJSON(url: string, query: string, label: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedQuery = encodeURIComponent(query);
  const encodedLabel = encodeURIComponent(label);
  return (
    <img
      alt={label}
      src={`https://img.shields.io/badge/dynamic/json?url=${encodedUrl}&query=${encodedQuery}&label=${encodedLabel}`}
    />
  );
}
