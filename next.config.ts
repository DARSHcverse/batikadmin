import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Photos are shrunk in the browser to 3.5 MB at most; this leaves room for the form overhead
      // while staying under Vercel's 4.5 MB request limit.
      bodySizeLimit: "4mb",
    },
  },
  // sharp has native code; keep it out of the bundle so Vercel installs the right build.
  serverExternalPackages: ["sharp"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
