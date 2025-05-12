import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Add this block to ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

// export default withContentlayer(nextConfig);
export default nextConfig;
