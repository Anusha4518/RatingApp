/** @type {import('next').NextConfig} */
const nextConfig = {
  // We only use Next.js for the API (backend only).
  // This turns off some things we don't need for a pure API server.
  reactStrictMode: false,
};

module.exports = nextConfig;
