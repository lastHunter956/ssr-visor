/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'us-east-1.linodeobjects.com',
        pathname: '/codigoverde01-bucket/**',
      },
    ],
  },
  output: 'standalone',
}

export default nextConfig
