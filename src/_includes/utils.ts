export async function consume<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items = [];
  for await (const item of iterable) {
    items.push(item);
  }
  return items;
}

export function sortedByDate<
  T extends { [P in K]: Date },
  K extends keyof T,
>(
  key: K,
  items: T[],
  { ascending = false } = {},
): T[] {
  return items.toSorted((a, b) => {
    const dateA = a[key].getTime();
    const dateB = b[key].getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

export function pickAll<
  T extends { [P in K]?: unknown },
  K extends keyof T,
>(
  key: K,
  items: T[],
): NonNullable<T[K]>[] {
  const out = [];
  for (const item of items) {
    if (item[key] !== undefined && item[key] !== null) {
      out.push(item[key]);
    }
  }
  return out;
}

export function setDateModified(page: Lume.Page, ...components: Date[][]) {
  const componentsMax = datesMax(components.flat());

  page.data.dateModified = datesMax([
    componentsMax ?? page.data.date,
    page.data.dateModified ?? page.data.date,
  ]);
}

export function datesMax(dates: Date[]): Date | undefined {
  if (dates.length === 0) {
    return;
  }
  let max = dates[0];
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] > max) {
      max = dates[i];
    }
  }
  return max;
}
