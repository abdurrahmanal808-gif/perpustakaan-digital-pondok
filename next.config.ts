import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  serverActions: {
    bodySizeLimit: "2mb"
  }
};

export default nextConfig;
