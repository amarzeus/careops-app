/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*"],
  serverExternalPackages: ["better-sqlite3"],
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
};

export default nextConfig;
