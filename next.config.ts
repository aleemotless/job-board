import type { NextConfig } from "next";
import { SERVER_ACTION_BODY_LIMIT_BYTES } from "./lib/config";

//standalone mode for Next.js
const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      // CV uploads (see lib/config.ts).
      bodySizeLimit: SERVER_ACTION_BODY_LIMIT_BYTES,
    },
  },
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
