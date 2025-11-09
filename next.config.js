/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.openf1.org', 'ergast.com'],
  },
}

module.exports = nextConfig
