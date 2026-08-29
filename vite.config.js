import { defineConfig } from "vite";
import { sites } from "@openai/sites-vite-plugin";
import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

function preserveClassicScriptsAndWorker() {
  return {
    name: "preserve-classic-scripts-and-worker",
    apply: "build",
    async closeBundle() {
      for (const file of ["app.js", "journey.js", "ai-tv.js"]) {
        await copyFile(resolve(file), resolve("dist", file));
      }

      await mkdir(resolve("dist", "server"), { recursive: true });
      await copyFile(resolve("server", "index.js"), resolve("dist", "server", "index.js"));
    },
  };
}

export default defineConfig({
  plugins: [sites(), preserveClassicScriptsAndWorker()],
});
