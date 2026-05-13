import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/apps/:appName",
        destination: "/apps/:appName/index.html",
      },
    ];
  },
};

export default nextConfig;
