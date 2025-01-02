export async function consume<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items = [];
  for await (const item of iterable) {
    items.push(item);
  }
  return items;
}

export function sortByUpdatedAt<T extends { updated_at: Date }>(
  items: T[],
): T[] {
  return items.toSorted((a, b) =>
    b.updated_at.getTime() - a.updated_at.getTime()
  );
}
