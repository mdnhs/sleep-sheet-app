// sanityClient.ts
import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: "53m5v2j3",
  dataset: "production",
  apiVersion: "2024-11-11",
  useCdn: false,
  token:
    "skaoSf5nltwWEq4AKMUEQHiOzFFA61xA8o8XbbUAJyvSziZjxrX6JM1ULVP5jPGagcIZlTdiBnVDBou9DIegLpvexB9CPePp5TAXFxchs5pq0nGD75BHJZWTpfy87C9UvUuJSVXgswSM5GwlGhlROSOsamvD598EFehq8sn8CpD2eDxFeA7f",
});
