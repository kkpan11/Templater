import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import toml from "esbuild-plugin-toml";

import path from "path";
import fs from "fs";

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const wasmPlugin = (config) => {
    return {
        name: "wasm",
        setup(build) {
            build.onResolve({ filter: /\.wasm$/ }, (args) => {
                if (args.resolveDir === "") {
                    return;
                }
                return {
                    path: path.isAbsolute(args.path)
                        ? args.path
                        : path.join(args.resolveDir, args.path),
                    namespace: `wasm-${config.mode}`,
                };
            });
            build.onLoad(
                { filter: /.*/, namespace: "wasm-deferred" },
                async (args) => ({
                    contents: await fs.promises.readFile(args.path),
                    loader: "file",
                })
            );
            build.onLoad(
                { filter: /.*/, namespace: "wasm-embed" },
                async (args) => ({
                    contents: await fs.promises.readFile(args.path),
                    loader: "binary",
                })
            );
        },
    };
};

const prod = process.argv[2] === "production";
const test_build = process.argv[2] === "test" || process.argv[3] === "test";

let entry_point;
let outfile;
if (!test_build) {
    entry_point = "src/main.ts";
    outfile = "main.js";
} else {
    entry_point = "tests/main.test.ts";
    outfile = "main.test.js";
}

esbuild
    .build({
        banner: {
            js: banner,
        },
        entryPoints: [entry_point],
        bundle: true,
        external: [
            "obsidian",
            "electron",
            "@codemirror/autocomplete",
            "@codemirror/closebrackets",
            "@codemirror/collab",
            "@codemirror/commands",
            "@codemirror/comment",
            "@codemirror/fold",
            "@codemirror/gutter",
            "@codemirror/highlight",
            "@codemirror/history",
            "@codemirror/language",
            "@codemirror/lint",
            "@codemirror/matchbrackets",
            "@codemirror/panel",
            "@codemirror/rangeset",
            "@codemirror/rectangular-selection",
            "@codemirror/search",
            "@codemirror/state",
            "@codemirror/stream-parser",
            "@codemirror/text",
            "@codemirror/tooltip",
            "@codemirror/view",
            ...builtins,
        ],
        format: "cjs",
        watch: !prod,
        target: "es2020",
        logLevel: "info",
        sourcemap: prod ? false : "inline",
        treeShaking: true,
        minify: prod,
        plugins: [toml(), wasmPlugin({ mode: "embed" })],
        outfile: outfile,
    })
    .catch(() => process.exit(1));
