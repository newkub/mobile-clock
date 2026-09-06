import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dbCredentials: {
    databaseId: "b079b188-64f0-42f6-87dd-98f6e93dc346",
  },
});
