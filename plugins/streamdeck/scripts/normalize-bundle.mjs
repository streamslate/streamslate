import { readFile, writeFile } from "node:fs/promises";

const bundleFiles = [
  "ai.flexinfer.streamslate.sdPlugin/bin/plugin.js",
  "ai.flexinfer.streamslate.sdPlugin/bin/plugin.js.map",
];

await Promise.all(
  bundleFiles.map(async (file) => {
    const contents = await readFile(file, "utf8");
    await writeFile(
      file,
      contents.replaceAll("\r\n", "\n").replaceAll("\r", "")
    );
  })
);
