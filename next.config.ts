import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Block access to database files
        source: "/:path*.db",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          // Rewrite .db file requests to a 404 page
          source: "/:path*.db",
          destination: "/not-found",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
