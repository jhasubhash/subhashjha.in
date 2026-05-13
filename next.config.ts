import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/apps/:appName",
        destination: "/apps/:appName/index.html",
        permanent: false,
      },
      {
        source: "/apps/:appName/",
        destination: "/apps/:appName/index.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
