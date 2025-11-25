/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost"],
  },
  swcMinify: true,
  output: "standalone",
};

module.exports = nextConfig;
