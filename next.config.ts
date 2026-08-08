import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/hustle',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/hustle',
        permanent: true,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
