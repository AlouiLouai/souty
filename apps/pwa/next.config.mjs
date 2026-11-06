import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const immutable = { key: "Cache-Control", value: "public, max-age=31536000, immutable" };

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; Next compiles them in place.
  transpilePackages: ["@souty/brand", "@souty/vocabulary"],
  // Trace server files from the monorepo root, not this app's folder.
  outputFileTracingRoot: workspaceRoot,
  async headers() {
    return [
      { source: "/models/:path*", headers: [immutable] },
      { source: "/wasm/:path*", headers: [immutable] },
      {
        // Must always revalidate, or returning visitors never get updates.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
