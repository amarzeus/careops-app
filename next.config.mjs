/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*"],
  serverExternalPackages: ["better-sqlite3", "razorpay"],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
