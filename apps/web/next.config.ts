import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/srs",
        destination: "/growth",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/growth",
        permanent: true,
      },
      {
        source: "/dashboard/profile",
        destination: "/growth",
        permanent: true,
      },
      {
        source: "/dashboard/practice",
        destination: "/arena",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
