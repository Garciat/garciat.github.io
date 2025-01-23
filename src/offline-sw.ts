const self = globalThis as unknown as ServiceWorkerGlobalScope;

const listAllResources = async () => {
  const response = await fetch(import.meta.resolve("./resources.json"));
  const json = await response.json() as { resources: string[] };
  return json.resources;
};

const addResourcesToCache = async () => {
  const resources = await listAllResources();
  const cache = await caches.open("v1");
  await cache.addAll(resources);
  console.log(`Cached ${resources.length} resources`);
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache(),
  );
});

const cacheFirst = async (request: Request) => {
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }
  return fetch(request);
};

self.addEventListener("fetch", (event) => {
  event.respondWith(cacheFirst(event.request));
});
