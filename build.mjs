/* eslint-env node */
import { build, context } from "esbuild";
import babel from "esbuild-plugin-babel";
import copy from "esbuild-plugin-copy";
import process from "process";

const args = process.argv.slice(2);

const doWatch = args.some((a) => a === "--watch" || a === "-w");

const watchPlugin = {
  name: "watch",
  setup(build) {
    build.onEnd((result) => {
      const date = new Date();

      // eslint-disable-next-line no-undef
      console.log(
        `[${date.toTimeString()}] Build ${result.errors.length ? "failed" : "succeeded"}.`,
      );
    });
  },
};

const config = {
  entryPoints: {
    ghostrider: "./src/index.ts",
  },
  bundle: true,
  minifySyntax: true,
  platform: "node",
  target: "rhino1.7.14",
  external: ["kolmafia"],
  plugins: [
    babel(),
    ...(doWatch ? [watchPlugin] : []),
    copy({
      assets: {
        from: "src/scripts/ghostchoice.ash",
        to: ".",
      },
    }),
  ],
  outdir: "KoLmafia/scripts/ghostrider/",
  loader: { ".json": "text" },
  inject: ["./kolmafia-polyfill.js"],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
};

if (doWatch) {
  const ctx = await context(config);
  await ctx.watch();
} else {
  await build(config);
}
