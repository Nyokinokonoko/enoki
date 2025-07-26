// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

const isProduction = process.env.NODE_ENV === "production";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),

  vite: {
    define: {
      "import.meta.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "production"
      ),
    },
    plugins: [tailwindcss()],
    build: {
      sourcemap: !isProduction,
      minify: isProduction ? "terser" : false,
      ...(isProduction && {
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
          mangle: {
            toplevel: true,
          },
          format: {
            comments: false,
          },
        },
      }),
    },
  },

  site: "https://notes.kinokonoko.io",
});
