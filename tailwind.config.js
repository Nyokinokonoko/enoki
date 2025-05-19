/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', "sans-serif"],
      },
      typography: {
        DEFAULT: {
          css: {
            a: {
              "text-decoration": "underline",
              "text-decoration-skip-ink": "none",
              "text-underline-offset": "2px",
              color: "inherit",
              "&:hover": {
                color: "inherit",
              },
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
