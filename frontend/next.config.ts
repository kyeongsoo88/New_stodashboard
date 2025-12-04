import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Prevent automatic browser opening
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
