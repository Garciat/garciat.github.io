export async function timed<T>(
  task: Promise<T> | (() => T | Promise<T>),
): Promise<{ value: T; duration: Temporal.Duration }> {
  const start = performance.now();
  const value = await (typeof task === "function" ? task() : task);
  const end = performance.now();
  return {
    value,
    duration: Temporal.Duration.from({
      microseconds: Math.round(1_000 * (end - start)),
    }),
  };
}

export async function withTimeTag<T>(
  promise: Promise<T>,
  cb: (tag: string) => void,
): Promise<T> {
  const result = await timed(promise);

  cb(`${result.duration.total("milliseconds").toFixed(3)} ms`);

  return result.value;
}
