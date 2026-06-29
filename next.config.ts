import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true, // TODO: remove when route params are migrated to async
  },
};

export default nextConfig;
