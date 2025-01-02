export default ({ api, query, label }: Lume.Data) => {
  const url = new URL("https://img.shields.io/badge/dynamic/json");
  url.searchParams.set("url", api);
  url.searchParams.set("query", query);
  url.searchParams.set("label", label);
  return (
    <img
      alt={label}
      src={url.toString()}
    />
  );
};
