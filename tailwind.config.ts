import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366F1", // indigo-500 — 브랜드 메인 컬러
          light: "#EEF2FF",
          dark: "#4338CA",
        },
        signal: {
          dinner: "#F97316",  // 저녁 메이트
          coffee: "#A78BFA",  // 커피 한잔
          tour: "#34D399",    // 투어 동행
          chat: "#60A5FA",    // 그냥 얘기
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans KR", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
