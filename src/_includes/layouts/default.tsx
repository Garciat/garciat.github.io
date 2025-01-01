export default (
  { comp, url, title, children }: Lume.Data,
  _helpers: Lume.Helpers,
) => {
  return (
    <html>
      <comp.Head title={title} />

      <body>
        <comp.Sidebar url={url} />

        <div class="content container">
          {children}
        </div>

        <comp.Footer />

        <comp.Analytics />
      </body>
    </html>
  );
};
