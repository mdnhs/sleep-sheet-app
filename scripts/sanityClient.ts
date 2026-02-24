// sanityClient.ts
import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: "4qv1i1vf",
  dataset: "production",
  apiVersion: "2024-11-11",
  useCdn: false,
  token:
    "skFX10eyRNoORakYcgTXSrChXjYMUT1XDsKin0Is7Qnm9v6a5f2Q2GVXWcCBg2h9Lphvhr0cFejsw2r9qInkJMyOPIt41MYI73G4RFy65a8oJZiHQqs2gZrLiAmISEJCL5DrMK4P7HAp03IAAhG8lucSqHt3XRAkAW6KZGsA0RqQ8ZvpiMMr",
});
