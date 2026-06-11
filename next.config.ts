import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json in $HOME makes Next infer the wrong workspace root
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
