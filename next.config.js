/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  images: {
    domains: [
      'logos-world.net',
      'www.afrilandfirstbank.com',
      'www.banqueatlantique.net',
      'www.cbccameroon.com',
      'ecobank.com',
      'av.sc.com',
      'www.ubagroup.com'
    ]
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  }
}

module.exports = nextConfig