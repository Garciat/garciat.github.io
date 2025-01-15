enum ColorScheme {
  system = "◐ OS Default",
  dark = "☾ Dark",
  light = "☀︎ Light",
}

const ColorSchemeDefault: keyof typeof ColorScheme = "system";

export default (_data: Lume.Data, h: Lume.Helpers) => {
  return (
    <>
      <select
        id="color-scheme-selector"
        data-default={ColorSchemeDefault}
      >
        {Object.entries(ColorScheme).map(([key, name]) => (
          <option value={key}>{name}</option>
        ))}
      </select>
      <script type="module" src={h.url("/public/js/color-scheme.js")}>
      </script>
    </>
  );
};
