const immutable = { key: "Cache-Control", value: "public, max-age=31536000, immutable" };

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
