export default (
  { comp, url, title, children }: Lume.Data,
  _helpers: Lume.Helpers,
) => {
  return (
    <html>
      <comp.Head title={title} />

      <body>
        <comp.Sidebar url={url} />

        <div class="content sidebar-adapt container">
          {children}
        </div>

        <comp.Footer sidebarAdapt={true} />

        <comp.Analytics />
      </body>
    </html>
  );
};
