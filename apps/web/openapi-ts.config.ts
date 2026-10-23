import { defineConfig } from "@hey-api/openapi-ts";

// openapi.json генерируется из FastAPI: `make gen-client` в корне репо.
export default defineConfig({
  input: "./openapi.json",
  output: "src/lib/api",
  plugins: ["@hey-api/client-fetch"],
});
