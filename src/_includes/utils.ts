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
