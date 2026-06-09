/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // MVP 배포용 — 타입 에러 무시
  },
  eslint: {
    ignoreDuringBuilds: true, // ESLint 경고도 무시
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
