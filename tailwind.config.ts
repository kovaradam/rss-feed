import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{ts,tsx}"],
  theme: {
    extend: {
      lineClamp: {
        10: "10",
      },
      colors: {
        accent: "#ff5678",
      },
    },
  },

  plugins: [
    plugin(({ addVariant }) => {
      addVariant("active-scroll", "body.scroll &");
    }),
  ],
} satisfies Config;
