interface BadgeStaticProps {
  altText: string;
  label?: string;
  message: string;
  color: string;
  logo?: string;
}

export default (
  { label, message, logo, color, altText }: Lume.Data & BadgeStaticProps,
) => {
  const badgeContent = formatBadgeContent(label, message, color);

  const url = new URL(`https://img.shields.io/badge/${badgeContent}`);
  if (logo) {
    url.searchParams.set("logo", logo);
  }

  return (
    <img
      alt={altText}
      src={url.toString()}
    />
  );
};

function formatBadgeContent(
  label: string | undefined,
  message: string,
  color: string,
): string {
  if (label) {
    return `${formatText(label)}-${formatText(message)}-${color}`;
  } else {
    return `${formatText(message)}-${color}`;
  }
}

function formatText(t: string): string {
  return t.replaceAll("-", "--")
    .replaceAll("_", "__")
    .replaceAll(" ", "_");
}
