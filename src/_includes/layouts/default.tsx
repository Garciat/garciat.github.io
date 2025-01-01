export default ({ comp, url, children }: Lume.Data, _helpers: Lume.Helpers) => {
  return (
    <html>
      <comp.Head />

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
