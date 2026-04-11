import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**/*": ["./skills/**/*", "./content/**/*"],
  },
};

export default nextConfig;
