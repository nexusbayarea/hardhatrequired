import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    "@iie/sdk",
    "@iie/layout-engine",
    "@iie/product-manifests",
    "@iie/mobile-runtime",
    "@iie/hhr",
  ],
};

export default nextConfig;
