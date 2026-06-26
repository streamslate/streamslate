import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/plugin.ts",
  output: {
    file: "ai.flexinfer.streamslate.sdPlugin/bin/plugin.js",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    resolve({
      exportConditions: ["node"],
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      noEmit: false,
      declaration: false,
      declarationMap: false,
      sourceMap: true,
    }),
  ],
};
