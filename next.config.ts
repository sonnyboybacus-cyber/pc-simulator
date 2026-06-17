import type { NextConfig } from "next";

const isStatic = process.env.EXPORT_STATIC === 'true';

const nextConfig: NextConfig = {
  output: isStatic ? 'export' : undefined,
  basePath: isStatic ? '/pc-simulator' : '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: isStatic ? '/pc-simulator' : '',
  },
};

export default nextConfig;
