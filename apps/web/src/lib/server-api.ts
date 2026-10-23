import "server-only";

import { createClient, createConfig } from "@/lib/api/client";

// Server Components ходят в FastAPI напрямую (внутри docker-сети),
// браузер — через Caddy по относительному пути /api.
export const serverClient = createClient(
  createConfig({ baseUrl: process.env.API_INTERNAL_URL ?? "http://localhost:8000" }),
);
