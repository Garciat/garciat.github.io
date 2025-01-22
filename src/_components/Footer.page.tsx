import {
  getConfigRepositoryURL,
  getConfigWorkflowRunRequestURL,
  getWorkflowRunStartedAtQuery,
} from "../_includes/github.ts";

export default (
  { comp, config }: Lume.Data,
  _h: Lume.Helpers,
) => {
  return (
    <footer class="content container">
      <p>
        <select id="color-scheme-selector" />
      </p>
      <p>
        Built with <a href="https://www.typescriptlang.org/">TypeScript</a>,
        {" "}
        <a href="https://lume.land">Lume</a>, and{" "}
        <a href="https://preactjs.com">Preact</a>.
      </p>
      <p>
        Hosted by GitHub Pages &mdash;{" "}
        <a href={getConfigRepositoryURL(config)}>
          view source
        </a>.
      </p>
      <p>
        <comp.BadgeDynamic
          api={getConfigWorkflowRunRequestURL(config)}
          query={getWorkflowRunStartedAtQuery()}
          label="Last Build"
        />
      </p>
    </footer>
  );
};
